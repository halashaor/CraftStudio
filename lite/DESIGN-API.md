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

`workspace.describe().value.view` 返回 `isolated`、`depth` 和可用的 `editBounds`。隔离不是公共 `edit.apply` 的写入权限限制；AI 可按明确请求继续自由编辑，若需要范围条件可使用 `edit.brush.mask`。当前相机可用 `CraftStudio.viewState()` 读取，不需要截图；`setView` 支持正交／透视与 `zoom`。UI 的隔离进入／退出协调相机恢复，协议本身不替远程调用者保存相机。

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
