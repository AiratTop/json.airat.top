# JSON Formatter & Validator

[![json.airat.top](https://raw.githubusercontent.com/AiratTop/json.airat.top/main/public_html/canvas.jpg)](https://json.airat.top/)

A local, private JSON utility for formatting, minifying, validation, key sorting, JSON↔YAML conversion, and XML→JSON conversion. Runs as a pure static site and is deployed as static assets on Cloudflare Workers.

- Live site: https://json.airat.top
- Status page: https://status.airat.top

[![json.airat.top](https://raw.githubusercontent.com/AiratTop/json.airat.top/main/public_html/screenshot.png)](https://json.airat.top/)

## Features

- Format and minify JSON.
- JSON validation with line and column error details.
- Deep key sorting for JSON objects.
- JSON→YAML and YAML→JSON conversion.
- XML→JSON conversion.
- Copy, download, reset-to-example, dark mode, and local settings persistence.
- No server, no API, no third-party backend.

## Local usage

Open `public_html/index.html` in your browser.

## Deployment

Cloudflare Workers Builds deploys the contents of `public_html` as static assets. The project has no build step; deployment uses `npx wrangler deploy` with the settings in `wrangler.jsonc`.

## License

The original source code, configuration, and documentation in this repository are licensed under
the [Apache License 2.0](LICENSE), with copyright details in [NOTICE](NOTICE).

`public_html/vendor/js-yaml.min.js` is third-party software distributed under the MIT License by
its copyright holders. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Author

**AiratTop (Airat Halitov)**

- Website: [airat.top](https://airat.top)
- GitHub: [@AiratTop](https://github.com/AiratTop)
- Email: [mail@airat.top](mailto:mail@airat.top)
- Repository: [json.airat.top](https://github.com/AiratTop/json.airat.top)
