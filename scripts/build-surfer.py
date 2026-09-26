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
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
verts=[]; faces=[]; group=''
for ln in (S/'base.obj').read_text().splitlines():
    if ln.startswith('v '): verts.append(Vector(map(float,ln.split()[1:])))
    elif ln.startswith('g '): group=ln[2:]
    elif ln.startswith('f ') and group=='body': faces.append([int(x.split('/')[0])-1 for x in ln.split()[1:]])
for name,weight in [('caucasian-male-young.target',1),('universal-male-young-averagemuscle-averageweight.target',.72),('universal-male-young-maxmuscle-averageweight.target',.28)]:
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
    c=navyc.lerp(bluec,max(shoulder,sidepanel,outerleg)*.8).lerp(skinc,exposed)
    attr.data[i].color=(*c,1)
for poly in mesh.polygons:poly.use_smooth=True
# A single subdivision improves the silhouette; reduce it for the browser.
bpy.context.view_layer.objects.active=body;body.select_set(True)
sub=body.modifiers.new('Surface refinement','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
dec=body.modifiers.new('Web density','DECIMATE');dec.ratio=.43;bpy.ops.object.modifier_apply(modifier=dec.name)
mod=body.modifiers.new('Anatomical deformation','ARMATURE');mod.object=arm;mod.use_deform_preserve_volume=True
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
            loft=.005+.011*max(0,min(1,(v.z-1.65)/.10))
            loft+=.004*math.sin(v.x*160+v.y*90)*max(0,min(1,(v.z-1.65)/.08))
            v+=n*loft;hmap[i]=len(hairverts);hairverts.append(v)
        nf.append(hmap[i])
    hairfaces.append(nf)
hm=bpy.data.meshes.new('Sculpted short hair');hm.from_pydata(hairverts,[],hairfaces);hm.materials.append(hairmat);ho=bpy.data.objects.new('Short swept hair',hm);bpy.context.collection.objects.link(ho)
bpy.context.view_layer.objects.active=ho;ho.select_set(True);sub=ho.modifiers.new('Hair surface','SUBSURF');sub.levels=1;bpy.ops.object.modifier_apply(modifier=sub.name);ho.select_set(False);bind(ho)
# Short tapered locks follow the crown; the source scalp remains a continuous base.
from mathutils.kdtree import KDTree
scalp=KDTree(len(hairverts))
for n,v in enumerate(hairverts):scalp.insert((v.x,v.y,0),n)
scalp.balance()
def surface_z(x,y):
    near=scalp.find_n((x,y,0),4)
    return sum(hairverts[i].z/(d+.001) for _,i,d in near)/sum(1/(d+.001) for _,i,d in near)
locks=[]
for k in range(22):
    x=-.063+(k%8)*.017; y=-.082+(k//8)*.045
    curve=bpy.data.curves.new('Swept lock','CURVE');curve.dimensions='3D';curve.bevel_depth=.0028;curve.bevel_resolution=2
    sp=curve.splines.new('BEZIER');sp.bezier_points.add(2)
    for point,(xx,yy),radius in zip(sp.bezier_points,[(x,y),(x+.007,y+.018),(x+.014,y+.041)],[.75,1,.05]):
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
# Pose helpers remain private and are baked before export.
controls=[]
def target(name,point):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=point;controls.append(o);return o
feet={}
for side,sign in [('L',1),('R',-1)]:
    start=joint('foot.'+side+'____head');foot=target('Foot contact '+side,(sign*.47,-.01,start.z));feet[side]=foot
    pole=target('Knee direction '+side,(sign*.4,-1.0,.7))
    con=arm.pose.bones['lowerleg02.'+side].constraints.new('IK');con.target=foot;con.pole_target=pole;con.chain_count=4;con.use_stretch=False
    # A copy-rotation target preserves flat feet, including toes, while knees flex.
    rot=target('Foot orientation '+side,start);rot.rotation_euler=arm.data.bones['foot.'+side].matrix_local.to_euler();rot.rotation_euler.z+=sign*.17
    cr=arm.pose.bones['foot.'+side].constraints.new('COPY_ROTATION');cr.target=rot;cr.target_space='WORLD';cr.owner_space='WORLD'
# Arm targets are just below shoulder height, with the hands relaxed.
for side,sign in [('L',1),('R',-1)]:
    hand=target('Hand balance '+side,(sign*.64,-.10,1.07 if sign==1 else 1.12));pole=target('Elbow direction '+side,(sign*.8,-.22,.66))
    con=arm.pose.bones['lowerarm02.'+side].constraints.new('IK');con.target=hand;con.pole_target=pole;con.chain_count=4;con.use_stretch=False
    wrist=arm.data.bones['wrist.'+side]
    direction=(wrist.tail_local-wrist.head_local).normalized()
    desired=Vector((sign*.75,-.12,-.4)).normalized()
    rot=target('Wrist orientation '+side,hand.location)
    rot.rotation_mode='QUATERNION';rot.rotation_quaternion=direction.rotation_difference(desired)@wrist.matrix_local.to_quaternion()
    cr=arm.pose.bones['wrist.'+side].constraints.new('COPY_ROTATION');cr.target=rot;cr.target_space='WORLD';cr.owner_space='WORLD'
# A gentle finger curl removes the spread-palm resting shape.
for name in arm.pose.bones.keys():
    if name.startswith('finger') and ('-2.' in name or '-3.' in name):
        pb=arm.pose.bones[name];pb.rotation_mode='XYZ';pb.rotation_euler.x=.16 if name.endswith('.L') else -.16
# Continuous loop: root varies by millimetres; fixed IK targets keep feet planted.
scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=73;scene.render.fps=24
root=arm.pose.bones['root'];root.rotation_mode='QUATERNION'
head=arm.pose.bones['head'];head.rotation_mode='QUATERNION'
for frame,phase in [(1,0),(19,math.pi/2),(37,math.pi),(55,math.pi*1.5),(73,math.pi*2)]:
    scene.frame_set(frame)
    # Root's local orientation is not assumed: convert the desired world shift.
    root.location=arm.data.bones['root'].matrix_local.to_3x3().inverted()@Vector((math.sin(phase)*.008,-.035,-.19+math.cos(phase)*.005))
    root.keyframe_insert(data_path='location',frame=frame)
    # Small look toward the leading shoulder; broad body orientation happens in web scene.
    axis=arm.data.bones['head'].matrix_local.to_3x3().inverted()@Vector((0,0,1))
    from mathutils import Quaternion
    head.rotation_quaternion=Quaternion(axis,.32+math.sin(phase)*.015);head.keyframe_insert(data_path='rotation_quaternion',frame=frame)
scene.frame_set(1)
# Bake constraints for portable glTF animation; retain all skin joints and no runtime IK cost.
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.select_all(action='SELECT')
bpy.ops.nla.bake(frame_start=1,frame_end=73,step=2,only_selected=True,visual_keying=True,clear_constraints=True,use_current_action=True,bake_types={'POSE'})
bpy.ops.object.mode_set(mode='OBJECT');arm.animation_data.action.name='Quiet balance · feet planted'
for obj in controls:bpy.data.objects.remove(obj,do_unlink=True)
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
scene.render.filepath=str(P/'evidence/character-preview.png');bpy.ops.render.render(write_still=True)
print('EXPORT_READY',output,output.stat().st_size,'body vertices',len(body.data.vertices),'hair',len(ho.data.vertices))
