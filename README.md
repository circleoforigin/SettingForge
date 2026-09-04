# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Packaged application updates

Updates are disabled in development and when no update source is configured.
Packaged builds accept an update feed through either:

- `SETTINGFORGE_UPDATE_BASE_URL`, or
- `--update-base-url=<url>` on the packaged executable.

HTTPS is required except for `http://127.0.0.1`, which is accepted for local
proof testing. The configured directory must serve electron-builder's generated
`latest.yml`, installer, and blockmap files. Production deployments should use
an HTTPS URL and should ship signed platform packages.

For the local proof, copy the generated files into `release/update-feed`, run
`npm run update:serve`, and launch the installed older build with:

```powershell
$env:SETTINGFORGE_UPDATE_BASE_URL = 'http://127.0.0.1:8099/'
& "$env:LOCALAPPDATA\Programs\SettingForge\SettingForge.exe"
```

The application asks before restarting, then installs the approved update
silently and relaunches. Updater events are appended to
`%APPDATA%\SettingForge\logs\updater.log`.
