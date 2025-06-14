import * as assert from "node:assert";
import * as vscode from "vscode";
import {
  ConsolidateFormatter,
  EvenlyDistributedFormatter,
} from "../formatters";
import { MarkdownTableFormattingProvider } from "../formattingProvider";
import { TableParser } from "../tableParser";

suite("Integration Tests", () => {
  suite("End-to-End Table Formatting", () => {
    test("should format complete document with consolidate mode", () => {
      const input = `# Test Document

| Name | Age | City |
|------|-----|------|
| Alice | 30 | New York |
| Bob | 25 | Los Angeles |

Some text here.

| Product | Price | Category |
|---------|-------|----------|
| Apple | $1.00 | Fruit |
| Laptop | $999.99 | Electronics |`;

      const tables = TableParser.parseDocument(input);
      assert.strictEqual(tables.length, 2);

      const formatter = new ConsolidateFormatter("1:2");

      const formattedTable1 = formatter.format(tables[0]);
      const formattedTable2 = formatter.format(tables[1]);

      // Check that formatting preserves content but minimizes padding
      assert.ok(formattedTable1[0].includes("Name"));
      assert.ok(formattedTable1[2].includes("Alice"));
      assert.ok(formattedTable2[0].includes("Product"));
      assert.ok(formattedTable2[2].includes("Apple"));

      // Consolidate format should be compact
      assert.strictEqual(formattedTable1[0], "| Name | Age | City |");
      assert.strictEqual(formattedTable1[1], "| --- | --- | --- |");
    });

    test("should format complete document with evenly distributed mode", () => {
      const input = `| Short | Very Long Header Content | A |
|-------|--------------------------|---|
| X | This is very long content | B |
| Y | Short | C |`;

      const tables = TableParser.parseDocument(input);
      assert.strictEqual(tables.length, 1);

      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);

      // Should have consistent column widths
      const headerRow = result[0];
      const dataRow1 = result[2];
      const dataRow2 = result[3];

      // All rows should be same length
      assert.strictEqual(headerRow.length, dataRow1.length);
      assert.strictEqual(headerRow.length, dataRow2.length);

      // Content should be preserved
      assert.ok(headerRow.includes("Very Long Header Content"));
      assert.ok(dataRow1.includes("This is very long content"));
    });

    test("should handle mixed Unicode content end-to-end", () => {
      const input = `| 名前 | Age | Status | 都市 |
|:-----|----:|:------:|:-----|
| 田中太郎 | 30 | ✅ Active | 東京 |
| Smith | 25 | ❌ Inactive | London |
| 김철수 | 28 | ⚠️ Warning | 서울 |`;

      const tables = TableParser.parseDocument(input);
      assert.strictEqual(tables.length, 1);
      assert.deepStrictEqual(tables[0].columnAlignments, [
        "left",
        "right",
        "center",
        "left",
      ]);

      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);

      // Check alignment preservation
      assert.ok(result[1].includes(":--")); // left alignment
      assert.ok(result[1].includes("--:")); // right alignment
      assert.ok(result[1].includes(":-") && result[1].includes("-:")); // center alignment

      // Check Unicode content preservation
      assert.ok(result[2].includes("田中太郎"));
      assert.ok(result[2].includes("✅"));
      assert.ok(result[4].includes("김철수"));
    });
  });

  suite("Document Formatting Provider Integration", () => {
    class MockDocument implements vscode.TextDocument {
      uri: vscode.Uri = vscode.Uri.file("/test");
      fileName = "test.md";
      isUntitled = false;
      languageId = "markdown";
      version = 1;
      isDirty = false;
      isClosed = false;
      eol: vscode.EndOfLine = vscode.EndOfLine.LF;
      lineCount: number;
      encoding = "utf8";

      constructor(private content: string) {
        this.lineCount = this.content.split("\n").length;
      }

      getText(): string {
        return this.content;
      }

      lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {
        const lineNumber =
          typeof lineOrPosition === "number"
            ? lineOrPosition
            : lineOrPosition.line;
        const lines = this.content.split("\n");
        const text = lines[lineNumber] || "";
        const range = new vscode.Range(lineNumber, 0, lineNumber, text.length);
        return {
          text,
          range,
          rangeIncludingLineBreak: range,
          lineNumber,
          isEmptyOrWhitespace: text.trim().length === 0,
          firstNonWhitespaceCharacterIndex: text.search(/\S/) || 0,
        };
      }

      save(): Thenable<boolean> {
        return Promise.resolve(true);
      }
      offsetAt(_position: vscode.Position): number {
        return 0;
      }
      positionAt(_offset: number): vscode.Position {
        return new vscode.Position(0, 0);
      }
      getWordRangeAtPosition(
        _position: vscode.Position,
      ): vscode.Range | undefined {
        return undefined;
      }
      validateRange(range: vscode.Range): vscode.Range {
        return range;
      }
      validatePosition(position: vscode.Position): vscode.Position {
        return position;
      }
    }

    test("should format document with formatting provider", () => {
      const content = `| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |`;

      const document = new MockDocument(content);
      const provider = new MarkdownTableFormattingProvider();

      const edits = provider.formatDocument(document, "consolidate", "1:2");

      assert.strictEqual(edits.length, 1);
      const edit = edits[0];

      // Should replace the entire table
      assert.strictEqual(edit.range.start.line, 0);
      assert.strictEqual(edit.range.end.line, 3);

      // Should contain formatted content
      assert.ok(edit.newText.includes("| Name | Age |"));
    });

    test("should handle document with multiple tables", () => {
      const content = `| Table1 | Col |
|--------|-----|
| A | B |

Text between

| Table2 | Column |
|--------|--------|
| C | D |`;

      const document = new MockDocument(content);
      const provider = new MarkdownTableFormattingProvider();

      const edits = provider.formatDocument(
        document,
        "evenly-distributed",
        "1:2",
      );

      // Should have 2 edits for 2 tables
      assert.strictEqual(edits.length, 2);

      // First table edit
      assert.strictEqual(edits[1].range.start.line, 0); // Note: edits are reversed
      assert.strictEqual(edits[1].range.end.line, 2);

      // Second table edit
      assert.strictEqual(edits[0].range.start.line, 6);
      assert.strictEqual(edits[0].range.end.line, 8);
    });

    test("should return empty edits for document with no tables", () => {
      const content = `# Title
Some text without tables.
More content here.`;

      const document = new MockDocument(content);
      const provider = new MarkdownTableFormattingProvider();

      const edits = provider.formatDocument(document, "consolidate", "1:2");
      assert.strictEqual(edits.length, 0);
    });
  });

  suite("Real-world Scenarios", () => {
    test("should handle complex table with all features", () => {
      const input = `| Feature | Support | Priority | Notes |
|:--------|:-------:|:--------:|------:|
| Unicode | ✅ Full | High | CJK characters: 中文, 한글, ひらがな |
| Emojis | ✅ Yes | Medium | 😊 🎉 ⚠️ ❌ |
| Alignment | ✅ All | High | Left, Center, Right |
| Long Content | ✅ | Low | This is a very long piece of content that tests word wrapping and column width calculation |
| Empty |  | Low |  |`;

      const tables = TableParser.parseDocument(input);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.strictEqual(table.headerRow.cells.length, 4);
      assert.deepStrictEqual(table.columnAlignments, [
        "left",
        "center",
        "center",
        "right",
      ]);

      // Test both formatters
      const consolidate = new ConsolidateFormatter("1:2");
      const evenlyDistributed = new EvenlyDistributedFormatter("1:2");

      const consolidateResult = consolidate.format(table);
      const evenlyDistributedResult = evenlyDistributed.format(table);

      // Both should preserve all content
      assert.ok(consolidateResult.join("\n").includes("中文"));
      assert.ok(consolidateResult.join("\n").includes("😊"));
      assert.ok(evenlyDistributedResult.join("\n").includes("中文"));
      assert.ok(evenlyDistributedResult.join("\n").includes("😊"));

      // Check that long content is handled
      assert.ok(evenlyDistributedResult.join("\n").includes("word wrapping"));
    });

    test("should maintain table structure with various edge cases", () => {
      const input = `|  A  |B|  C  |
|:----|:-:|----:|
|   | x |    |
| very long content | 🎉 | short |
| 中文 | | end |`;

      const tables = TableParser.parseDocument(input);
      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);

      // Should have proper structure
      assert.strictEqual(result.length, 5); // header + separator + 3 data rows

      // All rows should be properly formatted
      for (const row of result) {
        assert.ok(row.startsWith("|"));
        assert.ok(row.endsWith("|"));
        assert.strictEqual((row.match(/\|/g) || []).length, 4); // 3 columns = 4 pipes
      }
    });

    test("should handle performance with large tables", () => {
      // Create a large table
      const headerRow = "| Col1 | Col2 | Col3 | Col4 | Col5 |";
      const separatorRow = "|------|------|------|------|------|";
      const dataRows = [];

      for (let i = 0; i < 100; i++) {
        dataRows.push(`| Row${i} | Data${i} | 値${i} | 🎉${i} | End${i} |`);
      }

      const input = [headerRow, separatorRow, ...dataRows].join("\n");

      const startTime = Date.now();
      const tables = TableParser.parseDocument(input);
      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 1 second)
      assert.ok(endTime - startTime < 1000);

      // Should preserve all content
      assert.strictEqual(result.length, 102); // header + separator + 100 data rows
      assert.ok(result[50].includes("Row48")); // Check middle content
    });
  });
});
