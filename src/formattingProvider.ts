import * as vscode from "vscode";
import { ConsolidateFormatter, EvenlyDistributedFormatter } from "./formatters";
import { SettingsManager } from "./settingsManager";
import { TableParser } from "./tableParser";

export class MarkdownTableFormattingProvider
  implements vscode.DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    _options: vscode.FormattingOptions,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    const settings = SettingsManager.getSettings();

    if (!settings.formatOnSave) {
      return []
    }

    return this.formatDocument(
      document,
      settings.defaultMode,
      settings.fontWidthRatio,
    );
  }

  formatDocument(
    document: vscode.TextDocument,
    mode: "consolidate" | "evenly-distributed",
    fontWidthRatio: string,
  ): vscode.TextEdit[] {
    const documentText = document.getText();
    const tables = TableParser.parseDocument(documentText);

    if (tables.length === 0) {
      return [];
    }

    const formatter = this.createFormatter(mode, fontWidthRatio);
    const edits: vscode.TextEdit[] = [];

    // Process tables in reverse order to maintain correct line positions
    tables.reverse();

    for (const table of tables) {
      const formattedText = formatter.format(table).join("\n");
      const tableRange = this.createTableRange(document, table);

      edits.push(new vscode.TextEdit(tableRange, formattedText));
    }

    return edits;
  }

  private createFormatter(
    mode: "consolidate" | "evenly-distributed",
    fontWidthRatio: string,
  ) {
    return mode === "consolidate"
      ? new ConsolidateFormatter(fontWidthRatio)
      : new EvenlyDistributedFormatter(fontWidthRatio);
  }

  private createTableRange(
    document: vscode.TextDocument,
    table: { startLine: number; endLine: number },
  ): vscode.Range {
    const startPosition = new vscode.Position(table.startLine, 0);
    const endPosition = new vscode.Position(
      table.endLine,
      document.lineAt(table.endLine).text.length,
    );

    return new vscode.Range(startPosition, endPosition);
  }
}
