# 自由建筑设计接口 v1

设计器提供场景数据、编辑事务与可见反馈。AI 可以直接构建任意体素结构；生成器、构件、分组、动画都是可选能力。现有调色板不是方块 ID 白名单，未知模型可以在之后补充。

## 调用入口

独立 HTML 和本地服务页面共用公开入口：

```js
await window.CraftStudio.request({
  schema: 'craftstudio-design/1',
  id: 'unique-request-id',
  method: 'workspace.describe',
  params: {}
});
```

Worker 的 `api` 动作使用同一请求。无需接触私有变量或模拟 UI 点击。该入口在当前页面内提供；不会自动向外开放不经认证的 HTTP 写接口。现有 MCP/完整版 API 暂仍使用自己的接口，尚未统一到 v1。

返回 `{schema,id,ok,workspaceId,revision,value}`，失败返回 `error:{code,message,details}`。操作失败不会部分写入。读取时可提供 `expectedRevision`，防止分页途中场景变更。实际写入、撤销、重做必须带最新 `expectedRevision`；同时带 `workspaceId` 可检测工程切换。

有 ID 的写请求可重试，近期 256 个写请求保存回执；相同 ID 与不同内容会返回 `REQUEST_ID_REUSED`。工程切换后回执缓存清空。不要把这个缓存当作永久任务日志。

## 基础方法

| 方法 | 主要参数 | 结果 |
|---|---|---|
| workspace.describe | — | 能力、版本、坐标范围、原点、蓝图掩码计数 |
| scene.readRegion | min,max,space?,includeAir?,limit?,cursor?,expectedRevision?,transactionId? | 精确方块及 NBT、后续游标、总量 |
| scene.getBlocks | positions,space?,transactionId? | 精确位置、状态、NBT、放置语义 |
| terrain.readColumns | min,max,space?,limit?,cursor?,transactionId? | 原场地逐列 ground/water/top；未知为 null |
| materials.search | query?,offset?,limit? | 文件资源中的候选与已有状态；restricted=false |
| edit.apply | expectedRevision,workspaceId?,operations,policy?,space? | 原子写入、一条撤销记录 |
| transaction.begin | expectedRevision,policy? | transactionId 与基准版本 |
| transaction.apply | transactionId,operations,space? | 仅暂存，不改变实际场景 |
| transaction.inspect | transactionId,offset?,limit? | 暂存方案概要及分页变更 |
| transaction.commit | transactionId,workspaceId? | 检查基准版本，整笔提交 |
| transaction.abort | transactionId | 放弃暂存 |
| objects.list | transactionId? | 自由对象、实际成员坐标、动画 |
| objects.put | expectedRevision 或 transactionId；object:{id?,name,cells:[[x,y,z],…]}；space? | 任意成员组合；名称和类型不绑定模板 |
| selection.transform | expectedRevision 或 transactionId；min,max,at,turn?,mirror?,move?,count?,step?,policy?,space? | 选区变换，保留对象成员关系 |
| history.undo / history.redo | expectedRevision,workspaceId? | 撤销 / 重做 |

`space` 为 `local`（默认）或 `world`；世界坐标可以为负。世界坐标操作要求已确认原点。读取结果始终返回局部坐标，同时提供原点或可由 describe 获取原点。局部范围 0–4095 是当前存储实现的边界，不是建筑形状限制。读取单页最多 20,000 项，可继续翻页。

分页 `cursor` 是同一选区内的偏移，不能更换选区后继续使用。分页建议每次带第一次读取的 `expectedRevision`。稀疏读取返回所有已占用位置；`includeAir:true` 则逐格返回空位。

## 编辑表达

支持 `set(pos,state,nbt?,expect?)`、`fill(min,max,state)`、`erase(min,max)`、`replace(from,state)`。所有范围包含终点，坐标是整数。`state` 为 `{Name:'namespace:block',Properties:{facing:'north',…}}`，`nbt` 使用 `{t:10,v:{…}}` 类型化 Compound，保留长整数精度。

`expect` 用于 set 的状态前置条件，null 表示期望空气；不符合时返回 `CELL_CONFLICT`。精确状态比较不包含 NBT 内容，NBT 使用场景版本检查保证当前事务基准。

默认策略为 `{allowTerrain:false,allowExisting:false}`，遵守用户保留区域。用户授权改变场地后可以明确调整策略；策略不限制建筑风格或形状。`structure_void` 表示跳过，不是空气删除，也不是实体方块。

```js
const d = (await CraftStudio.request({method:'workspace.describe'})).value;
const begin = await CraftStudio.request({
  id:'begin-arch-01', method:'transaction.begin',
  params:{expectedRevision:d.revision, policy:{allowTerrain:false,allowExisting:false}}
});
const transactionId = begin.value.transactionId;
// AI 自行计算任意曲面、拱、斜屋顶等位置，不必调用任何生成器。
await CraftStudio.request({id:'batch-01',method:'transaction.apply',params:{
  transactionId, operations:[
    {type:'set',pos:[10,70,12],state:{Name:'create:cut_limestone_bricks'}},
    {type:'set',pos:[11,71,12],state:{Name:'create:cut_limestone_brick_stairs',Properties:{facing:'east',half:'bottom',shape:'straight',waterlogged:'false'}}}
  ]
}});
// 可以继续提交更多批次、读取暂存结果，最后一次提交。
await CraftStudio.request({id:'commit-01',method:'transaction.commit',params:{transactionId,workspaceId:d.workspaceId}});
```

事务 commit 默认采用 begin 时的基准版本。如果用户或其他客户端在期间编辑，返回 `REVISION_CONFLICT`；事务仍保留，可查看、取消并重新规划。多个批次提交后只需一次撤销。

Create 的运动预览由方块状态、原生模型及装置 NBT 自动决定；不接受单独的 animation 参数，返回 CREATE_MANAGED_ANIMATION。既有文件中的 Create 风车外观信息保留兼容；普通对象不使用通用手动动画。

## 蓝图语义

原版 / Create NBT 的显式结构空位压缩存为 `metadata.placementMask`。`scene.getBlocks` 和 includeAir 的读取会给出 `placement`：

- `block`：实际方块，编辑后优先于原掩码。
- `skip`：structure_void，保留目标现场。
- `erase`：文件明确保存的空气，可按用户意图删除。
- `empty`：普通空位，没有明确施工指令。

合并默认只放实际方块；显式空气需要选择“应用蓝图中的显式空气删除”，并满足改动策略。完整 NBT 导出恢复跳过与空气掩码；新增 / 变更导出不会复制原文件的大面积掩码。此掩码适配目前覆盖原版 / Create NBT，其他格式仍保留各自的读取限制。

## 视觉反馈与保存

`CraftStudio.setView({position:[x,y,z],target:[x,y,z],fov:45,projection:"orthographic"})` 可自由调整相机；projection 也可为 perspective，使用局部场景坐标。`CraftStudio.captureView()` 返回 PNG 数据 URL 和相机位置，供多模态 AI 观察；用户继续直接看交互 3D。`await CraftStudio.save()` 使用当前页面的工程名保存正式版本，本地草稿仍自动保存。版本包含基准场地、任意方块改动、对象和资源附件。`await CraftStudio.export({format:"nbt",kind:"full"})` 可取得完整 NBT；kind 也支持 additions / patch。format 为 craftlite 时输出完整可恢复工程，schem 则输出新增建筑 Sponge V3。导出返回字节数据，外部客户端可选择保存位置。

当前读写入口是页面 / Worker API，已有 AI 按钮支持一次提案和预览；自动循环调用这些工具的外部 AI / MCP 客户端尚需单独连接。底座不要求 AI 使用预设建筑分类。

## 图形、曲线与自动地形

工具栏新增图形 / 曲线、地形入口。直线、矩形、圆、椭圆、圆弧、多边形、长方体及 3–8 控制点贝塞尔曲线可以预览；控制点可用三轴手柄拖动，或从场景拾取。闭合图形可填充。

辅助线和实际方块预览独立显示，预览不修改场景；确认后一次提交，可撤销。辅助线随工程保存但不导出为 Minecraft 方块。曲线按半格映射半砖，上下半部、楼梯上升朝向和拱腹方向分别处理。若同系素材不存在，不伪造 ID，使用主体并提示指定半砖 / 楼梯。

地形支持当前高度上的贴地曲线、自动落地支撑、局部整平、邻域中值平滑、连续坡面和沿设计高度挖填。实际高度来自当前场地数据；保留水面和受阻列，缺数据不造平地。确认前显示挖填与保护冲突。

公开接口增加 construction.prepare / construction.commit。prepare 参数为 {type:'geometry'|'terrain',config,policy}，返回预览 ID、辅助线、数量与冲突；includeMesh:true 可取得网格。commit 参数为 {id,policy,name?}，检查预览基准版本后提交。


### 轮廓建模

`construction.prepare` 支持 `params.type="feature"`，`params.config` 的 `operation` 为 `extrude`、`loft` 或 `sweep`。直接提供 `profiles: [[[x,y,z],...],...]`，或引用已保存辅助线的 `profileIds`。闭合截面要求同一 `plane`（xz / xy / yz）；放样至少两个不同标高的截面。拉伸参数为 `depth` 和 `symmetric`；共有参数 `state`、`hollow`、`thickness`、`caps`、`cut`。路径生成提供密集采样的 `path` 或保存的 `pathId`，以及 `width` / `height`，使用竖直矩形截面。

prepare 返回预览 ID、方块数量、保护冲突和辅助线，不修改场景。`construction.commit` 提交该 ID，拒绝已被场景变化作废的预览，记录辅助几何、建模对象并支持一次撤销。轮廓建模沿用场地保护规则；空心体和布尔切除在方块格上执行。此 prepare/commit 扩展当前不保证请求 ID 重放的幂等性。创建纯辅助轮廓可用 `type="geometry"` 和 `config.guidesOnly=true`。


### 设计师工具与检查

`construction.prepare` 的 `type="designer"` 使用同一个预览 / 提交契约。`config.objectIds` 为按选择顺序排列的对象 ID；也可传入 `config.selection:{min,max,members?}` 指定任意选区。`operation` 支持：

- `align`: `axis:x/y/z`，`edge:min/center/max`，`reference:first/last`。
- `distribute`: `axis`，`distribution:gaps/centers`。至少三个对象，保留首尾，整数落格。
- `array` / `instance`: `count`（含原件，2–100），`step:[dx,dy,dz]`。instance 需要一个已注册对象。
- `pathArray`: `path` 密集点数组或 `guideId`，`spacing`，`count`（最多副本数量），`follow`。
- `radialArray`: `center:[x,y,z]` 放置锚点圆心，`radius`，`angle`，`count`（副本数量），`follow`。保留原件，跟随朝向按 90 度吸附。
- `mirror`: `axis:x/z`，`plane` 整格或半格坐标，生成副本。
- `offset`: `guideId` 闭合轮廓，`distance`，`guidesOnly`，可选 `state`。新轮廓保存在 design.guides。
- `pushpull`: `axis`，`face:min/max`，`distance`；正值复制边界层，负值缩短选择。
- `boolean`: 恰好两个对象（主体在先），`mode:union/subtract/intersect`，`consumeTool`；按体素占用计算。
- `syncInstances` / `detachInstance`: 选择一个关联实例；同步主实例须未旋转。
- `editFeature`: 选择一个有 recipe 的 feature 对象，`parameters:{depth?,hollow?,thickness?,...}` 覆盖原参数。

变换操作目标重叠默认拒绝，`overlap:"overwrite"` 明确允许覆盖目标方块；操作仍受 `params.policy` 与保留区 / 对象锁控制。prepare 无修改，commit 一次撤销同时恢复方块、对象、轮廓、实例关系。

`design.inspect` 接收 `objectIds` 或 `selection`，返回精确尺寸、材料、分层计数、unsupportedCount、collisionsCount 与最多 200 个位置样本。`view.isolate` 接收同样选择；`{clear:true}` 恢复显示。隔离不改变工程方块和修订号，打开另一工程自动清除。

几何 prepare 的 `type="geometry"` 还支持 `snap:0/0.5/1`、`planeLock`、`constraint:free/horizontal/vertical/parallel/perpendicular/symmetric` 和 `referencePoints`。这些是局部绘图约束，不是全局 CAD 求解器。
