# Changelog

All notable changes to the Unicode Table Formatter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2025-06-14

### Fixed
- Updated image URLs in README files to use raw GitHub URLs for proper display in VSCode marketplace

## [0.0.1] - 2025-06-14

### Added
- Unicode-aware table formatting for markdown files
- Support for CJK characters, emojis, and combining characters
- Two formatting modes:
  - **Consolidate**: Minimal padding for compact tables
  - **Evenly Distributed**: Balanced columns with proper Unicode width calculation
- Configurable font width ratios via `unicodeTableFormatter.fontWidthRatio` setting
- Format-on-save integration with `unicodeTableFormatter.formatOnSave` setting
- Default mode selection via `unicodeTableFormatter.defaultMode` setting
- Keyboard shortcuts:
  - `Cmd+Shift+Alt+C` (Mac) / `Ctrl+Shift+Alt+C` (Windows/Linux) for Consolidate mode
  - `Cmd+Shift+Alt+E` (Mac) / `Ctrl+Shift+Alt+E` (Windows/Linux) for Evenly Distributed mode
- Table alignment preservation (left, center, right)
- VSCode document formatting provider integration
- Comprehensive test suite with 84 test cases
- MIT License
- Multi-language documentation (English and Japanese)

### Technical Details
- Unicode character width calculation engine
- Table parsing with markdown syntax support
- Performance optimization for large documents
- Error handling for malformed tables
- Support for mixed content tables