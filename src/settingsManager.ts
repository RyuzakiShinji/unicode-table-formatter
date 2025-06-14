import * as vscode from "vscode";

export interface TableFormatterSettings {
  fontWidthRatio: string;
  defaultMode: "consolidate" | "evenly-distributed";
  formatOnSave: boolean;
}

// biome-ignore lint/complexity/noStaticOnlyClass: VSCode configuration management works well as static utility class
export class SettingsManager {
  private static readonly CONFIGURATION_SECTION = "unicodeTableFormatter";

  static getSettings(): TableFormatterSettings {
    const config = vscode.workspace.getConfiguration(
      SettingsManager.CONFIGURATION_SECTION,
    );

    return {
      fontWidthRatio: config.get<string>("fontWidthRatio", "1:2"),
      defaultMode: config.get<"consolidate" | "evenly-distributed">(
        "defaultMode",
        "evenly-distributed",
      ),
      formatOnSave: config.get<boolean>("formatOnSave", false),
    };
  }

  static getFontWidthRatio(): string {
    return vscode.workspace
      .getConfiguration(SettingsManager.CONFIGURATION_SECTION)
      .get<string>("fontWidthRatio", "1:2");
  }

  static getDefaultMode(): "consolidate" | "evenly-distributed" {
    return vscode.workspace
      .getConfiguration(SettingsManager.CONFIGURATION_SECTION)
      .get<"consolidate" | "evenly-distributed">(
        "defaultMode",
        "evenly-distributed",
      );
  }

  static getFormatOnSave(): boolean {
    return vscode.workspace
      .getConfiguration(SettingsManager.CONFIGURATION_SECTION)
      .get<boolean>("formatOnSave", false);
  }

  static onConfigurationChanged(
    callback: (settings: TableFormatterSettings) => void,
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(SettingsManager.CONFIGURATION_SECTION)) {
        callback(SettingsManager.getSettings());
      }
    });
  }
}
