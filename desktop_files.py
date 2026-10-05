"""Explicit, scoped reads of a selected Minecraft instance for the shared designer."""
from pathlib import Path
from assets import MC, instance_path, scope_path, read_json

def home_for(instance):
    path=instance_path(instance)
    return path if (path/'mods').is_dir() else MC

def list_files(instance):
    path=instance_path(instance);home=home_for(instance)
    schematics=[dict(path=p.relative_to(home/'schematics').as_posix(),name=p.name,bytes=p.stat().st_size) for p in (home/'schematics').rglob('*') if p.is_file() and p.suffix.lower() in ('.nbt','.schem','.litematic')]
    worlds=[]
    for world in sorted((home/'saves').iterdir()) if (home/'saves').is_dir() else []:
        if world.is_dir() and (world/'level.dat').is_file():
            worlds.append(dict(id=world.name,dimensions=[p.relative_to(world).as_posix() for p in world.rglob('region') if p.is_dir() and any(p.glob('*.mca'))]))
    resources=[];vanilla=[path/(instance+'.jar')]
    parent=read_json(path/(instance+'.json')).get('inheritsFrom')
    if isinstance(parent,str) and parent:vanilla.append(scope_path(MC/'versions',parent)/(parent+'.jar'))
    for file in vanilla:
        if file.is_file():resources.append(dict(kind='vanilla',path=file.relative_to(MC/'versions').as_posix(),name=file.name,bytes=file.stat().st_size))
    for kind,folder,suffixes in [('mod',home/'mods',('.jar',)),('resourcepack',home/'resourcepacks',('.zip',))]:
        for file in sorted(folder.glob('*')):
            if file.is_file() and file.suffix.lower() in suffixes:resources.append(dict(kind=kind,path=file.name,name=file.name,bytes=file.stat().st_size))
    return dict(schematics=schematics,worlds=worlds,resources=resources)

def read_file(instance,kind,relative):
    home=home_for(instance)
    allowed={'schematic':(home/'schematics',('.nbt','.schem','.litematic')),'mod':(home/'mods',('.jar',)),'resourcepack':(home/'resourcepacks',('.zip',)),'vanilla':(MC/'versions',('.jar',))}
    if kind not in allowed:raise ValueError('未知文件类型')
    root,suffixes=allowed[kind];file=scope_path(root,relative)
    if not file.is_file() or file.suffix.lower() not in suffixes:raise ValueError('请选择有效的蓝图、模组或材质包文件')
    if kind=='vanilla' and relative not in {r['path'] for r in list_files(instance)['resources'] if r['kind']=='vanilla'}:raise ValueError('原版文件不属于所选实例或其继承版本')
    return file
