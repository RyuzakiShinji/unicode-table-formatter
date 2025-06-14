# Unicode Table Formatter

**言語:** [English](README.md) | 日本語

CJK文字、絵文字、混合コンテンツを適切に処理するUnicode対応の幅計算機能を持つVSCode拡張機能です。フォント幅比率を自由に設定でき、異なる文字セットでも美しいテーブル配置を実現できます。

> **⚠️ 注意事項:**
> この拡張機能は**等幅フォント専用**です。ご使用のフォントでサポートされている文字のみが対象となります。最適な結果を得るには、Unicode文字を幅広くサポートする等幅フォント（Fira Code、JetBrains Mono、Noto Sans Monoなど）をご使用ください。プロポーショナルフォントや、フォントで未対応の文字を使用した場合、テーブルの配置が崩れる可能性があります。

## 主な機能

- **Unicode対応の幅計算** - CJK文字、絵文字、結合文字を正確に処理
- **2つのフォーマットモード** - コンパクト型とバランス型を選択可能
- **フォント比率の調整** - お使いのフォントに合わせて文字幅比率をカスタマイズ
- **保存時自動フォーマット** - ファイル保存と同時に自動整形

## キーボードショートカット

| プラットフォーム | コンパクト型 | バランス型 |
|----------------|-------------|-----------|
| **Mac** | `Cmd+Shift+Alt+C` | `Cmd+Shift+Alt+E` |
| **Windows/Linux** | `Ctrl+Shift+Alt+C` | `Ctrl+Shift+Alt+E` |

## 拡張機能設定

| 設定項目 | 型 | 初期値 | 説明 |
|---------|-----|-------|------|
| `unicodeTableFormatter.fontWidthRatio` | string | `1:2` | 半角:全角文字の幅比率（例：`1:2`、`2:3`、`1:1`）。半角幅は全角幅以下に設定してください。 |
| `unicodeTableFormatter.defaultMode` | string | `evenly-distributed` | 保存時フォーマットの既定モード。選択肢：`consolidate`（コンパクト型）または `evenly-distributed`（バランス型） |
| `unicodeTableFormatter.formatOnSave` | boolean | `false` | Markdownファイル保存時にテーブルを自動整形する |

### 保存時自動フォーマットの設定方法
ファイル保存時の自動フォーマットを有効にするには：
1. VSCode設定で `editor.formatOnSave: true` に設定
2. 拡張機能設定で `unicodeTableFormatter.formatOnSave: true` に設定

## 使用例

### コンパクト型（Consolidate）
必要最小限のパディングでテーブルをコンパクトに整形します。

![Consolidate Mode Example](https://github.com/RyuzakiShinji/unicode-table-formatter/raw/main/images/ConsolidateMode.gif)

### バランス型（Evenly Distributed）
Unicode対応の幅計算により、美しくバランスの取れた列を作成します。

![Evenly Distributed Mode Example](https://github.com/RyuzakiShinji/unicode-table-formatter/raw/main/images/EvenlyDistributedMode.gif)

## 更新履歴

### 0.0.1
- Unicode対応テーブルフォーマット機能の初回リリース
- CJK文字、絵文字、結合文字への対応
- 2つのフォーマットモード：コンパクト型とバランス型
- フォント幅比率のカスタマイズ機能
- 保存時自動フォーマット機能
- 素早いフォーマット用キーボードショートカット
- テーブル配置の保持機能（左寄せ、中央揃え、右寄せ）

## ライセンス

このプロジェクトはMITライセンスのもとで公開されています。詳細については[LICENSE](LICENSE)ファイルをご覧ください。
