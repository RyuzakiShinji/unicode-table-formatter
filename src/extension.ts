import * as vscode from "vscode";
import { MarkdownTableFormattingProvider } from "./formattingProvider";
import { SettingsManager } from "./settingsManager";

export function activate(context: vscode.ExtensionContext) {
  const formattingProvider = new MarkdownTableFormattingProvider();

  const formatConsolidateCommand = vscode.commands.registerCommand(
    "unicode-table-formatter.formatConsolidate",
    () => formatTablesInActiveEditor("consolidate"),
  );

  const formatEvenlyDistributedCommand = vscode.commands.registerCommand(
    "unicode-table-formatter.formatEvenlyDistributed",
    () => formatTablesInActiveEditor("evenly-distributed"),
  );

  const documentFormattingProvider =
    vscode.languages.registerDocumentFormattingEditProvider(
      { scheme: "file", language: "markdown" },
      formattingProvider,
    );

  context.subscriptions.push(
    formatConsolidateCommand,
    formatEvenlyDistributedCommand,
    documentFormattingProvider,
  );
}

async function formatTablesInActiveEditor(
  mode: "consolidate" | "evenly-distributed",
): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor || editor.document.languageId !== "markdown") {
    vscode.window.showWarningMessage(
      "Please open a Markdown file to format tables.",
    );
    return;
  }

  const document = editor.document;
  const fontWidthRatio = SettingsManager.getFontWidthRatio();
  const formattingProvider = new MarkdownTableFormattingProvider();
  
  const edits = formattingProvider.formatDocument(document, mode, fontWidthRatio);

  if (edits.length === 0) {
    vscode.window.showInformationMessage("No markdown tables found to format.");
    return;
  }

  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(document.uri, edits);

  const success = await vscode.workspace.applyEdit(workspaceEdit);
  const modeDisplayText = mode === "consolidate" ? "Consolidate" : "Evenly Distributed";

  if (success) {
    vscode.window.showInformationMessage(
      `Tables formatted using ${modeDisplayText} mode.`,
    );
  } else {
    vscode.window.showErrorMessage("Failed to format tables.");
  }
}

export function deactivate() {}
