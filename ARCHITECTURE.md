# CraftStudio 架构

```text
浏览器前端（Three.js 交互式 3D）
          │ 本地 HTTP + 会话令牌
Python 后端（工程操作 / 格式转换 / AI 规划）
          ├─ SQLite 本地工程库
          ├─ 原版 / Mod / 材质包资源读取
          ├─ NBT / schem / litematic / MCA 适配
          ├─ 可配置 AI 服务
          └─ 游戏桥接 Mod（读取 / 建造 / 回读 / 撤销）

外部 AI 客户端 ── MCP stdio ── 同一个后端
```

## 前后端职责

前端管理 3D 相机、交互选取、实时模型显示、剖切、工程库界面和方案预览。后端是工程数据与编辑结果的权威来源，负责操作验证、并发版本检查、持久化、资源解析和游戏交互。SQLite 由后端访问；浏览器不直接操作数据库。

## 本地存储

数据目录位于所选的项目工作目录：

| 位置 | 内容 |
|---|---|
| data/craftstudio.sqlite3 | 工程库、版本、草稿、素材目录 |
| data/backups/ | 一致性 SQLite 备份 |
| data/migration-backups/ | 切换数据库前的当前场景副本 |
| projects/ | 可移植 .craft.json 副本和兼容自动保存 |
| exports/ | Minecraft/Create NBT 蓝图 |

使用环境变量 CRAFTSTUDIO_STORAGE_DIR 可让上述 data、projects、exports 位于另一个本地目录。程序源码与前端静态文件仍位于项目目录；测试使用此配置隔离数据。

数据库使用 SQLite WAL、外键、参数化查询与事务。工程快照使用压缩 JSON 保存，NBT 仍保留类型和 64 位整数精度；没有把游戏方块实体降成无类型普通数值。

## 数据表

| 表 | 作用 |
|---|---|
| projects | 稳定 ID、名称、说明、标签、工程/蓝图/构件分类、收藏、源实例、当前保存版本与回收站状态 |
| versions | 工程内容快照、版本号、时间、备注和摘要；旧内容不覆盖 |
| sessions | 当前活动场景，以及每个已入库工程的编辑草稿 |
| environments | 已索引实例的资源指纹和环境摘要 |
| block_catalog | 可再次查询的方块 ID、名称和 Mod 命名空间目录 |

模型/贴图字节目前仍从实际游戏实例读取，数据库素材目录用于复用检索，不代表把全部 Mod 资源打包进数据库。动态渲染边界仍按 README 的兼容性说明处理。

## 保存与读取

1. 编辑立即写入数据库活动会话；关联到已入库工程时，同时更新该工程草稿。
2. 点击保存，将工程加入库或在原 ID 下保存新版本，并更新 JSON 副本。
3. 相同内容的普通重复保存不堆积版本；内容变化或新的版本备注会记录版本。
4. 另存为创建独立 ID，不覆盖原工程。
5. 工程库打开默认优先恢复该工程的未正式保存草稿；版本列表可以明确打开任一已保存快照。
6. 切换工程后，已入库工程的草稿仍保留。未命名场景需保存入库才能长期作为独立工程检索。
7. 程序重启从数据库恢复最后场景。撤销/重做是本次服务会话的操作历史，不等于永久版本记录。
8. 移入回收站只设置状态，保留快照与版本，可恢复。

原工程 JSON 首次启动时导入库，记录来源文件名，后续启动不会重复导入。原文件保持存在。JSON 导出便于跨目录/电脑移植，再通过文件导入读取。

## 接口

- GET /api/library：搜索、分类、收藏、回收站、分页。
- POST /api/save：保存、另存为、标签/说明/版本备注。
- POST /api/library/open：重新打开工程或指定版本。
- GET /api/library/versions：历史版本。
- POST /api/library/metadata：修改库元数据与收藏。
- POST /api/library/trash / restore：回收站与恢复。
- POST /api/library/backup：SQLite backup API 创建一致副本，并检查完整性。
- GET /api/library/export：导出一个已保存快照。
- GET /api/library/blocks：查询已持久化的素材目录。

编辑操作使用当前场景 revision；保存还可携带工程库 head，拒绝基于旧保存版本的覆盖。工作台和 MCP 使用同一份场景与数据库，外部工具修改后前端同步。

## 验证

`python -m unittest discover -s tests -v`：包括类型保留、版本、重开、事务冲突、搜索、回收站、草稿与 WAL 备份。

`python tests/smoke_library.py`：隔离目录中启动真实后端，执行保存、编辑、旧版本读取、停止再启动、恢复、草稿切换、素材索引与前端接口检查。

此验证没有替代真实浏览器的视觉和交互检查，也没有替代游戏内建造验证。


## Shared local / Lite architecture

`lite/src` is the single designer frontend. `lite/build.mjs` emits identical `lite/dist/CraftStudio-Lite.html`, `web/index.html`, and `web/lite.html` plus the worker bundle. Runtime capability detection selects SQLite on the genuine local service, or IndexedDB for standalone/static Lite. The browser Worker remains the one voxel/modeling engine in both modes. Local service helpers add explicit instance file reads and game bridge forwarding; they do not replace the designer with legacy generators.

Designer snapshots are stored in namespaced `designer_records` tables in the existing SQLite database. Legacy projects and APIs remain available for import/compatibility. Public builds embed no personal data unless fixture environment variables are explicitly supplied. CI tests both layers and synchronizes committed build outputs on main.
