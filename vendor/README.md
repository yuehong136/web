# jsx-a11y 的 ESLint 10 兼容包

`eslint-plugin-jsx-a11y-6.10.2-web.1.tgz` 来自官方 npm 包 6.10.2，保留所有实现、规则、文档及 MIT 许可证。只修改 `package.json` 的本地版本标识，并为 ESLint peer 范围增加 `^10`。

截至 2026-10-02，官方发布仍只声明到 ESLint 9；上游 [ESLint 10 支持 PR](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/pull/1081) 尚未合并。这个本地兼容包不代表上游已发布支持。

生成器先检查官方 tarball 的固定 SHA-512，再逐字节保留其他 228 个文件；`jsx-a11y-provenance.json` 记录每个文件的 SHA-256。修改后的元数据在 npm 解析 peer 前生效，不使用 `--force` 或 `--legacy-peer-deps`，也不关闭无障碍规则。

```sh
node scripts/vendor-jsx-a11y.mjs
```

也可把已下载的官方 tarball 路径作为第一个参数离线重建；仍执行同一个完整性校验。生成 gzip 时不写入当前时间，输出可重复。规则兼容性由 tooling 测试、全量源码 lint、typed lint 及现有安全规则回归验证。

官方发布包含 ESLint 10 peer 支持的版本后，删除此本地包和生成器，将依赖换回官方发行版，再运行相同门禁。避免直接用尚未发布的 Git 分支替代锁定依赖。
