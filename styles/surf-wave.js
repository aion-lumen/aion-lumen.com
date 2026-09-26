/* A continuous, overhanging water surface. The curl is geometry, not a backdrop. */
export function createBreaker(THREE) {
  const group = new THREE.Group();
  const uniforms = { uTime: { value: 0 } };
  const surface = `
    vec2 bezier(vec2 a, vec2 b, vec2 c, vec2 d, float t) {
      float q=1.-t; return q*q*q*a+3.*q*q*t*b+3.*q*t*t*c+t*t*t*d;
    }
    vec3 surface(vec2 uv) {
      float x=(uv.x-.5)*62.;
      vec2 p=uv.y<.55
        ? bezier(vec2(4.8,-.35),vec2(2.,-.3),vec2(-1.2,2.6),vec2(-.6,4.35),uv.y/.55)
        : bezier(vec2(-.6,4.35),vec2(-.2,6.1),vec2(3.4,5.9),vec2(2.25,2.65),(uv.y-.55)/.45);
      float shoulder=.56+.44*exp(-pow((x-3.)/13.,2.));
      float pulse=sin(x*.23-uTime*.65)*.15+sin(x*.59+uTime*.34)*.05;
      float ripple=sin(x*3.7+uv.y*29.-uTime*1.2)*sin(uv.y*3.14159)*.018;
      return vec3(x,p.y*shoulder+pulse*uv.y+ripple,p.x-5.+sin(x*.13+uTime*.19)*.3);
    }`;
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    vertexShader: `uniform float uTime; varying vec3 world; varying vec3 norm; varying vec2 coord; ${surface}
      void main(){coord=uv;vec3 p=surface(uv);vec3 a=surface(uv+vec2(.001,0.))-surface(uv-vec2(.001,0.));vec3 b=surface(uv+vec2(0.,.001))-surface(uv-vec2(0.,.001));norm=normalize(cross(a,b));world=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform float uTime; varying vec3 world; varying vec3 norm; varying vec2 coord;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec3 n=normalize(norm);if(!gl_FrontFacing)n=-n;
        vec3 eye=normalize(cameraPosition-world), light=normalize(vec3(-.5,1.,.55));
        float r=.55*noise(vec2(world.x*9.,coord.y*140.-uTime*.65))+.3*noise(vec2(world.x*19.,coord.y*260.-uTime))+.15*noise(vec2(world.x*43.,coord.y*480.+uTime));
        n=normalize(n+vec3(sin(world.x*17.+uTime)*.023,r*.045,cos(coord.y*190.+world.x)*.025));
        float fresnel=pow(1.-abs(dot(n,eye)),3.);
        float sun=max(0.,dot(n,light));
        vec3 deep=vec3(.015,.17,.37), crest=vec3(.13,.58,.73);
        vec3 c=mix(deep,crest,smoothstep(.6,4.8,world.y));
        c*=.62+.46*sun;
        c+=vec3(.14,.31,.40)*fresnel;
        float streak=pow(.5+.5*sin(world.x*5.8+noise(vec2(world.x*.7,coord.y*10.))*4.+coord.y*48.-uTime*.9),11.);
        c+=vec3(.19,.32,.35)*streak*.19;
        float edge=smoothstep(.915+.025*r,.99,coord.y);
        float lip=smoothstep(.62,.76,coord.y)*(1.-smoothstep(.81,.88,coord.y));
        float foam=clamp(edge*(.76+.24*r)+lip*.48*smoothstep(.40,.63,r),0.,1.);
        c=mix(c,vec3(.89,.97,1.),foam);
        float sparkle=pow(max(0.,dot(reflect(-light,n),eye)),70.);
        c+=vec3(.7,.82,.88)*sparkle*.35;
        float haze=smoothstep(21.,48.,distance(cameraPosition,world));
        c=mix(c,vec3(.69,.84,.94),haze);
        gl_FragColor=vec4(c,1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 220, 76), material);
  // The shader expands a unit plane into a large breaker, so its CPU bounds do not apply.
  mesh.frustumCulled = false;
  group.add(mesh);
  // Fine spray follows the lip and falls into the face; no billboard video.
  const count = 1050,
    seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seeds[i * 3] = (i * 0.61803398875) % 1;
    seeds[i * 3 + 1] = (i * 0.754877666) % 1;
    seeds[i * 3 + 2] = (i * 0.569840291) % 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(seeds, 3));
  const spray = new THREE.Points(
    geometry,
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `uniform float uTime; varying float fade; ${surface}
      void main(){float age=fract(position.y+uTime*.21);float u=.16+position.x*.68;vec3 p=surface(vec2(u,.985));p.x+=sin(position.z*38.)*age*.6;p.y+=sin(age*3.14159)*.48-age*age*2.4;p.z+=age*.65;fade=(1.-age)*.44;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((1.5+position.z*3.)*15./(-mv.z),1.,7.);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying float fade;void main(){float a=smoothstep(.5,.1,length(gl_PointCoord-.5));gl_FragColor=vec4(.87,.97,1.,a*fade);}`,
    }),
  );
  spray.frustumCulled = false;
  group.add(spray);
  return {
    group,
    update(time) {
      uniforms.uTime.value = time;
    },
  };
}
