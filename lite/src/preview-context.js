export class PreviewContext{
 constructor(){this.scene=null;}
 observe(scene){if(!scene?.workspaceId||!Number.isInteger(scene.revision))return null;const old=this.scene;this.scene={workspaceId:scene.workspaceId,revision:scene.revision};return !old?null:old.workspaceId!==scene.workspaceId?'workspace':old.revision!==scene.revision?'revision':null;}
 matches(result){return !!this.scene&&result.workspaceId===this.scene.workspaceId&&result.revision===this.scene.revision;}
}
export function absentReferences(items,selected){const known=new Set(items.map(i=>i.id));return selected.filter(id=>id&&!known.has(id));}
