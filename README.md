# mcp-color

Color utilities MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1156+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `color_convert` | Convert a color (HEX, rgb(), hsl(), or a CSS name) to all formats: HEX, RGB and HSL. Keyless, offline. |
| `color_contrast` | Compute the WCAG 2.1 contrast ratio between two colors and whether it passes AA/AAA for normal and large text. Keyless, offline. |
| `nearest_color` | Find the nearest CSS named color to a given color (Euclidean RGB distance). Keyless, offline. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "color": {
      "url": "https://gateway.pipeworx.io/color/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1156+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Color data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
