# FBX 快速预览器 v1.0.5 发布清单

## 发布前确认

- [x] 当前版本号为 `1.0.5`，自动更新修复已合并到 `master`。
- [x] `npm test` 通过。
- [x] `npm audit --audit-level=high` 报告 0 个漏洞。
- [x] `npm run dist` 成功生成安装版和便携版。
- [x] 打包后的 Electron smoke 检查通过，没有残留进程。
- [x] `latest.yml` 的安装包 SHA-512 与实际安装包一致。
- [x] 发布说明已准备：`RELEASE_NOTES_v1.0.5_CN.md`。
- [x] 在真实 3ds Max 工作流中验证 FBX 拖入功能。
- [x] 在此前的迭代反馈中验证“复制 .mesh 路径”和 UV 拖动、重置、撤销交互。
- [x] 用户确认发布当前未签名产物，并接受可能出现“未知发布者”或 SmartScreen 提示。

## 最终产物

- 安装版上传文件：`dist/fbx-quick-viewer.Setup.1.0.5.exe`
- 安装版 SHA-256：`CDBEF4EFF8EB60395CBFBE1BAFB2CAEAC8436B12A0EEB626CF4270C88C93BE01`
- 便携版上传文件：`dist/fbx-quick-viewer.1.0.5.exe`
- 便携版 SHA-256：`FCE9B48B334F2A5DF77DACADEDF380A3D5AE199ADC6A86BF385893FED6B008CE`
- 自动更新元数据：`dist/latest.yml`
- `latest.yml` SHA-256：`EC60EB3D21BD988A92FBB29E57198955905B37DA76EB4C674D97F4965E7F81DF`
- 安装版 blockmap：`dist/fbx-quick-viewer.Setup.1.0.5.exe.blockmap`
- blockmap SHA-256：`63258ABE3890CFA6D9ECC333E184C1F35B8BD29734D8057E465915690D268AD8`

上传前重新计算哈希并与本清单核对；如果重新运行 `npm run dist`，必须同步更新这里和 `PROJECT_STATUS.md`。

## Git 收口

- [x] 检查 `git diff --check`、`git status` 和最终差异，确保没有缓存、日志、`dist` 或 `FBX_Data` 被纳入提交。
- [x] 将确认后的 1.0.5 文件提交到 `release/v1.0.5`。
- [x] 将 `release/v1.0.5` 合并到稳定分支 `master`。
- [x] 在合并后的发布提交创建 tag `1.0.5`，与现有 GitHub Release 的 tag 习惯保持一致。
- [x] 推送 `master`、release 分支和 tag，并确认远程为 `Cherofre/fbx-quick-viewer`。

## GitHub Draft Release

- [x] 创建并发布 Release，tag 为 `1.0.5`，标题为 `v1.0.5`。
- [x] 正文使用 `RELEASE_NOTES_v1.0.5_CN.md`。
- [x] 上传安装版 `fbx-quick-viewer.Setup.1.0.5.exe`。
- [x] 上传便携版 `fbx-quick-viewer.1.0.5.exe`。
- [x] 核对文件大小、SHA-256、Windows 10/11 说明和未签名风险提示。

## 自动更新替换

- [x] 安装版集成 `electron-updater`，便携版明确排除自动覆盖。
- [x] 后台下载显示百分比、大小和速度，状态条不阻塞主界面。
- [x] 下载完成后由用户选择重启，使用静默安装并重新启动应用。
- [x] NSIS 从旧版注册表 `InstallLocation` 复用原安装目录。
- [x] AppData 保留，安装目录旁 `FBX_Data` 在升级期间临时保护并恢复。
- [x] 生成并核对 `app-update.yml`、`latest.yml`、安装包和 blockmap。
- [x] 将自动更新修复提交并合并到 `master`，移动 `1.0.5` tag 到新的发布提交。
- [x] 替换 GitHub Release 的安装版和便携版，并新增 `latest.yml` 与 blockmap。
- [x] 核对四个远程附件的大小和 SHA-256。

## 发布后验证

- [x] 打开 GitHub Release 页面，确认正文、tag、标题和两个附件均正确。
- [x] 调用 GitHub latest release API，确认返回版本为 `1.0.5`。
- [x] 旧版应用“检查更新”已确认显示 1.0.5 并能打开正确发布页；旧版本仍需手动安装这次 1.0.5。
- [x] GitHub 返回的四个附件摘要已与本地 SHA-256 逐项核对一致。
- [x] 确认无误后，将发布结果和最终提交号记录到 `PROJECT_STATUS.md`。
