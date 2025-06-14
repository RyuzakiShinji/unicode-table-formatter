import * as assert from "node:assert";
import {
  ConsolidateFormatter,
  EvenlyDistributedFormatter,
} from "../formatters";
import { TableParser } from "../tableParser";
import { WidthCalculator } from "../widthCalculator";

suite("Edge Cases and Error Handling Tests", () => {
  suite("Malformed Input Handling", () => {
    test("should handle invalid table structures gracefully", () => {
      const malformedInputs = [
        "| Header Only |",
        "|------|",
        "| No | Separator |\n| Data | Row |",
        "| Mismatched | Columns |\n|------|------|------|\n| Too | Few |",
        "| Too | Few | Headers |\n|------|------|\n| Too | Many | Data | Columns |",
      ];

      for (const input of malformedInputs) {
        const tables = TableParser.parseDocument(input);
        // Should not crash and should return empty or partial results
        assert.ok(Array.isArray(tables));
      }
    });

    test("should handle empty and whitespace-only content", () => {
      const emptyInputs = ["", "   ", "\n\n\n", "\t\t\t"];

      for (const input of emptyInputs) {
        const tables = TableParser.parseDocument(input);
        assert.strictEqual(tables.length, 0);
      }
    });

    test("should handle tables with no data rows", () => {
      const input = `| Header1 | Header2 |
|---------|---------|`;

      const tables = TableParser.parseDocument(input);
      assert.strictEqual(tables.length, 1);
      assert.strictEqual(tables[0].dataRows.length, 0);

      const formatter = new ConsolidateFormatter();
      const result = formatter.format(tables[0]);
      assert.strictEqual(result.length, 2); // header + separator only
    });
  });

  suite("Unicode Edge Cases", () => {
    test("should handle combining characters correctly", () => {
      const calculator = new WidthCalculator("1:2");

      // Base character + combining diacritic
      const textWithCombining = "e\u0301"; // e + combining acute accent
      const textWithMultipleCombining = "e\u0301\u0308"; // e + acute + diaeresis

      // Should treat combining characters as zero-width
      assert.strictEqual(calculator.calculateStringWidth(textWithCombining), 1);
      assert.strictEqual(
        calculator.calculateStringWidth(textWithMultipleCombining),
        1,
      );

      const table = `| Text | Width |
|------|-------|
| ${textWithCombining} | 1 |
| ${textWithMultipleCombining} | 1 |`;

      const tables = TableParser.parseDocument(table);
      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);

      // Should format without errors
      assert.ok(result.length > 0);
      assert.ok(result[2].includes(textWithCombining));
    });

    test("should handle surrogate pairs (emoji) correctly", () => {
      const calculator = new WidthCalculator("1:2");

      // Complex emoji with surrogate pairs
      const complexEmoji = "👨‍👩‍👧‍👦"; // Family emoji (multiple code points)
      const flagEmoji = "🇺🇸"; // Flag emoji (regional indicator symbols)

      // Should handle without crashing
      const width1 = calculator.calculateStringWidth(complexEmoji);
      const width2 = calculator.calculateStringWidth(flagEmoji);

      assert.ok(width1 > 0);
      assert.ok(width2 > 0);
    });

    test("should handle mixed text directions", () => {
      const input = `| English | العربية | עברית |
|---------|---------|--------|
| Left | اليمين | שמאל |`;

      const tables = TableParser.parseDocument(input);
      assert.strictEqual(tables.length, 1);

      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);

      // Should preserve all characters
      assert.ok(result.join("\n").includes("العربية"));
      assert.ok(result.join("\n").includes("עברית"));
    });
  });

  suite("Performance Edge Cases", () => {
    test("should handle very wide tables", () => {
      const headers = Array.from({ length: 50 }, (_, i) => `Col${i}`);
      const data = Array.from({ length: 50 }, (_, i) => `Data${i}`);

      const headerRow = `| ${headers.join(" | ")} |`;
      const separatorRow = `|${headers.map(() => "---").join("|")}|`;
      const dataRow = `| ${data.join(" | ")} |`;

      const input = [headerRow, separatorRow, dataRow].join("\n");

      const tables = TableParser.parseDocument(input);
      assert.strictEqual(tables.length, 1);
      assert.strictEqual(tables[0].headerRow.cells.length, 50);

      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);

      // Should complete without errors
      assert.strictEqual(result.length, 3);
    });

    test("should handle very long cell content", () => {
      const longContent = "A".repeat(10000);
      const input = `| Short | Long |
|-------|------|
| A | ${longContent} |`;

      const tables = TableParser.parseDocument(input);
      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);

      // Should handle without errors
      assert.ok(result[2].includes(longContent));
    });
  });

  suite("Boundary Conditions", () => {
    test("should handle minimum table size", () => {
      const input = `| A |
|---|
| 1 |`;

      const tables = TableParser.parseDocument(input);
      assert.strictEqual(tables.length, 1);
      assert.strictEqual(tables[0].headerRow.cells.length, 1);

      const formatter = new EvenlyDistributedFormatter("1:2");
      const result = formatter.format(tables[0]);

      // Should maintain minimum column width
      assert.ok(result[1].includes("---")); // At least 3 dashes
    });

    test("should handle zero-width content padding", () => {
      const calculator = new WidthCalculator("1:2");

      // Test padding with zero-width characters
      const zeroWidthString = "\u200B\u200C\u200D"; // Multiple zero-width chars
      const padded = calculator.padString(zeroWidthString, 5, "center");

      assert.strictEqual(calculator.calculateStringWidth(padded), 5);
    });

    test("should handle alignment with odd padding", () => {
      const calculator = new WidthCalculator("1:2");

      // Test center alignment with odd padding
      const result = calculator.padString("A", 6, "center"); // 5 spaces to add
      assert.strictEqual(result, "  A   "); // 2 left, 3 right
      assert.strictEqual(calculator.calculateStringWidth(result), 6);
    });
  });

  suite("Formatter Error Conditions", () => {
    test("should handle invalid width calculator ratios in formatters", () => {
      // These should throw during construction
      assert.throws(() => new ConsolidateFormatter("invalid"));
      assert.throws(() => new EvenlyDistributedFormatter("0:1"));
      assert.throws(() => new EvenlyDistributedFormatter("1:0"));
      assert.throws(() => new EvenlyDistributedFormatter("3:2")); // half > full
    });

    test("should handle tables with mismatched column counts gracefully", () => {
      // Create a table structure with mismatched columns
      const table = {
        startLine: 0,
        endLine: 2,
        headerRow: {
          cells: [
            { content: "A", alignment: "none" as const },
            { content: "B", alignment: "none" as const },
          ],
        },
        separatorRow: "|---|---|",
        dataRows: [
          {
            cells: [
              { content: "1", alignment: "none" as const },
              { content: "2", alignment: "none" as const },
              { content: "3", alignment: "none" as const }, // Extra column
            ],
          },
        ],
        columnAlignments: ["none", "none"] as (
          | "left"
          | "center"
          | "right"
          | "none"
        )[],
      };

      const formatter = new EvenlyDistributedFormatter("1:2");

      // Should handle gracefully without crashing
      assert.doesNotThrow(() => {
        const result = formatter.format(table);
        assert.ok(result.length > 0);
      });
    });
  });

  suite("Special Character Handling", () => {
    test("should handle null and undefined characters", () => {
      const calculator = new WidthCalculator("1:2");

      // Test with strings containing problematic characters
      const textWithNull = "A\0B";
      const width = calculator.calculateStringWidth(textWithNull);
      assert.ok(width >= 2); // Should handle without crashing
    });

    test("should handle control characters", () => {
      const input = `| Header | Control |
|--------|---------|
| Normal | Text\tWith\nControl |`;

      const tables = TableParser.parseDocument(input);
      const formatter = new ConsolidateFormatter("1:2");

      // Should handle without crashing
      assert.doesNotThrow(() => {
        const result = formatter.format(tables[0]);
        assert.ok(result.length > 0);
      });
    });

    test("should handle very large Unicode code points", () => {
      const calculator = new WidthCalculator("1:2");

      // Test with characters in supplementary planes
      const supplementaryChar = "𝔘𝔫𝔦𝔠𝔬𝔡𝔢"; // Mathematical script characters
      const width = calculator.calculateStringWidth(supplementaryChar);

      assert.ok(width > 0);
    });
  });

  suite("Memory and Resource Management", () => {
    test("should handle repeated parsing without memory leaks", () => {
      const input = `| A | B |
|---|---|
| 1 | 2 |`;

      // Parse the same content many times
      for (let i = 0; i < 1000; i++) {
        const tables = TableParser.parseDocument(input);
        assert.strictEqual(tables.length, 1);
      }

      // Should complete without issues
      assert.ok(true);
    });

    test("should handle formatting with many iterations", () => {
      const table = {
        startLine: 0,
        endLine: 1,
        headerRow: {
          cells: [
            { content: "A", alignment: "none" as const },
            { content: "B", alignment: "none" as const },
          ],
        },
        separatorRow: "|---|---|",
        dataRows: [],
        columnAlignments: ["none", "none"] as (
          | "left"
          | "center"
          | "right"
          | "none"
        )[],
      };

      const formatter = new EvenlyDistributedFormatter("1:2");

      // Format many times
      for (let i = 0; i < 1000; i++) {
        const result = formatter.format(table);
        assert.strictEqual(result.length, 2);
      }
    });
  });
});
