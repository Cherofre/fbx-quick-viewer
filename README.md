# FBX 快速预览器

一个基于 Electron + Three.js 的本地 FBX 模型快速预览工具，适合在 Windows 环境下快速浏览、筛选和检查 `.fbx` 文件。

## 功能特点

- 扫描文件夹并递归查找 FBX 文件
- 列表视图与缩略图视图切换
- 自动生成并缓存缩略图
- 支持收藏、搜索、排序与历史目录
- 支持模型基础统计信息查看
- 支持标准材质、线框、顶点色、UV 预览等显示模式
- 支持法线显示、双面显示、地面网格与视角控制
- 支持 DDS、TGA 及常见图片贴图预览

## 运行环境

- Windows
- Node.js 18 及以上
- npm

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm start
```

## 打包发布

生成可执行目录：

```bash
npm run pack
```

生成安装包和便携版：

```bash
npm run dist
```

默认会使用 `electron-builder` 构建 Windows 安装包与便携版程序。

## 项目结构

```text
.
├─ index.html        # 主界面与渲染层逻辑
├─ main.js           # Electron 主进程
├─ libs/             # Three.js 及相关加载器
├─ icon.png          # 应用图标
├─ package.json      # 项目配置与脚本
└─ 打包.txt          # 简单打包说明
```

## 使用说明

1. 启动程序后点击“打开文件夹”。
2. 选择包含 `.fbx` 文件的目录。
3. 在左侧列表或缩略图中选择模型。
4. 在右侧查看模型，并使用显示模式、相机工具和 UV 工具辅助检查。

## 数据与缓存

程序会在运行目录附近创建 `FBX_Data` 文件夹，用于保存：

- 收藏数据
- 缩略图缓存
- 窗口状态

## 发布信息

当前版本：`v1.0.0`

建议发布产物：

- 安装版：`fbx-quick-viewer Setup 1.0.0.exe`
- 便携版：`fbx-quick-viewer 1.0.0.exe`

## 许可证

ISC
