import * as assert from "node:assert";
import { WidthCalculator } from "../widthCalculator";

suite("WidthCalculator Tests", () => {
  suite("Constructor", () => {
    test('should initialize with default ratio "1:2"', () => {
      const calculator = new WidthCalculator();
      assert.strictEqual(calculator.calculateStringWidth("a"), 1); // half-width
      assert.strictEqual(calculator.calculateStringWidth("あ"), 2); // full-width
    });

    test('should initialize with custom ratio "1:1"', () => {
      const calculator = new WidthCalculator("1:1");
      assert.strictEqual(calculator.calculateStringWidth("a"), 1); // half-width
      assert.strictEqual(calculator.calculateStringWidth("あ"), 1); // full-width
    });

    test('should initialize with custom ratio "3:5"', () => {
      const calculator = new WidthCalculator("3:5");
      assert.strictEqual(calculator.calculateStringWidth("a"), 1); // half-width (normalized)
      assert.strictEqual(calculator.calculateStringWidth("あ"), 5 / 3); // full-width (5/3 ratio)
    });

    test("should throw error for invalid ratio format", () => {
      assert.throws(
        () => new WidthCalculator("invalid"),
        /Invalid ratio format/,
      );
      assert.throws(() => new WidthCalculator("1:"), /Invalid ratio format/);
      assert.throws(() => new WidthCalculator(":2"), /Invalid ratio format/);
      assert.throws(() => new WidthCalculator("0:1"), /Invalid ratio format/);
      assert.throws(() => new WidthCalculator("1:0"), /Invalid ratio format/);
    });

    test("should throw error when half-width > full-width", () => {
      assert.throws(
        () => new WidthCalculator("3:2"),
        /Half-width characters cannot be wider than full-width/,
      );
      assert.throws(
        () => new WidthCalculator("5:3"),
        /Half-width characters cannot be wider than full-width/,
      );
      assert.throws(
        () => new WidthCalculator("2:1"),
        /Half-width characters cannot be wider than full-width/,
      );
    });

    test("should allow equal widths", () => {
      assert.doesNotThrow(() => new WidthCalculator("1:1"));
      assert.doesNotThrow(() => new WidthCalculator("2:2"));
    });
  });

  suite("Character Width Calculation", () => {
    let calculator: WidthCalculator;

    setup(() => {
      calculator = new WidthCalculator("1:2"); // half:full = 1:2
    });

    test("should calculate ASCII characters as half-width", () => {
      assert.strictEqual(calculator.calculateStringWidth("a"), 1);
      assert.strictEqual(calculator.calculateStringWidth("A"), 1);
      assert.strictEqual(calculator.calculateStringWidth("1"), 1);
      assert.strictEqual(calculator.calculateStringWidth(" "), 1);
      assert.strictEqual(calculator.calculateStringWidth("!"), 1);
    });

    test("should calculate CJK characters as full-width", () => {
      // Japanese Hiragana
      assert.strictEqual(calculator.calculateStringWidth("あ"), 2);
      assert.strictEqual(calculator.calculateStringWidth("か"), 2);

      // Japanese Katakana
      assert.strictEqual(calculator.calculateStringWidth("ア"), 2);
      assert.strictEqual(calculator.calculateStringWidth("カ"), 2);

      // Chinese characters
      assert.strictEqual(calculator.calculateStringWidth("中"), 2);
      assert.strictEqual(calculator.calculateStringWidth("文"), 2);

      // Korean characters
      assert.strictEqual(calculator.calculateStringWidth("한"), 2);
      assert.strictEqual(calculator.calculateStringWidth("글"), 2);
    });

    test("should calculate emojis as full-width", () => {
      assert.strictEqual(calculator.calculateStringWidth("😊"), 2);
      assert.strictEqual(calculator.calculateStringWidth("🎉"), 2);
      assert.strictEqual(calculator.calculateStringWidth("✅"), 2);
      assert.strictEqual(calculator.calculateStringWidth("❌"), 2);
    });

    test("should handle zero-width characters", () => {
      // Zero-width space
      assert.strictEqual(calculator.calculateStringWidth("\u200B"), 0);
      // Zero-width non-joiner
      assert.strictEqual(calculator.calculateStringWidth("\u200C"), 0);
      // Zero-width joiner
      assert.strictEqual(calculator.calculateStringWidth("\u200D"), 0);
    });

    test("should calculate mixed character strings correctly", () => {
      assert.strictEqual(calculator.calculateStringWidth("Hello"), 5); // 5 half-width chars × 1
      assert.strictEqual(calculator.calculateStringWidth("こんにちは"), 10); // 5 full-width chars × 2
      assert.strictEqual(calculator.calculateStringWidth("Hello世界"), 9); // 5 half × 1 + 2 full × 2
      assert.strictEqual(calculator.calculateStringWidth("ABC😊123"), 8); // 6 half × 1 + 1 emoji × 2
    });

    test("should handle empty strings", () => {
      assert.strictEqual(calculator.calculateStringWidth(""), 0);
    });
  });

  suite("String Padding", () => {
    let calculator: WidthCalculator;

    setup(() => {
      calculator = new WidthCalculator("1:2"); // half:full = 1:2
    });

    test("should pad left-aligned text correctly", () => {
      assert.strictEqual(calculator.padString("abc", 10, "left"), "abc       ");
      assert.strictEqual(
        calculator.padString("あい", 10, "left"),
        "あい      ",
      );
    });

    test("should pad right-aligned text correctly", () => {
      assert.strictEqual(
        calculator.padString("abc", 10, "right"),
        "       abc",
      );
      assert.strictEqual(
        calculator.padString("あい", 10, "right"),
        "      あい",
      );
    });

    test("should pad center-aligned text correctly", () => {
      assert.strictEqual(
        calculator.padString("abc", 10, "center"),
        "   abc    ",
      );
      assert.strictEqual(
        calculator.padString("あい", 10, "center"),
        "   あい   ",
      );
      assert.strictEqual(calculator.padString("ab", 9, "center"), "   ab    "); // odd padding
    });

    test("should handle text that already meets target width", () => {
      assert.strictEqual(calculator.padString("abcde", 5, "left"), "abcde");
      assert.strictEqual(calculator.padString("あい", 4, "center"), "あい");
    });

    test("should handle text that exceeds target width", () => {
      assert.strictEqual(
        calculator.padString("abcdefgh", 5, "left"),
        "abcdefgh",
      );
      assert.strictEqual(calculator.padString("あいう", 4, "right"), "あいう");
    });

    test('should default to left alignment when alignment is "none"', () => {
      assert.strictEqual(calculator.padString("abc", 10, "none"), "abc       ");
    });

    test("should handle mixed character padding", () => {
      // "Hello世" = 5 half × 1 + 1 full × 2 = 7 total width
      assert.strictEqual(
        calculator.padString("Hello世", 10, "left"),
        "Hello世   ",
      );
      assert.strictEqual(
        calculator.padString("Hello世", 10, "right"),
        "   Hello世",
      );
      assert.strictEqual(
        calculator.padString("Hello世", 10, "center"),
        " Hello世  ",
      );
    });
  });

  suite("Complex Scenarios", () => {
    test("should handle different ratios consistently", () => {
      const calc1to2 = new WidthCalculator("1:2");
      const calc1to1 = new WidthCalculator("1:1");
      const calc3to5 = new WidthCalculator("3:5");

      const text = "A世";

      // With 1:2 ratio: A=1, 世=2, total=3
      assert.strictEqual(calc1to2.calculateStringWidth(text), 3);

      // With 1:1 ratio: A=1, 世=1, total=2
      assert.strictEqual(calc1to1.calculateStringWidth(text), 2);

      // With 3:5 ratio: A=1, 世=5/3, total=1+5/3=8/3≈2.67
      const result = calc3to5.calculateStringWidth(text);
      assert.ok(
        Math.abs(result - 8 / 3) < 0.0001,
        `Expected approximately ${8 / 3}, got ${result}`,
      );
    });

    test("should handle strings with combining characters", () => {
      const calculator = new WidthCalculator("1:2");

      // Base character + combining diacritic
      const textWithCombining = "e\u0301"; // e + combining acute accent
      assert.strictEqual(calculator.calculateStringWidth(textWithCombining), 1); // Should count as 1 half-width (ratio 1:2)
    });

    test("should handle very long strings", () => {
      const calculator = new WidthCalculator("1:2");
      const longString = "a".repeat(1000);
      assert.strictEqual(calculator.calculateStringWidth(longString), 1000); // 1000 half-width chars × 1
    });
  });
});
