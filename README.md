# Unicode Table Formatter

**Language:** English | [日本語](README.ja.md)

A VSCode extension that formats markdown tables with Unicode-aware width calculation for CJK characters, emojis, and mixed content. Features configurable font-width ratios to ensure perfect table alignment across different character sets.

> **⚠️ Important:**
This extension is designed for **monospaced fonts only** and relies on characters being supported by your chosen font family. For best results, use a monospaced font that includes comprehensive Unicode support (such as Fira Code, JetBrains Mono, or Noto Sans Mono). Table alignment may appear incorrect with proportional fonts or when using characters not supported by your font.

## Features

- **Unicode-Aware Width Calculation** - Properly handles CJK characters, emojis, and combining characters
- **Two Formatting Modes** - Consolidate (minimal) and Evenly Distributed (balanced columns)
- **Configurable Font Ratios** - Adjust character width ratios to match your font
- **Format-on-Save Support** - Automatic formatting integration

## Keyboard Shortcuts

| Platform | Consolidate Format | Evenly Distributed Format |
|----------|-------------------|---------------------------|
| **Mac** | `Cmd+Shift+Alt+C` | `Cmd+Shift+Alt+E` |
| **Windows/Linux** | `Ctrl+Shift+Alt+C` | `Ctrl+Shift+Alt+E` |

## Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `unicodeTableFormatter.fontWidthRatio` | string | `1:2` | Font width ratio for half-width:full-width characters (e.g., `1:2`, `2:3`, `1:1`). Half-width must be ≤ full-width. |
| `unicodeTableFormatter.defaultMode` | string | `evenly-distributed` | Default formatting mode for format-on-save. Options: `consolidate` or `evenly-distributed` |
| `unicodeTableFormatter.formatOnSave` | boolean | `false` | Enable automatic table formatting when saving markdown files |

### Format on Save Setup
To enable automatic formatting on save:
1. Set `editor.formatOnSave: true` in your VSCode settings
2. Set `unicodeTableFormatter.formatOnSave: true` in the extension settings

## Examples

### Consolidate Mode
Minimal padding for token efficiency and compact tables.

![Consolidate Mode Example](https://github.com/RyuzakiShinji/unicode-table-formatter/raw/main/images/ConsolidateMode.gif)

### Evenly Distributed Mode
Balanced columns with proper Unicode-aware width calculation.

![Evenly Distributed Mode Example](https://github.com/RyuzakiShinji/unicode-table-formatter/raw/main/images/EvenlyDistributedMode.gif)

## Change Log

### 0.0.1
- Initial release with Unicode-aware table formatting
- Support for CJK characters, emojis, and combining characters
- Two formatting modes: Consolidate and Evenly Distributed
- Configurable font width ratios
- Format-on-save integration
- Keyboard shortcuts for quick formatting
- Alignment preservation (left, center, right)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
