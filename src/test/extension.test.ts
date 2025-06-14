import * as assert from "node:assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("Ryuzaki.unicode-table-formatter"));
  });

  test("Commands should be registered", async () => {
    // Activate the extension first
    const extension = vscode.extensions.getExtension(
      "Ryuzaki.unicode-table-formatter",
    );
    if (extension && !extension.isActive) {
      await extension.activate();
    }

    const commands = await vscode.commands.getCommands(true);

    assert.ok(commands.includes("unicode-table-formatter.formatConsolidate"));
    assert.ok(
      commands.includes("unicode-table-formatter.formatEvenlyDistributed"),
    );
  });
});
