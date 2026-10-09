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

Worker 的 `api` 动作使用同一请求。无需接触私有变量或模拟 UI 点击。该入口在当前页面内提供；不会自动向外开放不经认证的 HTTP 写接口。当前页面 MCP 连接通过 designer_call 转发这个入口；旧 Python 兼容 API 仍保留独立工程，连接当前页面时拒绝旧命名空间写入。

返回 `{schema,id,ok,workspaceId,revision,value}`，失败返回 `error:{code,message,details}`。操作失败不会部分写入。读取时可提供 `expectedRevision`，防止分页途中场景变更。实际写入、撤销、重做必须带最新 `expectedRevision`；同时带 `workspaceId` 可检测工程切换。

有 ID 的成功写请求可重试，近期 256 条成功回执共用同一命名空间，包含普通编辑、事务、提案和建模请求。重试应完整复用原请求（包括原版本号），返回原回执且不重新执行；同 ID 配不同内容会返回 `REQUEST_ID_REUSED`。数字 `0` 与字符串 `"0"` 是不同 ID。历史回执不代表当前状态，需要另读 `workspace.describe`。工程切换会清空缓存。

本地计算版会将已确认操作的回执随检查点保存；重开后可继续重放。准备／取消预览、隔离和未提交事务的回执只在当前引擎会话有效，不会恢复已结束的临时任务。独立 Lite 的回执保留在当前 Worker 会话。不要把这些有界缓存当作永久任务日志。

## 提案审阅 / Proposal review

| Method | Parameters | Result |
|---|---|---|
| proposal.prepare | expectedRevision, workspaceId?, operations | value.id identifies the new candidate; replaces the previous candidate |
| proposal.inspect | cursor?, limit?, proposalId?, expectedRevision?, workspaceId? | Current candidate identity, summary, paged operations, total and nextCursor |
| proposal.commit | expectedRevision, workspaceId?, proposalId, policy? | Adopt this exact candidate as one undoable edit |
| proposal.cancel | proposalId | Discard this exact candidate and retain confirmed content |

Prepare/inspect return `value.changes: {add,replace,remove,terrain,total}`; the same values appear in `summary.proposal.changes`. Counts cover the complete cell diff against the currently confirmed scene, including removal of previously added blocks and NBT-only replacements. They exclude earlier confirmed building work and do not shrink to the current inspect page. `terrain` counts changed cells involving recognized ground or fluid states; placement permission remains controlled by the commit policy.

提案预览不会修改已确认场景。人的采用／取消以及 Enter／Esc 走同一接口；保护校验失败时，候选提案保留。`proposalId` 来自 `prepare.value.id`，与外层请求 ID 不同；新请求不能再次确认已结束或被替换的提案，原成功提交请求的重试则返回其回执。分页时原样传回 `nextCursor`，它已绑定提案身份；提案被替换或结束会返回 `PROPOSAL_CHANGED`。旧数值偏移仍兼容，建议同时提供 `proposalId`。可另带版本和工程保护。连接结果不确定时，先重试完整原请求或读取当前状态，避免盲目生成另一方案。

`workspace.describe.value.pending` 返回 `transactionIds`、`constructionId` 和 `strokeActive`，反映当前引擎实际任务。重放旧准备／取消回执不会重新开启已结束的任务。`api/planning-api.js` 组合提案／建模入口，`api/request-receipts.js` 统一请求身份校验、回执重放和持久化分类；普通编辑与规划请求沿用同一缓存。

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

`CraftStudio.setView({position:[x,y,z],target:[x,y,z],fov:45,projection:"orthographic"})` 可自由调整相机；projection 也可为 perspective，使用局部场景坐标。`CraftStudio.captureView()` 返回 PNG 数据 URL 和相机位置，供多模态 AI 观察；用户继续直接看交互 3D。`await CraftStudio.save()` 使用当前页面的工程名保存正式版本，本地草稿仍自动保存。版本包含基准场地、任意方块改动、对象和资源附件。`await CraftStudio.export({format:"nbt",kind:"full"})` 可取得完整 NBT；kind 也支持 additions / patch / selection。format 为 craftlite 时输出完整可恢复工程，schem 则输出新增建筑 Sponge V3。完整范围及工程导出返回字节数据；局部 NBT 返回含 bytes 和放置偏移的对象，外部客户端可选择保存位置。

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


### 本地增强层

`/api/desktop/info` 返回 `craftstudio-desktop/1`、会话令牌和实例元信息。共用页面仅在 loopback HTTP 下探测它。`/api/desktop/library` 是带令牌的便携工程库适配器，保留 gzip 工程字节和压缩草稿；不调用旧 Python 生成器重建建筑。`/api/desktop/files` 和 `/api/desktop/file` 只读取所选实例下的允许文件；`/api/desktop/world` 读取用户指定世界区域。游戏施工继续使用 `/api/lite/bridge`，视觉与建模接口仍为页面 / Worker 的 `CraftStudio.request`。

旧 `/api/project` 等接口为旧会话的兼容接口，不等同于页面 Worker 当前场景；新设计工具和同源 UI 均以 Worker API 为准。

新版本地服务默认 18767；仅为迁移旧浏览器工作区，允许同一本机的 18765 前端连接。`ServerLibrary` 使用检测返回的 baseUrl，Origin 与会话令牌仍检查。独立 Lite 或远端静态页面不执行该迁移探测。

## 可选画笔与条件接口：edit.brush

`edit.apply` 继续允许自由提交任意方块操作，不要求使用画笔、蒙版、材质库或预设模板。需要与人类工具一致的涂改行为时，使用 `edit.brush`。它通过同一事务/版本/回执机制执行，支持 `transactionId`，确认事务前不改变可见场景。

```js
const {revision} = await CraftStudio.request({method: 'workspace.describe'});
await CraftStudio.request({
  id: 'roof-material-1',
  method: 'edit.brush',
  params: {
    expectedRevision: revision,
    mode: 'paint',
    points: [[10, 4, 8], [11, 4, 8]],
    state: {Name: 'minecraft:stone_bricks'},
    retainShape: true,
    preserveProperties: true,
    mask: {
      surface: true,
      matchName: 'minecraft:oak_stairs',
      selection: {members: [[10, 4, 8], [11, 4, 8]]},
      minY: 4,
      maxY: 4
    },
    policy: {allowExisting: true, allowTerrain: false}
  }
});
```

`mode` 为 `draw`、`paint`、`erase` 或 `place`；`points` 是已经生成的整数落点，接口不代替 UI 的路径插值。条件按 AND 组合，`surface` 检查方块邻接的空气/已识别流体，`emptyOnly` 只允许空位，`matchName` 是固定取样名称。选择可以是 `min/max` 包围盒或 `members` 精确 XYZ 集合。`space:'world'` 时点、选区 XYZ 和 Y 范围都按已确认的场地原点换算；世界坐标成员必须为 XYZ 数组。

涂改不填空气或已识别流体。形态保留通过已知的材质变体完成，缺少对应变体会跳过，不虚构方块 ID。目标方块的已支持属性可以从原方块保留。带方块实体数据的位置若要改换方块类型会跳过；同类型操作显式保留原 NBT。场地、对象和保留区保护仍执行。结果包含 `filtered` 与 `warnings`。此机制不是完整 Minecraft 物理模拟，也不是任意 Mod 属性之间的自动转换器。

## 已保存草图与关联生成

`construction.prepare` 的 `type:'geometry'` 可传 `config.editGuideId`。配置仍包含 `kind/points/plane/state` 等原有几何参数；`updateDependents` 默认为 true，`manualStrategy` 默认为 `preserve`（保留手改和手动删除），显式 `overwrite` 则按新来源替换手改。预览会返回 `regeneration`、警告和实际改动网格，不修改工程。用原有 `construction.commit` 确认，草图 ID 和关联对象 ID 保持稳定，撤销一次可恢复两者。

新生成的几何/特征对象保存前后方块状态与 NBT 归属快照、源 ID 和源版本。UI 普通摘要省略逐格快照，便携工程和数据库保存完整记录。旧特征缺少记录时不猜测底层内容；保持旧对象或重新建立关联。对象直接移动/复制后若不再符合归属位置，在来源更新预览中报告并按独立方块对象保留。当前支持直接的草图到几何/特征关系，不等于任意多层约束/DAG 已完成。

`construction.cancel` 接收 `{id: draftId}`，只取消匹配预览，返回 `{cancelled}`，不改场景或版本。取消后的 ID 不可提交；新预览仍会使旧预览失效。

## 组件定义与关联实例

`construction.prepare` 的 `type:'designer'` 支持以下操作：

- `operation:'instance'`：从一个已分组对象建立关联副本，数量包含原件，使用原有 `count/step`。
- `operation:'syncInstances'`：从所选实例的实际内容更新组件定义，保留各实例放置坐标。四分之一转向/镜像使用固定变换还原到定义坐标；不要求从未旋转原件操作。`overlap:'overwrite'` 显式替换其他实例的手改，默认保留手改与删除。新范围碰到无归属内容仍会报告冲突。
- `expandSource:true` 配合 `selection.min/max`：读取新定义范围，包含新添方块。空位不填充，实例锚点不变。
- `operation:'makeUniqueInstance'`：为一份实例建立新的独立组件定义，不改变方块。它仍可再创建自己的关联副本。
- `operation:'detachInstance'`：保留旧接口的完全解除关联行为。

组件定义保存在 `design.componentDefinitions`，实例记录 `instanceOf`、固定 `instancePose`、前后内容快照和版本。普通 UI 摘要省略逐格内容，完整工程保留。直接复制不带关联，移动/四分之一转向更新放置变换。原生方块实体结构的旋转仍需原生蓝图，不能把通用方块状态转向当成完整 Mod NBT 转换。预览不修改工程；确认后定义和实例内容一起撤销。

## 隔离视图

`view.isolate` 保留原有 `objectIds/selection/clear`，新增 `push:true` 保存上一层隔离，`pop:true` 返回上一层。`includeNew:true` 为所选对象／区域保留邻近新编辑内容，基础 UI 画笔采用此范围并跳过隐藏对象成员。普通显示隔离不改变场景数据或原场地。

`CraftStudio.captureView().scene.view` 返回 `isolated`、`depth` 和可用的 `editBounds`。隔离不是公共 `edit.apply` 的写入权限限制；AI 可按明确请求继续自由编辑，若需要范围条件可使用 `edit.brush.mask`。当前相机可用 `CraftStudio.viewState()` 读取，不需要截图；`setView` 支持正交／透视与 `zoom`。UI 的隔离进入／退出协调相机恢复，协议本身不替远程调用者保存相机。

`construction.prepare` 的 `type:"geometry"` 支持 `config.kind:"polyline"`。`points` 保存连续顶点，`closed:true` 显式闭合，默认保持开放，不添加末点到起点的隐含线段。开放折线不能填充；闭合共面的采样辅助线可作为拉伸截面。保存后的路径可通过 `pathId` 用于扫掠，沿用源草图重编辑、关联重建和一次撤销。半砖/楼梯仍由现有落格与素材变体规则决定。轮廓偏移支持可识别的单个闭合共面路径，沿轮廓自身平面计算，也支持倾斜工作平面；正距离向外、负距离向内。结果保存自身工作平面与拐角，且是独立辅助轮廓。向内偏移导致边界消失或反向会拒绝；复杂凹轮廓的拓扑分裂/自交修复尚未自动实现。

新建偏移辅助线保存 `provenance:{kind:"offset",guideId,sourceRevision,distance,independent:true}`。`generation.links` 的对应 guide 增加 `source` 状态，包含来源 ID、名称、距离、`outdated/canRebuild/reason`；这是独立副本的来源记录，不表示源变化时自动修改副本。

通过 `construction.prepare` 的 `type:"designer"`、`config.operation:"updateOffset"` 与 `config.guideId` 预览按来源重建；可传 `distance` 修改距离，默认沿用记录值，`manualStrategy` 默认 `preserve`。确认沿用 `construction.commit`，保持目标草图 ID，重建其下游几何并支持一次撤销。多级偏移先更新上一级，缺失/循环来源拒绝重建；旧记录没有 provenance 时不推断来源。

`updateOffset` 可选传 `config.sourceGuideId`，显式更换偏移来源。新来源必须是已保存的闭合共面轮廓；缺失原来源时也可先选择新来源修复。更换先在候选来源图上检查自身/后代循环和上级待重建状态，再生成预览；确认后保持目标草图及下游对象 ID，并记录新来源版本，一次撤销恢复原来源与方块。空来源、未知来源、开放轮廓和循环拒绝；省略该字段仍沿用已有来源。

`designer` 的 `editFeature` 参数 `parameters.profileIds` / `parameters.pathId` 可显式更换生成对象的截面或路径来源。设置外部 `profileIds` 会清除旧内联 `profiles`，设置 `pathId` 会清除旧内联 `path`，避免旧缓存优先覆盖新参照。重建先在候选来源图上验证循环与缺失参照，再保留对象/输出辅助线 ID 更新下游；来源记录与版本同步更新，沿用归属快照、手改保留和一次撤销。自身/后代输出循环会拒绝，旧对象缺少归属记录时不会推断所有权。自绘截面扫掠同时记录路径和截面来源，修改截面也会触发原有下游重建。

几何的 `terrain:"surface"` 与 `terrain:"grade"` 是保留真实场地的自动模式：缺失地面、水面以及冲突建筑/植被候选会被排除，挖填保留列不会继续放置道路，斜线补格也独立检查。该模式规则不因更宽松的 placement policy 而覆盖；`terrain:"none"` 的自由设计与显式编辑接口保持原有语义。预览 warnings 说明略过列，材料角色数量按最终候选计算。

`terrain:"supports"` 的 prepare 结果包含 `supports`：`requested/grounded/blocked/missing/buried/clipped` 与最多 256 个诊断 `records`（含 x/z、地面/设计面高度、planned/accepted、status），超出时 `truncated:true`。支柱先检查整个区间，障碍或缺失地面不生成半根柱；范围过滤后缺少候选柱格标为 clipped，不计为完整落地。报告仅表示候选方块几何，不判定承载力。

贝塞尔几何可选 `config.sampleCount` 指定 24–8192 的整数采样段数，省略/null 使用原控制多边形长度估计。前端“增阶保持形状”采用贝塞尔精确增阶公式并保留当前采样数，避免仅因控制多边形变化而改变落格采样。真正编辑控制点时前端清除固定采样；来源重编辑传新 points 且未显式给 sampleCount 时也清除旧采样设置。现有单段贝塞尔仍支持 3–8 控制点。

Viewport captures now include `scene.geometryLoading`, `scene.pendingChunks` and `scene.geometryFailed`. A capture during progressive loading may show only part of the viewport; inspect these fields before treating an empty-looking area as absent. Canonical region queries remain independent of viewport completeness.

Unconfirmed tool intents are stored separately as local library preferences and are never automatically committed. Their matching key fingerprints the immutable baseline identity plus canonical title/origin/palette/design/size and sorted overlays; it excludes transient rendering and tool previews. Different confirmed content does not silently receive a saved tool intent. Stored intents are schema checked before restoration.

Designer `array` and `instance` configurations accept optional `spacingMode: "gap"`, `axis: "x" | "y" | "z"`, `gap` and `direction: 1 | -1`. The occupied selected bounds determine span; `span + gap` snaps to an integer translation. Nonpositive or out-of-range resolved distances fail. Existing omitted/`offset` mode retains the `step: [x,y,z]` vector. Construction previews return `arraySpacing` with resolved step/span/gap and snapping status; negative gaps report occupied-bound overlap.

Designer `pathArray` accepts optional `pathSpacingMode: "count"` to distribute `count` copies over total three-dimensional polyline arc length; omitted/`spacing` mode keeps fixed `spacing` with `count` as cap. `closedPath` or a saved closed guide includes the closing segment and excludes the repeated endpoint. Previews return `pathArray` count/length/spacing/closed/mode/duplicates. Integer anchor collisions are skipped and reported; orientation still uses existing 90-degree following.

`collections.list` returns named collections with direct `objectIds`, inclusive `descendantObjectIds`, `path`, `effectiveHidden` and `effectiveLocked`. `collections.put` accepts `collection: {id?, name, parentId?, hidden?, locked?}` and optional `objectIds`; supplied objects move to this direct collection while retaining other members. Omit parentId to retain the existing parent, or use null to move to the scene root. Unknown parents, self-parenting and cycles reject atomically. `collections.remove` accepts id and promotes direct members and immediate child collections to its parent (or root), without deleting objects or blocks. Writes require current expectedRevision and support transactions, receipts, undo, portable projects and local-engine durability. `objects.put` accepts a valid collectionId. Effective hidden/locked flags include all ancestors without rewriting individual flags. Collections organize objects without changing geometry or creating transform parenting. Each object retains one direct collection membership.
`collections.put` also accepts `removeObjectIds`; only listed members belonging to the target collection are unassigned. Unknown object IDs reject the entire request. An object cannot appear in both `objectIds` and `removeObjectIds` in the same request.

`generation.links` object records include `status: "error" | "warning" | "ready" | "detached"` and `issues` with `severity`, `code`, `message`, and optional `sourceId`. Missing recorded direct guides use `MISSING_SOURCE`; explicit outdated flags use `OUTDATED`. Detached records have no issues. This is read-only relationship inspection, not full geometry/dependency validation; `ready` only means these checks found no issue.

Recorded producer/output-guide relationships add `UPSTREAM_ERROR` / `UPSTREAM_OUTDATED` issues with `objectId` and `objectName`, `DEPENDENCY_CYCLE` on actual cycle members, and `AMBIGUOUS_OUTPUT` with `sourceId` and `objectIds` when a source has multiple producers. Geometry objects use their sketch as a source, not as a produced output. Detached output producers stop propagation. Diagnostics remain read-only and do not validate geometric recipes or voxel collisions.

`generation.links` source records optionally include offset provenance status with `errorCode: "OFFSET_SOURCE_MISSING" | "OFFSET_CYCLE" | null`. Consumer issues use that error code or warning `OFFSET_OUTDATED`, with `sourceId` and a reason naming the offset guide. Offset ancestry checks do not change coordinates or rebuild guides.

`palettes.list` returns `design.materialPalettes`. `palettes.put` takes `palette: {id?, name, states: [{Name, Properties?}]}`; it replaces that scheme, deduplicating exact states while preserving order. Names are unique per project; properties must be strings. Valid unknown namespace IDs are accepted without a resource whitelist. `palettes.remove` takes `id`. Mutations require `expectedRevision`, support transactions/receipts/undo and local-engine durability, and never edit block data or restrict future edits. Schemes contain state metadata, not resource archives/textures.

Portable scheme files use `{schema: "craftstudio-material-palette/1", palette: {name, states}}`. Export omits project scheme IDs; import validates/deduplicates full states and creates a fresh ID through `palettes.put`. UI reading is a preview, not a mutation, and conflicting names require the user to choose another name. Browser draft reload preserves schemes and its saved undo journal; old drafts without history and formal portable imports have no carried journal. The optional durable local engine retains its own undo journal.

Autosaved drafts optionally carry `site.history` with schema `craftstudio-draft-history/1`, deduplicated changed chunks/designs and undo/redo frame references. Old drafts omit it. Restore validates the history before publishing the new Site; malformed history reports recovery from a formal version. The working draft journal survives browser-compute/Lite reload; formal portable project export still omits it. Palette/collection mutations now follow the existing active-proposal preview guard.

`view.isolate` 的 `{contextVisible:true|false}` 在现有隔离层中显示／隐藏周围参照，保留 `editBounds`；未隔离时返回错误。`push` 新层默认隐藏参照，`pop` 恢复上一层的参照状态。`captureView().scene.view.contextVisible` 表示当前状态。显式隐藏的对象仍遵循原有可见规则；公共自由编辑接口不受此显示开关限制。

`construction.prepare` 的 `type:"geometry"` 支持 `config.kind:"spline"`：`points` 为曲线贯穿的三维途经点（开放至少两点，闭合至少三点），`closed:true` 生成闭合插值曲线。它采用向心 Catmull–Rom 三次插值，保留原有 `kind:"bezier"` 的语义。复用工作平面、素材、地形与范围参数；`guidesOnly:true` 可保存为建模来源，闭合且平面的结果可由 `profileIds` 拉伸。非平面曲线填充会报错。曲线配方随 craftlite 保存，NBT 导出确认后的方块；现有采样／生成预算仍适用。

路径扫掠 `operation:"sweep"` 支持 `sweepMode:"rectangle-fit"`，`width/height` 为 0.5–64 的尺寸，截面由路径法向帧构造；`voxel:"smart"` 复用 `roles.slab/roles.stairs` 边界落格。仍支持空心、端盖、闭环方向校正及重叠检查。原 `sweepMode:"rectangle"` 的整方块语义保持不变。

贴地几何 `terrain:"surface"` 的 `construction.prepare` 结果增加 `surfaceFit`：`skipped/missing/water/obstacle` 为范围内略过候选列数量，`records` 最多 256 个 `{pos:[x,y,z],reason:"missing"|"water"|"obstacle"}`，`truncated` 标明是否截断。`pos` 用于诊断定位；缺失地面时的 Y 来自设计路径而非推断地形高度。此信息不表示实际生成量，放置数量仍看 `counts`。

只读 `materials.collect` 接收 `min/max/members/regions/all` 选区参数及可选 `space:"local"|"world"`，支持 `workspaceId/expectedRevision`。返回 `{blockCount,states:[{state,count}]}`，状态包含完整 `Name/Properties`，计数按实际选中方块去重统计；不带机器／方块实体 NBT，不改变场景修订号。可将 `states.map(v=>v.state)` 传给 `palettes.put`，方案写入仍为单独的可撤销操作。

`construction.prepare` 的 `type:"designer"` 支持 `config.operation:"paint"`，提供 `objectIds` 或 `selection`、目标 `state` 及可选 `retainShape`（默认 true）。复用画笔的材质家族及形态／属性保留规则，保护含实体数据的跨类型替换。返回 `materialChange:{selected,changed,skipped,unchanged}`；准备阶段只读，确认仍遵循 `policy` 与修订号检查。

选区换材质 `operation:"paint"` 增加可选 `sourceName`，只匹配该原方块 Name；空值处理所有选择，仍遵循形态保留规则。`materialChange` 增加 `matched/excluded/sources:[{Name,count}]`，来源统计覆盖实际选择，不只统计已替换部分。匹配是方块类型，不自动合并材质家族；原 API 不提供 `sourceName` 时语义保持不变。

## Delivery export / 施工交付包

```js
const zipBytes = await CraftStudio.export({
  format: 'delivery',
  kind: 'selection', // additions | patch | selection | full
  selection: { min: [4, 2, 4], max: [6, 2, 4], members: [[4, 2, 4], [6, 2, 4]] },
  includeProject: false
});
```

This page API returns ZIP bytes. Omit `selection` to use the current UI selection. `includeProject` embeds the full original site and editable design; ZIP import prefers this project, otherwise it loads the blueprint with `placement.json`. Unknown world anchors stay unconfirmed. Packaging guards one revision across the NBT, scoped reports and optional project. `manifest.json` uses `craftstudio-delivery/1`; full-site material tables count changed placements. Archive creation runs in the shared engine. It does not execute game construction.

页面接口返回 ZIP 字节；省略 selection 时采用当前界面选择。includeProject 会附带完整原始场地和可编辑设计；打开 ZIP 时优先读取该工程，否则读取蓝图和放置坐标。未确认的世界坐标不自动确认。蓝图、清单和可选工程遵守同一场景版本；归档在共用引擎中执行，不等于游戏内施工。

For `format: 'nbt'`, `kind: 'full'` returns raw NBT bytes. Partial kinds (`additions`, `patch`, `selection`) return `{bytes, offsetLocal, offsetWorld, containsAir, size, blocks, materials}`. `format: 'craftlite'` returns portable project bytes, `format: 'json'` UTF-8 project JSON bytes, and `format: 'schem'` additions as Sponge bytes.

NBT 完整范围返回字节；局部范围返回含 bytes 和放置偏移的对象。原有 craftlite / schem 路径保留，json 返回 UTF-8 工程数据。

## Connected-page MCP / 当前页面 MCP

Enable the local workbench AI panel's page connection, then start `python mcp_server.py` as a stdio MCP server. `CRAFTSTUDIO_URL` defaults to `http://127.0.0.1:18767`. `designer_sessions` returns live page IDs and last-reported metadata; `workspace.describe` is the authoritative read.

```json
{"operation":"request","request":{"method":"workspace.describe"}}
```

Pass that result's workspaceId and revision in subsequent versioned requests:

```json
{"sessionId":"PAGE_ID","id":"build-once","operation":"request","request":{"method":"edit.apply","params":{"workspaceId":"WORKSPACE_ID","expectedRevision":1,"operations":[{"type":"set","pos":[4,2,4],"state":{"Name":"example:freeform_block"}}]}}}
```

`designer_call` returns `{jobId,status,result}` when completed, or a pending job. Poll `designer_job({jobId,wait:20})` using the same job; wait is observation only. A queued task stays bound to its document, even after human file switching. Reuse an ID only with identical request content. IDs support strings and safe integers; numeric 0 and string "0" are distinct. Direct page API writes still keep their previous optional workspaceId contract; this MCP boundary requires it whenever expectedRevision is supplied.

Operations: request forwards all shared API methods; capture accepts optional `{view: ...}` and returns native PNG plus scene/camera metadata; export accepts existing format/kind/selection/includeProject/title options and writes the resulting artifact under service exports/; save uses current page form fields and returns `{projectId,version,workspaceId,revision,unconfirmedPreview,laterEdits,draftSaved}`. Save revision describes the formal frozen snapshot, not later edits. Capture geometryLoading/geometryFailed flags must be checked before assuming the image is complete.

Binary response leaves use `{$binary:{type,base64}}`; BigInt and non-finite scalar tags remain explicit. Captures use MCP image content; exports return local paths instead of huge binary text. Replies reuse the engine wire codec, not a second scene serializer.

Disconnect cancels unstarted jobs and marks dispatched results unconfirmed until a reply arrives. It does not claim already-started edits were undone. Cache expiry or restart does not prove a write had no effect; read the authoritative scene first. Completed receipts are ephemeral, not durable job history. Standalone Lite exposes the same page API without the local HTTP/MCP transport. Existing host/origin/token checks protect all page-bridge routes. No model-provider credentials or game bridge token are stored by this connection.

当前页面连接不另建场景。版本号与工程身份必须一起传，暂存、提交、预览和撤销沿用共用引擎。任务等待超时不取消执行；已派发任务断开后可能已产生效果，不能当作失败后盲目重提。截图载入标记、正式版本回执和本地导出路径分别表示各自证据，不等同于游戏内施工。


### Open an explicit file / 打开明确提供的文件

`CraftStudio.importFile({name, bytes, workspaceId, expectedRevision, region?})` opens the same candidate scene used by file selection. `bytes` is an ArrayBuffer or Uint8Array; `dataBase64` can replace bytes. It returns `{workspaceId,revision,name,sourceBlocks,size}` for the opened scene. The method checkpoints existing work, verifies source scope before parsing and again before swapping, and rejects on errors instead of silently returning undefined. Cancellation uses the existing import cancel button. Unconfirmed previews must be adopted or cancelled first. Reference HTML remains a UI import, not an external scene replacement.

MCP uses the same method through `designer_call`:

```json
{"id":"open-once","operation":"import","options":{"name":"terrain.nbt","dataBase64":"BASE64_FILE_BYTES","workspaceId":"SOURCE_WORKSPACE_ID","expectedRevision":1}}
```

For `.mca`, supply explicit integer XYZ `region.min` and `region.max`. For selections spanning region files, use `CraftStudio.importFile({files:[{name,bytes}], region:{min,max}, workspaceId, expectedRevision, name?})`; each entry also accepts `dataBase64`. Supply all required `r.x.z.mca` files from the same dimension. The import combines one candidate scene atomically and leaves the current scene intact on missing files or malformed data. Only selected chunk slices are packed for transport. Ground queries return `clipped:true` with null heights where the crop excludes blocks above it; include the full terrain height for automatic ground placement. Successful opening replaces the scene; it does not merge geometry. Read the new workspace before subsequent edits. Retrying the identical MCP ID returns its previous job; do not resubmit pending or uncertain imports. The HTTP request body limit remains 64 MiB including JSON/base64 overhead; larger local files use the file chooser and streamed local-engine upload. Both Lite and local pages expose importFile; standalone Lite does not expose local MCP transport.

导入使用页面现有的检查点、候选解析和取消流程。需明确传入原工程身份与版本；成功返回新工程，后续操作必须重新读取状态。MCP 传文件名及 Base64，不读取任意磁盘路径，不扫描 Minecraft 安装目录。大文件从界面选择并交给本地引擎上传。


### Shared resource library / 共用资源库

`CraftStudio.resources({action: "list"})` returns `{workspaceId,revision,entries,precedence}`. Entries include stable IDs, names, kind, enabled state, namespaces and asset counts; archive bytes are omitted. The last enabled entry overrides earlier entries. Metadata describes the local reusable library, not every resource embedded in the current project.

Mutations require workspaceId and expectedRevision from a fresh list/describe. `action: "add"` takes `files: [{name,bytes}]` (ArrayBuffer/Uint8Array), or dataBase64 instead of bytes. JAR/ZIP archives are read as assets only. `action: "configure"` accepts `enabled: {RESOURCE_ID: true|false}`, `remove: [RESOURCE_ID]`, and optional `order: [RESOURCE_ID...]` listing every surviving resource exactly once. Unmentioned enabled states are retained.

```json
{"operation":"resources","id":"resources-once","options":{"action":"add","workspaceId":"WORKSPACE_ID","expectedRevision":1,"files":[{"name":"my-pack.zip","dataBase64":"BASE64_ARCHIVE"}]}}
```

Use `designer_call` with operation resources and the same options through MCP. list needs no write guard; add/configure do. The normal 64 MiB JSON-body limit applies. UI edits and connected automation share the same library, ordering, refresh and draft notification. Invalid candidates are parsed before replacing live resources; rejected applies restore the previous durable preference. A disconnected/uncertain operation must be observed using its existing job receipt before retrying. A transport failure cannot prove that the engine did not commit. Changes affect the reusable local library and current appearance, not just one project.

页面与外部 AI 共用资源库；不会导出完整资源文件给列表调用。启用顺序从上到下，后者覆盖前者。变更会影响本机后续工程，工程便携文件仍携带使用到的模型和贴图。未执行 Mod 代码，也不宣称支持所有自定义渲染器。


### Optional entities in selection exports / 选区导出的实体

For `format: "nbt"` or `"delivery"` with `kind: "selection"`, set `includeEntities: true` to include recognizable vanilla Structure entity wrappers inside the selection's bounding box. Blocks still use exact members; entity inclusion uses local position and does not infer object ownership, so an independent entity inside the same bounds is included too. The default remains blocks-only. Full-scene NBT and complete projects already preserve all source entities. Additions/patch exports reject this entity option because original entities are not new block changes.

Entity wrapper pos (double list) and blockPos (integer list) are rebased to the cropped origin. Internal typed entity NBT is copied without reinterpretation. Results/ZIP manifest report entities, entitySelection and entityWarnings; unsupported or unlocated source wrappers are omitted from the partial export with a report and remain in the complete project. The same notes appear in the package README. This is preservation/export support, not entity rendering/editing or validated game spawning. Existing game bridge restrictions on native entities remain.

```js
await CraftStudio.export({format: 'delivery', kind: 'selection', includeEntities: true});
```

交付面板勾选“包含选区外接范围内的场景实体”后，ZIP 与单独选区 NBT 都沿用此选项。实体按位置取外接范围，方块仍按精确成员取；两种规则分别说明，不默认为实体分配建筑归属。纯实体范围可通过明确的 API selection 坐标导出；没有实体位置的未知数据仍留在完整工程中。


### Current-page Java game handoff / 当前页面的 Java 游戏交付

Local pages expose `CraftStudio.game(options)`. MCP forwards it with `designer_call` operation `game`. Connect Java manually in the game panel first, then read `{action:"status"}`. Status returns workspaceId/revision, connectionId, sanitized session capabilities, known jobId, target and the current prepared review; it does not return bridge credentials or the full prepared project payload. Standalone Lite has no authenticated local game session.

Prepare/build/read/undo require connectionId, workspaceId and expectedRevision. prepare optionally accepts target `{kind,origin,dimension,overwrite,size,selection}`; selection uses the existing exact-members/combined-regions contract and updates the visible choice. The target dimension must be in the connected game's advertised list. All targets are world coordinates. prepare returns a review `{id,source,origin,max,blocks,kind,dimension,overwrite}`; origin/max are the actual cropped world bounds. No game blocks are written during preparation.

```json
{"operation":"game","options":{"action":"status"}}
```

```json
{"operation":"game","id":"prepare-once","options":{"action":"prepare","connectionId":2,"workspaceId":"WORKSPACE_ID","expectedRevision":1,"target":{"kind":"additions","origin":[100,64,-50],"dimension":"minecraft:overworld","overwrite":false}}}
```

Then build with `preparedId` equal to the returned review id and the same fresh source/connection guard. Build consumes the review once, checks the source/target again and follows the game's write permission and busy state. A human preparation replaces the previous id. UI confirmation uses this same controller.

```json
{"operation":"game","id":"build-once","options":{"action":"build","connectionId":2,"workspaceId":"WORKSPACE_ID","expectedRevision":1,"preparedId":"PREPARED_ID"}}
```

job/cancel require connectionId and the currently known jobId. They query/control the game task; they do not create another scene. undo uses the bridge's last-construction undo, not editor undo, and needs the source guard plus game write permission. read accepts target origin/dimension/size and opens the returned region using the guarded page file-import path, returning the new workspace identity. Re-read status/describe after importing. The source project is checkpointed before replacement.

Keep the same MCP jobId/request ID for pending or uncertain requests. `GAME_WRITE_UNCONFIRMED` means a network failure or connection change left game effects unknown; reconnect and query the game task instead of blindly repeating construction. Preparation does not freeze external changes to the game world; bridge overwrite, backup and write-permission rules still apply. The complete MCP→page→HTTP bridge→readback flow is verified with a mock game, not actual Minecraft placement, restoration or ticking.

游戏令牌只留在页面连接控件与本地通信中，不进入状态回执。AI 与人共用当前游戏连接、准备内容和任务编号；不会走旧兼容 CURRENT 工程。此接口接通工作流，不代表已完成真实游戏施工验收，也不绕过现有实体/原生蓝图限制。


### Named selections / 命名选择

`selectionSets.list` returns lightweight record summaries. `selectionSets.resolve` takes `id` and returns either a fixed `selection` mask or current visible `objectIds`, with `hiddenObjectIds`, `missingObjectIds` and `lockedObjectIds`. Both reads accept the normal workspace/revision guard. Object references follow existing IDs through transforms; copies with new IDs are not automatically included. When every referenced object is unavailable, UI restore retains the current selection and reports the unavailable members.

`selectionSets.put` takes `selectionSet: {id?,name,objectIds}` or `{id?,name,selection}`. Omit `id` to create a record, supply it to overwrite, or supply only an existing `id` and `name` to rename. Fixed masks use local coordinates by default; `space:"world"` requires a confirmed origin. `selectionSets.remove` takes `id` and removes metadata only. Writes share transaction staging, version guards, receipts and undo. Records persist in editable project files, not Minecraft NBT. These methods do not copy geometry or make hidden geometry visible.

```json
{"operation":"request","request":{"method":"selectionSets.put","params":{"workspaceId":"WORKSPACE_ID","expectedRevision":1,"selectionSet":{"name":"All windows","objectIds":["window-a","window-b"]}}}}
```

命名对象选择保存身份引用，自由方块选择保存固定坐标；恢复不修改场景修订。移除记录不删除方块。

### Reusable prefab JSON / 可复用构件 JSON

`craftstudio-prefab/1` uses integer XYZ size and a nonempty blocks array. Each block has a local pos and either an explicit state `{Name,Properties?}` or a palette index with a corresponding root palette. Import/placement normalizes indexed states to explicit objects. Arbitrary valid Java namespaced IDs are supported; the material catalogue is not a whitelist. Properties values use Minecraft's string representation. Typed block-entity NBT and unknown metadata are retained; this change does not execute Mod code or add missing renderer support.

```json
{"schema":"craftstudio-prefab/1","name":"Custom beam","size":[2,1,1],"palette":[{"Name":"my_mod:roof_beam","Properties":{"facing":"east"}}],"blocks":[{"pos":[0,0,0],"state":0},{"pos":[1,0,0],"state":0}]}
```

Missing/out-of-range palette references, duplicate local cells, invalid Java IDs and positions outside size are rejected before generating scene writes. Numeric states without a valid palette are never treated as air. Existing size/operation limits remain. The shared normalizer lives in components/prefab-format.js and is used for project prefab imports and insertion/paste operation generation. A failed import preserves the current project/library state and history; a failed overwrite paste preserves the target. Reopening a saved project retains normalized prefab definitions.

合法数字索引构件可直接导入；错误索引会报错，不会变成删除方块。文件选择控件在读取前清空，修正后可再次选择同名文件。构件操作提交后先标记草稿，再刷新视图。


### Prefab browser metadata / 构件浏览信息

Project prefab definitions may include `tags: ["window","timber"]`. The fixed prefab shelf treats these as user categories and includes them in text search alongside name and dimensions. Categories are flat and project-scoped; this is not Blender's hierarchical catalog format. Renaming/category edits preserve block and typed-NBT data, use the normal project history, and survive project/prefab-file export and reopening. Already placed independent copies are not renamed or regenerated by a metadata edit.

Browsing, filtering and exporting a definition do not place blocks. Placement explicitly opens the existing 3D ghost workflow; Escape cancels before confirmation. The browser has no separate rendered thumbnail and does not replace freeform voxel/AI editing. New prefab-browser modules live under components/, while studio-ui.js composes the existing engine and file controls.


### Shared project prefab API / 人和 AI 共用工程构件库

The shared v1 request API exposes these methods through `CraftStudio.request` and connected-page MCP `designer_call` operation request. They address the current project's prefab library, not a second scene or the cross-project saved-library database. All writes need the normal expectedRevision guard; MCP also requires workspaceId. Read pages should use the same guard to avoid mixing revisions.

| Method | Parameters | Result |
| --- | --- | --- |
| prefabs.list | query/category/sort (recent or name), offset or cursor, limit | items with id/name/size/blockCount/tags/hasBlockEntities; total and nextCursor |
| prefabs.read | id, offset or cursor, limit | prefab with the requested block page, totalBlocks and nextCursor |
| prefabs.put | prefab (complete definition); or selection/name/tags; or id/name/tags for metadata | saved definition summary |
| prefabs.place | id, at, turn/mirror/count/step, overlap, policy | actual changed blocks, objectId, local min/max, skipped and protectedSkipped |
| prefabs.remove | id | removed definition id; independent placed copies remain |

Pagination defaults to 1000 and accepts up to 20000 entries per read. Pass the returned nextCursor as cursor. Definitions use local coordinates even when placement/capture use `space:"world"`. World selection/at conversion requires a confirmed project origin; step is a displacement vector. Capture honors exact members and combined regions, preserving block states and block-entity NBT. It does not capture scene entities. Empty captures are rejected.

put creates a definition, or replaces a complete definition with the same explicit id. With only id/name/tags it updates metadata while preserving geometry. Omitted metadata fields remain unchanged. Import normalizes explicit/palette-indexed states using the same parser as the file UI. remove affects only the definition. Neither metadata edits nor definition removal regenerate existing independent copies.

place defaults to avoiding occupied targets; overwrite/replace are explicit overlap policies. Terrain protection and locked objects/collections still apply. skipped counts requested records that produced no change, including overlap/no-op/protection skips; protectedSkipped identifies the protection subset. Placement uses the current definition and creates an ordinary freely editable object, not a linked component instance. Arbitrary namespaced Mod IDs remain allowed.

```json
{"operation":"request","request":{"method":"prefabs.put","params":{"workspaceId":"WORKSPACE_ID","expectedRevision":1,"prefab":{"schema":"craftstudio-prefab/1","name":"Freeform beam","size":[1,1,1],"blocks":[{"pos":[0,0,0],"state":{"Name":"my_mod:beam"}}]}}}}
```

```json
{"operation":"request","request":{"method":"prefabs.place","params":{"workspaceId":"WORKSPACE_ID","expectedRevision":2,"id":"PREFAB_ID","at":[10,4,10],"overlap":"empty"}}}
```

put/place/remove also accept transactionId, so a definition and its placements can be staged and committed as one undo step. Staged changes do not refresh the visible library or geometry before transaction.commit. Identical request-ID replay reuses the existing receipt; changing the content, including its source guard, requires a new ID. Read/list operations do not place blocks. Writes refresh the same visible shelf and draft state; metadata-only updates skip the voxel-view rebuild. Low-level UI prefab import/metadata/capture actions reuse this library implementation.

本接口为可选的复用能力，AI 仍可直接自由编辑方块或自行生成定义。放置调用直接提交，需预览时可用已有事务暂存／提案流程；不会强制所有设计使用构件。


### Atomic object naming / 对象名称原子修改

`objects.rename` takes `names: [{id,name}, ...]` plus the normal workspaceId/expectedRevision guard. All IDs and nonempty names are validated before applying any change. Duplicate IDs in one request are rejected. IDs, geometry membership, transforms, collections, locks and block/entity data remain unchanged. Naming is allowed for locked objects because it is metadata editing; it does not unlock them. Result adds `{renamed,names:[{id,before,name}]}` to the normal commit summary. Identical resulting names are allowed; stable IDs distinguish objects.

```json
{"operation":"request","request":{"method":"objects.rename","params":{"workspaceId":"WORKSPACE_ID","expectedRevision":1,"names":[{"id":"window-a","name":"窗_01"},{"id":"window-b","name":"窗_02"}]}}}
```

The method supports transactionId and normal request-ID receipts/undo. The page refreshes labels and draft state without rebuilding voxel geometry. The UI's batch preview uses a frozen selected set and source revision; selection/source changes close it, and stale submissions are rejected. It does not provide regex execution or a general operator macro system. The preview displays at most 100 rows while showing the full target count.

UI templates substitute `{name}` and `{n}` in one pass; token-like characters inside original names are retained literally. Optional Find/Replace is case-sensitive literal text applied to the original name before templating. Number padding does not truncate longer numbers. Inputs own their normal text undo shortcuts.


### Scene-browser scopes / 场景浏览范围

The browser's query, collection, attention, object-kind and visibility/lock filters are transient UI scopes, not project mutations. The shared pure SceneBrowser filter returns matching object IDs, related editable guide IDs, selectableObjectIds and counts. selectableObjectIds excludes objects hidden individually or by their collection; locked visible objects are included for inspection, naming, measurement and export. Existing mutation protection still controls geometry writes.

Type/state object filters keep related source sketches as context and omit unrelated independent sketches. Clearing the scope restores all objects/sketches. A viewport pick outside the current scope reveals the picked item by clearing incompatible filters. Matching-result selection honors Shift add/Ctrl subtract with exact members. Internal kind tokens match exactly in text search; translated type labels and normal scene names remain searchable. This is not a persistent saved-selection system.


## Java datapack export

`await CraftStudio.export({format:"datapack",kind:"selection",target:"1.21.1",placement:"relative"})` returns a Java datapack ZIP with the same exact blueprint selection/air mask. Targets: `1.20.1` (pack 15, plural functions directory) and `1.21.1` (pack 48, singular function directory). Placement is `relative` (default) or `world` (requires confirmed world origin). The ZIP manifest carries the local/world offsets and independent numbered stages of at most 8192 commands. Block entities are initialized and retain typed SNBT; scene entities are omitted, and includeEntities:true rejects explicitly. Export is read-only and does not execute game commands, change gamerules, or upgrade data.

The connected-page MCP bridge also accepts operation: "export" with these options and writes a .datapack.zip artifact using the existing revision guard and receipt mechanism.

## Auxiliary curve block generation

For geometry construction using an existing editGuideId, materializeGuide:true with guidesOnly:false creates the first linked stroke result on that guide. The source guide ID is retained, no duplicate guide is created, and normal placement protection applies. A guide that already has a geometry result rejects a second materialization; edit its existing result instead. Confirmation remains one undo step and later source edits use the existing generation records.
