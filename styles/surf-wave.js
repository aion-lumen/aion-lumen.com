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
      float ripple=sin(x*3.7+uv.y*29.-uTime*1.2)*sin(uv.y*3.14159)*.027;
      ripple+=sin(x*8.3-uv.y*51.+uTime*.8)*.009;
      float brokenLip=smoothstep(.86,1.,uv.y)*(sin(x*2.9+uTime*.9)*.044+sin(x*6.1-uTime*.5)*.019);
      return vec3(x,p.y*shoulder+pulse*uv.y+ripple+brokenLip,p.x-5.+sin(x*.13+uTime*.19)*.3);
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
        vec2 flow=vec2(world.x*2.3,coord.y*42.-uTime*.38);
        float broad=noise(flow*.34);
        vec2 warped=flow+vec2(noise(flow*.42+uTime*.08),noise(flow*.38-13.))*1.5;
        float grain=noise(warped*4.7);
        float fine=noise(warped*11.9);
        float ridges=1.-abs(2.*noise(warped*2.1)-1.);
        float rippleX=sin(world.x*25.+coord.y*11.+uTime*.8)*.02;
        float rippleY=sin(coord.y*230.+noise(vec2(world.x*3.,uTime*.1))*4.-uTime*1.3)*.015;
        n=normalize(n+vec3(rippleX+(grain-.5)*.055,rippleY,(fine-.5)*.04));
        float fresnel=pow(1.-abs(dot(n,eye)),3.);
        float sun=max(0.,dot(n,light));
        vec3 deep=vec3(.018,.17,.34), crest=vec3(.10,.48,.68);
        vec3 c=mix(deep,crest,smoothstep(.6,4.8,world.y));
        c*=.62+.46*sun;
        c+=vec3(.13,.26,.35)*fresnel;
        // Fine flowing highlights follow the curl rather than repeating a flat stripe.
        float streak=pow(.5+.5*sin(world.x*8.1+broad*5.+coord.y*39.-uTime*.7),15.);
        c+=vec3(.13,.24,.30)*streak*.24;
        c+=vec3(.07,.14,.18)*pow(ridges,9.)*.17;
        float crestBand=smoothstep(.59,.72,coord.y)*(1.-smoothstep(.81,.88,coord.y));
        float lipFront=smoothstep(.91+.035*broad,.991,coord.y);
        float lace=smoothstep(.70,.96,ridges)*(.3+.7*grain);
        float foamIslands=smoothstep(.47,.70,noise(warped*.82)+grain*.15);
        float foam=clamp(lipFront*(.72+.25*grain)+crestBand*(foamIslands*.57+lace*.35),0.,1.);
        // Thin broken trails flow away from the crest into the dark face.
        float trails=smoothstep(.70,.89,coord.y)*(1.-smoothstep(.925,.98,coord.y));
        foam+=trails*pow(noise(vec2(world.x*14.,coord.y*9.-uTime*.18)),7.)*.44;
        vec3 foamColor=mix(vec3(.64,.82,.91),vec3(.93,.98,1.),fine*.55+.45);
        c=mix(c,foamColor,clamp(foam,0.,1.));
        float sparkle=pow(max(0.,dot(reflect(-light,n),eye)),100.);
        c+=vec3(.7,.82,.88)*sparkle*.42;
        float haze=smoothstep(21.,48.,distance(cameraPosition,world));
        c=mix(c,vec3(.69,.84,.94),haze);
        gl_FragColor=vec4(c,1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 240, 96), material);
  // The shader expands a unit plane into a large breaker, so its CPU bounds do not apply.
  mesh.frustumCulled = false;
  group.add(mesh);
  // Fine spray follows the lip and falls into the face; no billboard video.
  const count = 1350,
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
