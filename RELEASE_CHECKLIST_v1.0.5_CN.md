# FBX 快速预览器 v1.0.5 发布清单

## 发布前确认

- [x] 当前版本号为 `1.0.5`，当前分支为 `release/v1.0.5`。
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
- 安装版 SHA-256：`D454D4F98DECB04C9A39CB1A79DE2584645BC7DF7580EFF01F04AC52FB826D21`
- 便携版上传文件：`dist/fbx-quick-viewer.1.0.5.exe`
- 便携版 SHA-256：`39F7CCD18726FA04CA4FCC3891DEBCD3D57AE2C22C465A695D527B69651E2731`

上传前重新计算哈希并与本清单核对；如果重新运行 `npm run dist`，必须同步更新这里和 `PROJECT_STATUS.md`。

## Git 收口

- [x] 检查 `git diff --check`、`git status` 和最终差异，确保没有缓存、日志、`dist` 或 `FBX_Data` 被纳入提交。
- [ ] 将确认后的 1.0.5 文件提交到 `release/v1.0.5`。
- [ ] 将 `release/v1.0.5` 合并到稳定分支 `master`。
- [ ] 在合并后的发布提交创建 tag `1.0.5`，与现有 GitHub Release 的 tag 习惯保持一致。
- [ ] 推送 `master`、release 分支和 tag 前再次确认远程为 `Cherofre/fbx-quick-viewer`。

## GitHub Draft Release

- [ ] 创建 Draft Release，tag 选择 `1.0.5`，标题建议使用 `v1.0.5`。
- [ ] 正文使用 `RELEASE_NOTES_v1.0.5_CN.md`。
- [ ] 上传安装版 `fbx-quick-viewer.Setup.1.0.5.exe`。
- [ ] 上传便携版 `fbx-quick-viewer.1.0.5.exe`。
- [ ] 发布前核对文件大小、SHA-256、Windows 10/11 说明和未签名风险提示。

## 发布后验证

- [ ] 打开 GitHub Release 页面，确认正文、tag、标题和两个附件均正确。
- [ ] 调用 GitHub latest release API，确认返回版本为 `1.0.5`。
- [ ] 在旧版本应用中手动“检查更新”，确认显示 1.0.5 更新说明并能打开正确发布页。
- [ ] 从 Release 页面各下载一次安装版和便携版，重新核对 SHA-256 并启动检查。
- [ ] 确认无误后，将发布结果和最终提交号记录到 `PROJECT_STATUS.md`。
