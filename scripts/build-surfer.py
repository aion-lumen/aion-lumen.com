"""Build a dressed, rigged surfer from CC0 anatomy and original styling.
Run with Blender 4.5 in background. See assets/surf/character-sources.json.
"""
import bpy, json, math, argparse, sys
from pathlib import Path
from mathutils import Vector, Matrix
parser=argparse.ArgumentParser(description='Build the rigged Aion Lumen surfer from CC0 source assets.')
parser.add_argument('--sources',type=Path,required=True)
parser.add_argument('--workdir',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
P=args.workdir.resolve();P.mkdir(parents=True,exist_ok=True);(P/'evidence').mkdir(exist_ok=True)
S=args.sources.resolve()

def refresh_preview_assets(output):
    """Invalidate the scene and model URLs together after a candidate rebuild."""
    import hashlib, re
    repository=Path(__file__).resolve().parents[1]
    if output != repository/'assets/surf/surfer.glb':return
    script=repository/'styles/surf.js'
    revision=hashlib.sha256(output.read_bytes()).hexdigest()[:12]
    text,count=re.subn(r'const characterRevision = "[a-f0-9]+";',f'const characterRevision = "{revision}";',script.read_text())
    if count!=1:raise RuntimeError('Expected one characterRevision in surf.js')
    script.write_text(text)
    scene_revision=hashlib.sha256(script.read_bytes()).hexdigest()[:12]
    for name in ['index.html','en.html']:
        page=repository/name
        text,count=re.subn(r'src="/styles/surf\.js(?:\?v=[^"]+)?"',f'src="/styles/surf.js?v={scene_revision}"',page.read_text())
        if count!=1:raise RuntimeError(f'Expected one surf.js reference in {name}')
        page.write_text(text)

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
verts=[]; faces=[]; group=''
for ln in (S/'base.obj').read_text().splitlines():
    if ln.startswith('v '): verts.append(Vector(map(float,ln.split()[1:])))
    elif ln.startswith('g '): group=ln[2:]
    elif ln.startswith('f ') and group=='body': faces.append([int(x.split('/')[0])-1 for x in ln.split()[1:]])
for name,weight in [('caucasian-male-young.target',.82),('caucasian-male-old.target',.18),('universal-male-young-averagemuscle-averageweight.target',.72),('universal-male-young-maxmuscle-averageweight.target',.28)]:
    for ln in (S/name).read_text().splitlines():
        if not ln.strip() or ln.startswith('#'):continue
        data=ln.split();verts[int(data[0])]+=Vector(map(float,data[1:]))*weight
used=sorted(set(i for f in faces for i in f)); remap={v:i for i,v in enumerate(used)}
floor=min(verts[i].y for i in used)
def convert(v):return Vector((v.x*.1,-v.z*.1,(v.y-floor)*.1))
coords=[convert(v) for v in verts]
rigdata=json.loads((S/'default.mhskel').read_text())
def joint(name):
    ids=rigdata['joints'][name];return sum((coords[i] for i in ids),Vector())/len(ids)
# Preserve the source's anatomical weights, including hands, toes and face.
armdata=bpy.data.armatures.new('Surfer joints'); arm=bpy.data.objects.new('SurferRig',armdata);bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,b in rigdata['bones'].items():
    bone=armdata.edit_bones.new(name);bone.head=joint(b['head']);bone.tail=joint(b['tail'])
    if (bone.tail-bone.head).length<.0001:bone.tail.z+=.001
for name,b in rigdata['bones'].items():
    if b['parent']:armdata.edit_bones[name].parent=armdata.edit_bones[b['parent']]
bpy.ops.object.mode_set(mode='OBJECT');arm.select_set(False)
mesh=bpy.data.meshes.new('Surfer continuous surface');mesh.from_pydata([coords[i] for i in used],[],[[remap[i] for i in f] for f in faces]);mesh.update()
body=bpy.data.objects.new('Surfer — skin and wetsuit',mesh);bpy.context.collection.objects.link(body)
weights=json.loads((S/'default_weights.mhw').read_text())['weights']
for name,values in weights.items():
    vg=body.vertex_groups.new(name=name)
    for idx,w in values:
        if idx in remap and w>0:vg.add([remap[idx]],w,'REPLACE')
def mat(name,hexcolor,rough=.65):
    srgb=[int(hexcolor[i:i+2],16)/255 for i in (0,2,4)];c=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in srgb);m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=rough
    return m
skin=mat('Skin · warm matte','c59070',.69);navy=mat('Neoprene · deep navy','18374d',.83);blue=mat('Neoprene · cobalt panels','285d94',.78);hairmat=mat('Hair · dark brown','302017',.83)
# Vertex colour boundaries interpolate smoothly across the anatomical mesh.
# Skin uses head/hand weights and height; this keeps fingers and the entire face exposed.
cloth=bpy.data.materials.new('Skin and tailored navy wetsuit');cloth.use_nodes=True
bs=cloth.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.76
col=cloth.node_tree.nodes.new('ShaderNodeVertexColor');col.layer_name='SurfaceColor';cloth.node_tree.links.new(col.outputs['Color'],bs.inputs['Base Color'])
mesh.materials.append(cloth)
attr=mesh.color_attributes.new(name='SurfaceColor',type='FLOAT_COLOR',domain='POINT')
handweights={}
for name,values in weights.items():
    if any(name.startswith(k) for k in ['wrist','finger','metacarpal']):
        for i,w in values:handweights[i]=handweights.get(i,0)+w
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
skinc=Vector(skin.diffuse_color[:3]);navyc=Vector(navy.diffuse_color[:3]);bluec=Vector(blue.diffuse_color[:3])
for old,i in remap.items():
    v=mesh.vertices[i].co
    exposed=max(smooth(1.500,1.512,v.z),1-smooth(.112,.123,v.z),smooth(.36,.84,handweights.get(old,0)))
    shoulder=smooth(.155,.218,abs(v.x))*smooth(1.05,1.25,v.z)
    sidepanel=smooth(.10,.145,abs(v.x))*(1-smooth(.165,.19,abs(v.x)))*smooth(.9,1.0,v.z)*(1-smooth(1.29,1.36,v.z))
    outerleg=smooth(.19,.235,abs(v.x))*(1-smooth(.26,.29,abs(v.x)))*smooth(.19,.3,v.z)*(1-smooth(.78,.9,v.z))
    knee=math.exp(-((abs(v.x)-.153)/.075)**4-((v.z-.50)/.098)**4)*(1-smooth(-.015,.035,v.y))
    c=navyc.lerp(bluec,max(shoulder,sidepanel,outerleg)*.95)
    c=c.lerp(navyc*.58,knee*.65).lerp(skinc,exposed)
    attr.data[i].color=(*c,1)
for poly in mesh.polygons:poly.use_smooth=True
# A single subdivision improves the silhouette; reduce it for the browser.
bpy.context.view_layer.objects.active=body;body.select_set(True)
sub=body.modifiers.new('Surface refinement','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
dec=body.modifiers.new('Web density','DECIMATE');dec.ratio=.43;bpy.ops.object.modifier_apply(modifier=dec.name)
mod=body.modifiers.new('Anatomical deformation','ARMATURE');mod.object=arm;mod.use_deform_preserve_volume=False
body.parent=arm;body.select_set(False)
# Attach small independent surfaces to the anatomical head using the same armature.
def bind(obj,bone='head'):
    vg=obj.vertex_groups.new(name=bone);vg.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Head deformation','ARMATURE');mod.object=arm;obj.parent=arm
    for p in obj.data.polygons:p.use_smooth=True
    return obj
# Hair is a fitted scalp surface, displaced into short swept waves.
hairverts=[];hairfaces=[];hmap={}
for f in faces:
    pts=[coords[i] for i in f]
    def on_scalp(v):
        # Higher at the forehead, lower at the back and around the ears.
        front=max(0,min(1,(-v.y+.025)/.165));return v.z>1.615+front*.102 and abs(v.x)<.095
    if not all(on_scalp(v) for v in pts):continue
    nf=[]
    for i in f:
        if i not in hmap:
            v=coords[i].copy();center=Vector((0,-.022,1.69));n=(v-center).normalized()
            top=max(0,min(1,(v.z-1.65)/.085))
            loft=.006+.028*top + .012*top*max(0,1-abs(v.x-.025)/.08)
            loft+=.0035*math.sin(v.x*95+v.y*62)*top
            v+=n*loft;hmap[i]=len(hairverts);hairverts.append(v)
        nf.append(hmap[i])
    hairfaces.append(nf)
hm=bpy.data.meshes.new('Sculpted short hair');hm.from_pydata(hairverts,[],hairfaces);hm.materials.append(hairmat);ho=bpy.data.objects.new('Short swept hair',hm);bpy.context.collection.objects.link(ho)
bpy.context.view_layer.objects.active=ho;ho.select_set(True);sub=ho.modifiers.new('Hair surface','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name);ho.select_set(False);bind(ho)
# Short tapered locks follow the crown; the source scalp remains a continuous base.
from mathutils.bvhtree import BVHTree
scalp=BVHTree.FromPolygons([v.co for v in ho.data.vertices],[list(p.vertices) for p in ho.data.polygons])
def surface_z(x,y):
    hit,normal,index,distance=scalp.ray_cast(Vector((x,y,2.0)),Vector((0,0,-1)))
    return hit.z if hit is not None else None
locks=[]
for k in range(72):
    x=-.071+(k%12)*.012; y=-.092+(k//12)*.023
    samples=[(x,y),(x+.009,y+.016),(x+.019,y+.032)]
    if any(surface_z(xx,yy) is None for xx,yy in samples):continue
    curve=bpy.data.curves.new('Swept lock','CURVE');curve.dimensions='3D';curve.bevel_depth=.0036;curve.bevel_resolution=2
    sp=curve.splines.new('BEZIER');sp.bezier_points.add(2)
    for point,(xx,yy),radius in zip(sp.bezier_points,samples,[.40,1,.03]):
        point.co=(xx,yy,surface_z(xx,yy)+.0015);point.handle_left_type='AUTO';point.handle_right_type='AUTO';point.radius=radius
    o=bpy.data.objects.new('Hair lock',curve);bpy.context.collection.objects.link(o);o.data.materials.append(hairmat)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');bind(o);o.select_set(False);locks.append(o)
# One hair mesh and one material call, including the fitted sculpted locks.
bpy.ops.object.select_all(action='DESELECT');ho.select_set(True)
for o in locks:o.select_set(True)
bpy.context.view_layer.objects.active=ho;bpy.ops.object.join();ho.select_set(False)
# Eyes sit behind the actual modelled lids. The iris is a curved shallow surface.
white=mat('Eyes · warm white','cabfac',.34);iris=mat('Iris · hazel','463b29',.46);pupil=mat('Pupil','080b0c',.22)
def sphere(name,loc,scale,material,segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=16,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
    # Armature expects all vertices in its coordinate space.
    bpy.ops.object.transform_apply(location=True,rotation=False,scale=False);bind(o);o.select_set(False);return o
for side in ['L','R']:
    c=joint('eye.'+side+'____head');c.y-=.001
    sphere('Eye '+side,c,(.0125,.0125,.0125),white)
    sphere('Iris '+side,c+Vector((0,-.0122,0)),(.0054,.0014,.0054),iris)
    sphere('Pupil '+side,c+Vector((0,-.01335,0)),(.0024,.0007,.0024),pupil)
# Simplified eyebrows follow the brow ridge, not separate joint spheres.
for sign in [-1,1]:
    c=joint('eye.'+('L' if sign==1 else 'R')+'____head')
    sphere('Brow',c+Vector((sign*.002,-.0135,.021)),(.017,.0025,.0038),hairmat)
# Solve each anatomical limb as two rigid segments. Split/twist bones within a
# thigh or shin must follow the segment; they are not additional knee joints.
from mathutils import Quaternion
scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=73;scene.render.fps=24
for pb in arm.pose.bones:pb.rotation_mode='QUATERNION'

def bone_pose(name, transform):
    arm.pose.bones[name].matrix=transform @ arm.data.bones[name].matrix_local
    bpy.context.view_layer.update()

def segment_transform(a,b,c,d):
    # One rigid rotation/translation, preserving source length and skin volume.
    rotation=(b-a).rotation_difference(d-c).to_matrix().to_4x4()
    return Matrix.Translation(c) @ rotation @ Matrix.Translation(-a)

def hinge(a,b,upper,lower,pole):
    axis=(b-a).normalized();distance=(b-a).length
    assert abs(upper-lower)+.001 < distance < upper+lower-.001, f'Limb target out of reach: {distance:.3f}, maximum {upper+lower:.3f}, start {tuple(a)}, target {tuple(b)}'
    along=(upper*upper-lower*lower+distance*distance)/(2*distance)
    bend=pole-a; bend=(bend-axis*bend.dot(axis)).normalized()
    return a+axis*along+bend*math.sqrt(max(0,upper*upper-along*along))

def limb(side,upper,lower,end,target,pole):
    first=upper+'01.'+side; middle=lower+'01.'+side;last=end+'.'+side
    a=arm.data.bones[first].head_local.copy();b=arm.data.bones[middle].head_local.copy();c=arm.data.bones[last].head_local.copy()
    start=arm.pose.bones[first].head.copy()
    elbow=hinge(start,target,(b-a).length,(c-b).length,pole)
    top=segment_transform(a,b,start,elbow);bottom=segment_transform(b,c,elbow,target)
    for name in [upper+'01.'+side,upper+'02.'+side]:bone_pose(name,top)
    for name in [lower+'01.'+side,lower+'02.'+side]:bone_pose(name,bottom)
    return start,elbow,target,bottom

metrics=[]
for frame in range(1,74,2):
    scene.frame_set(frame);phase=(frame-1)/72*math.tau
    # Start from rest every sample: fixed soles, soft crouch, chest slightly forward.
    for pb in arm.pose.bones:pb.matrix_basis=Matrix.Identity(4)
    root_shift=Vector((.004*math.sin(phase),.082,-.265+.004*math.cos(phase)))
    bone_pose('root',Matrix.Translation(root_shift))
    for name,angle in [('spine05',.045),('spine03',.055),('spine01',.015)]:
        pb=arm.pose.bones[name];pivot=pb.head.copy();current=pb.matrix.copy()
        pb.matrix=Matrix.Translation(pivot) @ Matrix.Rotation(angle,4,'X') @ Matrix.Translation(-pivot) @ current
        bpy.context.view_layer.update()
    for side,sign in [('L',1),('R',-1)]:
        original_foot=arm.data.bones['foot.'+side].head_local.copy()
        ankle=Vector((sign*.405,-.025 if sign==1 else .025,original_foot.z))
        hip,knee,_,_=limb(side,'upperleg','lowerleg','foot',ankle,Vector((sign*.52,-1,.55)))
        # Feet keep the rest sole height and turn outward a little; toes follow.
        foot_transform=Matrix.Translation(ankle) @ Matrix.Rotation(sign*.17,4,'Z') @ Matrix.Translation(-original_foot)
        bone_pose('foot.'+side,foot_transform)
        flexion=math.degrees((hip-knee).angle(ankle-knee))
        assert knee.y < min(hip.y,ankle.y)-.12, 'Knee bends behind the stance'
        assert 85 < flexion < 150, 'Knee too straight or too tightly folded'
        metrics.append({'frame':frame,'side':side,'knee_angle':round(flexion,2),'hip':list(hip),'knee':list(knee),'ankle':list(ankle)})
        # Leading arm is lower and softly bent; trailing arm opens farther for balance.
        hand=Vector((.50,-.15,.90)) if sign==1 else Vector((-.61,-.015,1.025))
        shoulder,elbow,_,forearm=limb(side,'upperarm','lowerarm','wrist',hand,Vector((sign*.7,.07,.82 if sign==1 else .95)))
        # Continue the forearm with a relaxed wrist, rather than a bent-back palm.
        bone_pose('wrist.'+side,forearm)
    # Flex fingers around the world-space knuckle axis; left and right are mirrored.
    for side,sign in [('L',1),('R',-1)]:
        for name in arm.pose.bones.keys():
            if not name.startswith('finger') or not name.endswith('.'+side):continue
            if '-2.' not in name and '-3.' not in name:continue
            pb=arm.pose.bones[name];axis=arm.data.bones[name].matrix_local.to_3x3().inverted() @ Vector((1,0,0))
            pb.rotation_quaternion=Quaternion(axis,.15 if '-2.' in name else .10)
    bpy.context.view_layer.update()
    # Distribute the forward gaze through the neck instead of twisting only the head.
    for name,angle in [('neck01',.22),('neck02',.20),('neck03',.18),('head',.28+.01*math.sin(phase))]:
        pb=arm.pose.bones[name];axis=pb.matrix.to_3x3().inverted()@Vector((0,0,1))
        pb.rotation_quaternion=Quaternion(axis,angle);bpy.context.view_layer.update()
    for pb in arm.pose.bones:
        pb.keyframe_insert(data_path='location',frame=frame)
        pb.keyframe_insert(data_path='rotation_quaternion',frame=frame)
        pb.keyframe_insert(data_path='scale',frame=frame)
arm.animation_data.action.name='Balanced surf stance · anatomical knees'
(P/'evidence/pose-metrics.json').write_text(json.dumps(metrics,indent=2))

# A neutral blue studio preview for inspecting anatomy and foot contact.
scene.world.color=(.25,.32,.4)
def area(name,loc,power,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.95))-o.location).to_track_quat('-Z','Y').to_euler()
area('Key',(2,-4,4),360,4);area('Fill',(-3,-1,2.5),220,3);area('Rim',(0,3,3),420,3)
camdata=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',camdata);bpy.context.collection.objects.link(cam);cam.location=(2.5,-4.8,2.0);cam.rotation_euler=(Vector((0,0,.92))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=2.3;scene.camera=cam
scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=1100;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'surfer.blend'))
# Export only the figure, no studio, to the candidate.
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
for o in arm.children:o.select_set(True)
output=args.output.resolve();output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_anim_single_armature=True,export_yup=True,export_apply=False,export_cameras=False,export_lights=False,export_extras=False)
refresh_preview_assets(output)
scene.render.filepath=str(P/'evidence/character-preview.png');bpy.ops.render.render(write_still=True)
print('EXPORT_READY',output,output.stat().st_size,'body vertices',len(body.data.vertices),'hair',len(ho.data.vertices))
