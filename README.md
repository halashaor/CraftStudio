# CraftStudio

面向 Minecraft 建筑审美设计的本地 3D 工作台。直接在模型场景中设计，支持原版 / Create 蓝图、真实地形、素材目录、自由方块编辑与 AI 设计接口。

## 直接使用

下载仓库，双击 **lite/dist/CraftStudio-Lite.html**。这是自包含纯前端版本，无需启动 Minecraft 或后端。导入自己的 NBT / schem / litematic / MCA 文件后开始设计。公开版本不包含作者的私人存档、示例蓝图、材质包、截图或数据库。

界面使用顶部命令栏、左侧对象 / 素材 / 构件浏览器、中央 3D 和右侧属性检查器。左键选择或框选，右键旋转，中键平移，F 缩放到选择。素材按特征与用户自建类型分类，提供 3D 预览、收藏和本地保存。普通操作无需输入方块 ID。

## 功能

- 保留原始场地，独立记录新增、替换与删除；地形、河水及保留区保护。
- 自由编辑方块和状态；复制、移动、旋转、镜像、阵列与可复用构件。
- 素材按来源、形状、用途、色系分类；用户分类可分层且支持多重归属。
- 自动显示已适配的 Create 旋转件与原生装置；无需手动设置动画。
- IndexedDB 工程、版本、草稿、分类与备份；便携工程、NBT / Sponge 导出。
- 公共页面 / Worker API：精确读取、事务、冲突检查、重复请求回执、保存导出和视觉反馈。见 [接口说明](lite/DESIGN-API.md)。
- 可选 Python 本地后端、SQLite 工程库、MCP stdio 与 NeoForge 游戏桥接源代码。

## 开发与构建

```sh
cd lite
npm install
npm test
npm run build
```

Node.js 22+。构建默认不嵌入用户数据。可选环境变量 LITE_SOURCE_NBT / LITE_REFERENCE_HTML 只用于个人构建；不要发布包含私人数据的输出。

后端使用 Python 标准库：

```sh
python server.py --port 18765
python -m unittest discover -s tests -p "test_*.py"
```

打开 http://127.0.0.1:18765/lite.html。CRAFTSTUDIO_MINECRAFT_HOME 可指定 .minecraft 目录；默认从用户目录定位。数据和日志在本机生成，已列入忽略规则。

桥接针对 Minecraft 1.21.1 / NeoForge 21.1.209，需要 JDK 21 与 Gradle；构建后手动安装到所选实例。桥接仅绑定本机，带令牌、建造备份与回读。完整游戏运行时和复杂 Create 行为尚未全部适配。外部 AI 的自主工具循环仍需连接当前接口。

第三方声明见 [THIRD-PARTY](lite/THIRD-PARTY.txt)。Create 参考代码保留原许可证，公开包不带 Minecraft / Mod 原始游戏材质。项目当前未另行声明主代码的开源许可证。
