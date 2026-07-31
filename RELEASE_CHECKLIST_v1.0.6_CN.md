# FBX 快速预览器 v1.0.6 发布清单

## 发布前确认

- [x] 当前版本号为 `1.0.6`，工作分支为 `release/v1.0.6`。
- [x] `npm test` 全部通过，其中 Electron smoke 会实际创建第二个预览窗口。
- [x] `npm audit --audit-level=high` 报告 0 个已知漏洞。
- [x] `npm run dist` 成功生成安装版、便携版、`latest.yml` 和 blockmap。
- [x] 打包后的 `app.asar` 版本为 1.0.6，并包含 `open-fbx.js`、`preload.js` 和 `index.html`。
- [x] `latest.yml` 的安装包 SHA-512 与实际安装包一致。
- [x] 发布说明已准备：`RELEASE_NOTES_v1.0.6_CN.md`。
- [x] Windows 默认应用注册不修改受保护的 `UserChoice`。
- [x] 便携版不注册 FBX 文件关联。
- [ ] 用最终安装包手动验证当前窗口和新窗口两种外部打开方式。
- [ ] 用最终安装包手动验证窗口恢复时的黑帧改善。
- [x] 已知并接受当前产物未进行商业代码签名，可能出现未知发布者或 SmartScreen 提示。

## 最终产物

- 安装版：`dist/fbx-quick-viewer.Setup.1.0.6.exe`
- 安装版 SHA-256：`403A74D12040E75F13FBFD2A6438770C1C99FE2C5CD56193B66081BEFB2CA1C3`
- 便携版：`dist/fbx-quick-viewer.1.0.6.exe`
- 便携版 SHA-256：`4CCAFDF1A1D67FA65C851020A5EA5530BEC749EBCEE878ED099C545D5869D350`
- 自动更新元数据：`dist/latest.yml`
- `latest.yml` SHA-256：`B6ABC88594D657F1E03C826BF310201268C3AB27F2334065744BDA41C9A34486`
- 安装版 blockmap：`dist/fbx-quick-viewer.Setup.1.0.6.exe.blockmap`
- blockmap SHA-256：`55B2A6E48BED96F69816F41DA79F27C81B14040B2BB2D8F5AFF628C08542F652`

## Git 收口

- [x] 检查 `git diff --check`、`git status` 和最终差异，确认没有缓存、日志、`dist` 或 `FBX_Data` 被纳入提交。
- [x] 将发布候选提交到 `release/v1.0.6`：`13acc29`。
- [x] 将 `release/v1.0.6` 快进合并到稳定分支 `master`。
- [x] 在发布记录提交 `10c1787` 创建 annotated tag `1.0.6`。
- [x] 推送 `master`、release 分支和 tag。

## GitHub Release

- [x] 创建 Release，tag 为 `1.0.6`，标题为 `v1.0.6`：`https://github.com/Cherofre/fbx-quick-viewer/releases/tag/1.0.6`。
- [x] 正文使用 `RELEASE_NOTES_v1.0.6_CN.md`。
- [x] 上传安装版、便携版、`latest.yml` 和安装版 blockmap。
- [x] 核对四个附件的文件大小和 SHA-256，均与本地产物一致。

## 发布后验证

- [x] GitHub latest-release API 返回 `1.0.6`。
- [ ] 已安装的 1.0.5 在后台发现并下载 1.0.6，下载进度不阻塞当前操作。
- [ ] 1.0.5 重启安装后覆盖原目录、保留原数据并启动为 1.0.6。
- [x] 远程附件摘要与本地 SHA-256 逐项一致。
- [x] 将发布提交、tag、Release URL 和远程摘要记录到 `PROJECT_STATUS.md`。
