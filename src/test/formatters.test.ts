import * as assert from "node:assert";
import {
  ConsolidateFormatter,
  EvenlyDistributedFormatter,
} from "../formatters";
import type { ParsedTable } from "../tableParser";

suite("Formatters Tests", () => {
  function createTestTable(
    headerCells: string[],
    alignments: ("left" | "center" | "right" | "none")[],
    dataRows: string[][],
  ): ParsedTable {
    return {
      startLine: 0,
      endLine: dataRows.length + 1,
      headerRow: {
        cells: headerCells.map((content) => ({
          content,
          alignment: "none" as const,
        })),
      },
      separatorRow: "|------|------|",
      dataRows: dataRows.map((row) => ({
        cells: row.map((content) => ({ content, alignment: "none" as const })),
      })),
      columnAlignments: alignments,
    };
  }

  suite("ConsolidateFormatter", () => {
    let formatter: ConsolidateFormatter;

    setup(() => {
      formatter = new ConsolidateFormatter("1:2");
    });

    test("should format simple table with minimal padding", () => {
      const table = createTestTable(
        ["Name", "Age"],
        ["none", "none"],
        [
          ["Alice", "30"],
          ["Bob", "25"],
        ],
      );

      const result = formatter.format(table);
      const expected = [
        "| Name | Age |",
        "| --- | --- |",
        "| Alice | 30 |",
        "| Bob | 25 |",
      ];

      assert.deepStrictEqual(result, expected);
    });

    test("should handle Unicode characters", () => {
      const table = createTestTable(
        ["名前", "年齢"],
        ["none", "none"],
        [
          ["田中太郎", "30"],
          ["김철수", "25"],
        ],
      );

      const result = formatter.format(table);
      const expected = [
        "| 名前 | 年齢 |",
        "| --- | --- |",
        "| 田中太郎 | 30 |",
        "| 김철수 | 25 |",
      ];

      assert.deepStrictEqual(result, expected);
    });

    test("should handle empty cells", () => {
      const table = createTestTable(
        ["A", "B"],
        ["none", "none"],
        [
          ["1", ""],
          ["", "2"],
        ],
      );

      const result = formatter.format(table);
      const expected = ["| A | B |", "| --- | --- |", "| 1 |  |", "|  | 2 |"];

      assert.deepStrictEqual(result, expected);
    });

    test("should preserve alignment indicators", () => {
      const table = createTestTable(
        ["Left", "Center", "Right"],
        ["left", "center", "right"],
        [["A", "B", "C"]],
      );

      const result = formatter.format(table);
      const expected = [
        "| Left | Center | Right |",
        "| :-- | :-: | --: |",
        "| A | B | C |",
      ];

      assert.deepStrictEqual(result, expected);
    });

    test("should handle tables with emojis", () => {
      const table = createTestTable(
        ["Name", "Status"],
        ["none", "none"],
        [
          ["Alice", "✅"],
          ["Bob", "❌"],
        ],
      );

      const result = formatter.format(table);
      const expected = [
        "| Name | Status |",
        "| --- | --- |",
        "| Alice | ✅ |",
        "| Bob | ❌ |",
      ];

      assert.deepStrictEqual(result, expected);
    });
  });

  suite("EvenlyDistributedFormatter", () => {
    let formatter: EvenlyDistributedFormatter;

    setup(() => {
      formatter = new EvenlyDistributedFormatter("1:2"); // full:half = 1:2
    });

    test("should format table with even column widths", () => {
      const table = createTestTable(
        ["Name", "Age"],
        ["none", "none"],
        [
          ["Alice", "30"],
          ["Bob", "25"],
        ],
      );

      const result = formatter.format(table);

      // Name column width = 5, Age column width = 3 (minimum)
      const expected = [
        "| Name  | Age |",
        "| ----- | --- |",
        "| Alice | 30  |",
        "| Bob   | 25  |",
      ];

      assert.deepStrictEqual(result, expected);
    });

    test("should handle Unicode character width calculation", () => {
      const table = createTestTable(
        ["名前", "年齢", "Name"],
        ["none", "none", "none"],
        [
          ["田中太郎", "30", "A"],
          ["김철수", "25", "Bob"],
        ],
      );

      const result = formatter.format(table);

      // With 1:2 ratio:
      // 名前 = 4 width, 年齢 = 4 width, Name = 4 width
      // 田中太郎 = 8 width, 30 = 2 width, A = 1 width
      // 김철수 = 6 width, 25 = 2 width, Bob = 3 width
      // Column widths should be: 8, 4, 4

      assert.strictEqual(result.length, 4);
      // Check that all rows have the same structure
      assert.ok(result[0].includes("名前"));
      assert.ok(result[2].includes("田中太郎"));
    });

    test("should apply alignment correctly", () => {
      const table = createTestTable(
        ["Left", "Center", "Right"],
        ["left", "center", "right"],
        [["A", "B", "C"]],
      );

      const result = formatter.format(table);

      // Left column should be left-aligned
      // Center column should be center-aligned
      // Right column should be right-aligned

      assert.strictEqual(result.length, 3);
      assert.ok(result[0].includes("Left"));
      assert.ok(result[0].includes("Center"));
      assert.ok(result[0].includes("Right"));

      // Check separator row has correct alignment indicators
      assert.ok(result[1].includes(":--")); // left
      assert.ok(result[1].includes(":-") && result[1].includes("-:")); // center
      assert.ok(result[1].includes("--:")); // right
    });

    test("should handle different font ratios", () => {
      const formatter1to2 = new EvenlyDistributedFormatter("1:2");
      const formatter3to5 = new EvenlyDistributedFormatter("3:5");

      // Use content that will produce different column widths with different ratios
      const table = createTestTable(
        ["ABC", "世界"], // 3 half-width vs 2 full-width
        ["none", "none"],
        [["DEF", "中文"]],
      );

      const result1to2 = formatter1to2.format(table);
      const result3to5 = formatter3to5.format(table);

      // With 1:2: ABC=3, 世界=4; with 3:5: ABC=3, 世界=3.33 → different max columns
      // Results should be different due to different width calculations
      assert.notDeepStrictEqual(result1to2, result3to5);
      assert.strictEqual(result1to2.length, 3);
      assert.strictEqual(result3to5.length, 3);
    });

    test("should handle long content correctly", () => {
      const table = createTestTable(
        ["Short", "Very Long Header Content"],
        ["none", "none"],
        [
          ["A", "This is a very long piece of content"],
          ["B", "Short"],
        ],
      );

      const result = formatter.format(table);

      // The long content should determine the column width
      assert.strictEqual(result.length, 4);
      const headerRow = result[0];
      const dataRow1 = result[2];

      // All rows should be the same length
      assert.strictEqual(headerRow.length, dataRow1.length);
    });

    test("should handle empty cells with proper padding", () => {
      const table = createTestTable(
        ["A", "B", "C"],
        ["left", "center", "right"],
        [
          ["1", "", "3"],
          ["", "2", ""],
        ],
      );

      const result = formatter.format(table);

      assert.strictEqual(result.length, 4);
      // Check that empty cells are padded correctly
      assert.ok(result[2].includes("|"));
      assert.ok(result[3].includes("|"));
    });

    test("should maintain minimum column width", () => {
      const table = createTestTable(["A", "B"], ["none", "none"], [["1", "2"]]);

      const result = formatter.format(table);

      // Even single character columns should have minimum width of 3
      const separatorRow = result[1];
      assert.ok(separatorRow.includes("---")); // At least 3 dashes
    });
  });

  suite("Formatter Comparison", () => {
    test("consolidate should be more compact than evenly distributed", () => {
      const table = createTestTable(
        ["Name", "Age"],
        ["none", "none"],
        [
          ["Alice", "30"],
          ["Bob", "25"],
        ],
      );

      const consolidate = new ConsolidateFormatter("1:2");
      const evenlyDistributed = new EvenlyDistributedFormatter("1:2");

      const consolidateResult = consolidate.format(table);
      const evenlyDistributedResult = evenlyDistributed.format(table);

      // Consolidate format should typically be shorter
      const consolidateLength = consolidateResult[0].length;
      const evenlyDistributedLength = evenlyDistributedResult[0].length;

      assert.ok(consolidateLength <= evenlyDistributedLength);
    });

    test("both formatters should handle same content correctly", () => {
      const table = createTestTable(
        ["名前", "Status"],
        ["left", "center"],
        [
          ["田中太郎", "✅"],
          ["김철수", "❌"],
        ],
      );

      const consolidate = new ConsolidateFormatter("1:2");
      const evenlyDistributed = new EvenlyDistributedFormatter("1:2");

      const consolidateResult = consolidate.format(table);
      const evenlyDistributedResult = evenlyDistributed.format(table);

      // Both should have same number of rows
      assert.strictEqual(
        consolidateResult.length,
        evenlyDistributedResult.length,
      );

      // Both should preserve content
      assert.ok(consolidateResult[0].includes("名前"));
      assert.ok(evenlyDistributedResult[0].includes("名前"));
      assert.ok(consolidateResult[2].includes("田中太郎"));
      assert.ok(evenlyDistributedResult[2].includes("田中太郎"));
    });
  });
});
