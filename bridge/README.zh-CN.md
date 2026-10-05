# CraftStudio Java 游戏桥接

[English](README.md) | 简体中文

设计器使用统一的 `craftstudio-bridge/1` 协议。加载器适配只处理生命周期事件，共用运行时负责本机令牌认证、读取世界、校验方块、分批施工、停止、备份、回读和撤销。

## 对应版本

| 构建配置 | Minecraft | 加载器／依赖 | Java |
|---|---|---|---|
| neoforge-1.21.1 | 1.21.1 | NeoForge 21.1.209 | 21 |
| forge-1.20.1 | 1.20.1 | Forge 47.4.0 | 17 |
| fabric-1.20.1 | 1.20.1 | Fabric Loader 0.16.10 + Fabric API 0.92.2 | 17 |
| fabric-1.21.1 | 1.21.1 | Fabric Loader 0.16.10 + Fabric API 0.116.5 | 21 |

每个配置单独生成 JAR，不代表一个 JAR 通吃全部版本。GitHub Actions 逐项构建并提供产物下载。编译检查验证 API 映射，真实游戏内测试是独立的验证步骤。基岩版不在范围内。

```powershell
./build.ps1 -Profile fabric-1.20.1
./install.ps1 -Profile fabric-1.20.1 -ModsDirectory '对应实例的 mods 目录'
```

也可运行 `gradle -p profiles/fabric-1.20.1 build`，使用表中 Java 和 Gradle 8.14.3。Fabric 使用 Loom 的 Mojang 官方映射，并需要在游戏中安装 Fabric API。Create 是可选依赖：通过游戏注册表读取和校验方块，不硬编码 Create 发行版。

## 使用流程

在对应 Java 实例中安装桥接后打开世界。本地设计器中选择 **文件 → 连接 Java 游戏**，选择 `config/craftstudio-token.txt` 后连接。令牌只保留在当前对话框会话，不写入工程或工程库备份。选择维度、场地世界原点后读取区域，或施工当前设计改动。改动保留相对场地原点的偏移，裁切导出也不会错位。

单机写入需要创造模式。专用服务器可以读取；写入须由管理员在 `config/craftstudio-bridge.json` 中明确设置 `allowDedicatedServer: true`。同一配置可设置端口，默认 18766。桥接只监听本机回环地址，拒绝浏览器 Origin 请求，由 Python 本地服务代理连接。异地服务器须另行配置经过认证的传输，并不会直接公开桥接端口。

## 兼容边界

NBT、Sponge、Litematica、使用调色板的 Anvil 文件导入不依赖游戏运行或加载器。1.12 及更早的数值 ID Anvil 存档需要在 Minecraft 中升级副本后再读；程序明确报错，不会伪装成空场地。

普通方块在不同 DataVersion 下，只要名称、属性和值能被目标游戏注册表识别就能施工。未知状态不会被悄悄替换。这是方块状态校验，不是 DataFixer 无损转换。跨版本方块实体 NBT 会拒绝写入。原生实体及 Create 装置关联数据使用原生蓝图施工；文件导入导出保留带类型的 NBT，但桥接不任意重组装置实体。

倾斜建模和材质包独立于游戏桥接。Create 动态外观仍以已实现的模型、装置适配为准，加载器兼容不等于全部动画已适配。

## 接口与施工

全部接口使用带令牌的 POST：`/health`、`/read`、`/validate`、`/apply`、`/job`、`/cancel`、`/undo`。健康信息返回版本、DataVersion、加载器、维度、写入条件和能力。停止需要当前任务 ID，保留已施工部分及对应快照，可以在冲突校验后撤销。撤销会比较施工后方块状态及方块实体数据。

连接不会自动施工。原生实体、未加载区块、世界边界和状态错误会在写入前报告，施工前在 `craftstudio-backups` 写入 JSON 备份。
