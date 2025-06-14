import * as assert from "node:assert";
import { TableParser } from "../tableParser";

suite("TableParser Tests", () => {
  suite("Basic Table Parsing", () => {
    test("should parse simple table correctly", () => {
      const markdown = `| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.strictEqual(table.startLine, 0);
      assert.strictEqual(table.endLine, 3);
      assert.strictEqual(table.headerRow.cells.length, 2);
      assert.strictEqual(table.headerRow.cells[0].content, "Name");
      assert.strictEqual(table.headerRow.cells[1].content, "Age");
      assert.strictEqual(table.dataRows.length, 2);
      assert.strictEqual(table.dataRows[0].cells[0].content, "Alice");
      assert.strictEqual(table.dataRows[0].cells[1].content, "30");
    });

    test("should parse table with alignment indicators", () => {
      const markdown = `| Left | Center | Right |
|:-----|:------:|------:|
| A | B | C |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.deepStrictEqual(table.columnAlignments, [
        "left",
        "center",
        "right",
      ]);
    });

    test("should parse table with no alignment indicators", () => {
      const markdown = `| Col1 | Col2 |
|------|------|
| A | B |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.deepStrictEqual(table.columnAlignments, ["none", "none"]);
    });
  });

  suite("Multiple Tables", () => {
    test("should parse multiple tables in document", () => {
      const markdown = `# First Table
| Name | Age |
|------|-----|
| Alice | 30 |

Some text between tables.

| Product | Price |
|---------|-------|
| Apple | $1.00 |
| Orange | $1.50 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 2);

      assert.strictEqual(tables[0].headerRow.cells[0].content, "Name");
      assert.strictEqual(tables[1].headerRow.cells[0].content, "Product");
    });

    test("should handle tables with different column counts", () => {
      const markdown = `| A | B |
|---|---|
| 1 | 2 |

| X | Y | Z |
|---|---|---|
| 1 | 2 | 3 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 2);
      assert.strictEqual(tables[0].headerRow.cells.length, 2);
      assert.strictEqual(tables[1].headerRow.cells.length, 3);
    });
  });

  suite("Unicode Content", () => {
    test("should parse table with CJK characters", () => {
      const markdown = `| 名前 | 年齢 | 都市 |
|------|------|------|
| 田中太郎 | 30 | 東京 |
| 김철수 | 25 | 서울 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.strictEqual(table.headerRow.cells[0].content, "名前");
      assert.strictEqual(table.dataRows[0].cells[0].content, "田中太郎");
      assert.strictEqual(table.dataRows[1].cells[0].content, "김철수");
    });

    test("should parse table with emojis", () => {
      const markdown = `| Name | Status | Mood |
|------|--------|------|
| Alice | ✅ | 😊 |
| Bob | ❌ | 😢 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.strictEqual(table.dataRows[0].cells[1].content, "✅");
      assert.strictEqual(table.dataRows[0].cells[2].content, "😊");
    });
  });

  suite("Edge Cases", () => {
    test("should handle empty cells", () => {
      const markdown = `| A | B | C |
|---|---|---|
| 1 |   | 3 |
|   | 2 |   |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.strictEqual(table.dataRows[0].cells[1].content, "");
      assert.strictEqual(table.dataRows[1].cells[0].content, "");
      assert.strictEqual(table.dataRows[1].cells[2].content, "");
    });

    test("should handle cells with extra spaces", () => {
      const markdown = `|  Name  |  Age  |
|--------|-------|
|  Alice  |  30  |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.strictEqual(table.headerRow.cells[0].content, "Name");
      assert.strictEqual(table.headerRow.cells[1].content, "Age");
      assert.strictEqual(table.dataRows[0].cells[0].content, "Alice");
      assert.strictEqual(table.dataRows[0].cells[1].content, "30");
    });

    test("should handle tables with inconsistent row lengths", () => {
      const markdown = `| A | B | C |
|---|---|---|
| 1 | 2 |
| 4 | 5 | 6 | 7 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      // Should only include the first data row that matches column count
      assert.strictEqual(table.dataRows.length, 0);
    });

    test("should ignore malformed tables", () => {
      const markdown = `| Name | Age |
| Alice | 30 |
| Bob | 25 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 0);
    });

    test("should handle table at end of document", () => {
      const markdown = `| Name | Age |
|------|-----|
| Alice | 30 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);
      assert.strictEqual(tables[0].dataRows.length, 1);
    });
  });

  suite("Whitespace and Formatting", () => {
    test("should handle indented tables", () => {
      const markdown = `    | Name | Age |
    |------|-----|
    | Alice | 30 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);
      assert.strictEqual(tables[0].headerRow.cells[0].content, "Name");
    });

    test("should handle tables with trailing spaces", () => {
      const markdown = `| Name | Age |   
|------|-----|   
| Alice | 30 |   `;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);
      assert.strictEqual(tables[0].dataRows.length, 1);
    });
  });

  suite("Complex Alignment Patterns", () => {
    test("should parse all alignment combinations", () => {
      const markdown = `| Left | Center | Right | None |
|:-----|:------:|------:|------|
| A | B | C | D |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.deepStrictEqual(table.columnAlignments, [
        "left",
        "center",
        "right",
        "none",
      ]);
    });

    test("should handle alignment with varying dash counts", () => {
      const markdown = `| A | B | C |
|:--|:----:|--:|
| 1 | 2 | 3 |`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);

      const table = tables[0];
      assert.deepStrictEqual(table.columnAlignments, [
        "left",
        "center",
        "right",
      ]);
    });
  });

  suite("Document Structure", () => {
    test("should handle empty document", () => {
      const tables = TableParser.parseDocument("");
      assert.strictEqual(tables.length, 0);
    });

    test("should handle document with no tables", () => {
      const markdown = `# Title
Some text without tables.
More text here.`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 0);
    });

    test("should preserve line numbers correctly", () => {
      const markdown = `Line 0
Line 1
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
Line 6`;

      const tables = TableParser.parseDocument(markdown);
      assert.strictEqual(tables.length, 1);
      assert.strictEqual(tables[0].startLine, 2);
      assert.strictEqual(tables[0].endLine, 5);
    });
  });
});
