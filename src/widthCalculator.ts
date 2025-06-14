export interface WidthRatio {
  fullWidth: number;
  halfWidth: number;
}

export class WidthCalculator {
  private halfWidthRatio: number;
  private fullWidthRatio: number;

  constructor(ratio = "1:2") {
    const [half, full] = ratio.split(":").map((n) => Number.parseInt(n, 10));
    if (Number.isNaN(half) || Number.isNaN(full) || half <= 0 || full <= 0) {
      throw new Error(
        `Invalid ratio format: ${ratio}. Expected format: 'half-width:full-width'`,
      );
    }
    if (half > full) {
      throw new Error(
        `Invalid ratio: ${ratio}. Half-width characters cannot be wider than full-width characters.`,
      );
    }
    this.halfWidthRatio = half;
    this.fullWidthRatio = full;
  }

  calculateStringWidth(text: string): number {
    let width = 0;

    for (const char of text) {
      width += this.getCharacterWidth(char);
    }

    return width;
  }

  private getCharacterWidth(char: string): number {
    const codePoint = char.codePointAt(0);
    if (!codePoint) {
      return 0;
    }

    if (this.isZeroWidth(codePoint)) {
      return 0;
    }

    if (this.isFullWidth(codePoint)) {
      return this.fullWidthRatio / this.halfWidthRatio;
    }

    return 1; // Half-width characters are normalized to 1 unit
  }

  private isZeroWidth(codePoint: number): boolean {
    return (
      (codePoint >= 0x0300 && codePoint <= 0x036f) ||
      (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
      (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
      (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
      (codePoint >= 0xfe20 && codePoint <= 0xfe2f) ||
      codePoint === 0x200b ||
      codePoint === 0x200c ||
      codePoint === 0x200d ||
      codePoint === 0xfeff
    );
  }

  private isFullWidth(codePoint: number): boolean {
    return (
      this.isCJKRange(codePoint) ||
      this.isEmojiRange(codePoint) ||
      this.isSymbolRange(codePoint) ||
      this.isExtendedRange(codePoint)
    );
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Unicode range checking requires many comparisons
  private isCJKRange(codePoint: number): boolean {
    return (
      (codePoint >= 0x1100 && codePoint <= 0x115f) ||
      (codePoint >= 0x2e80 && codePoint <= 0x2e99) ||
      (codePoint >= 0x2e9b && codePoint <= 0x2ef3) ||
      (codePoint >= 0x2f00 && codePoint <= 0x2fd5) ||
      (codePoint >= 0x2ff0 && codePoint <= 0x2ffb) ||
      (codePoint >= 0x3000 && codePoint <= 0x303e) ||
      (codePoint >= 0x3041 && codePoint <= 0x3096) ||
      (codePoint >= 0x3099 && codePoint <= 0x30ff) ||
      (codePoint >= 0x3105 && codePoint <= 0x312d) ||
      (codePoint >= 0x3131 && codePoint <= 0x318e) ||
      (codePoint >= 0x3190 && codePoint <= 0x31ba) ||
      (codePoint >= 0x31c0 && codePoint <= 0x31e3) ||
      (codePoint >= 0x31f0 && codePoint <= 0x321e) ||
      (codePoint >= 0x3220 && codePoint <= 0x3247) ||
      (codePoint >= 0x3250 && codePoint <= 0x32fe) ||
      (codePoint >= 0x3300 && codePoint <= 0x4dbf) ||
      (codePoint >= 0x4e00 && codePoint <= 0xa48c) ||
      (codePoint >= 0xa490 && codePoint <= 0xa4c6) ||
      (codePoint >= 0xa960 && codePoint <= 0xa97c) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xd7b0 && codePoint <= 0xd7c6) ||
      (codePoint >= 0xd7cb && codePoint <= 0xd7fb) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe52) ||
      (codePoint >= 0xfe54 && codePoint <= 0xfe66) ||
      (codePoint >= 0xfe68 && codePoint <= 0xfe6b) ||
      (codePoint >= 0xff01 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6)
    );
  }

  private isEmojiRange(codePoint: number): boolean {
    return (
      (codePoint >= 0x1f000 && codePoint <= 0x1f02f) ||
      (codePoint >= 0x1f0a0 && codePoint <= 0x1f0ff) ||
      (codePoint >= 0x1f100 && codePoint <= 0x1f64f) ||
      (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) ||
      (codePoint >= 0x1f700 && codePoint <= 0x1f77f) ||
      (codePoint >= 0x1f780 && codePoint <= 0x1f7ff) ||
      (codePoint >= 0x1f800 && codePoint <= 0x1f8ff) ||
      (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
      (codePoint >= 0x1fa00 && codePoint <= 0x1fa6f) ||
      (codePoint >= 0x1fa70 && codePoint <= 0x1faff)
    );
  }

  private isSymbolRange(codePoint: number): boolean {
    return (
      (codePoint >= 0x2329 && codePoint <= 0x232a) ||
      (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
      (codePoint >= 0x2700 && codePoint <= 0x27bf)
    );
  }

  private isExtendedRange(codePoint: number): boolean {
    return (
      (codePoint >= 0x20000 && codePoint <= 0x2fffd) ||
      (codePoint >= 0x30000 && codePoint <= 0x3fffd)
    );
  }

  padString(
    text: string,
    targetWidth: number,
    alignment: "left" | "center" | "right" | "none" = "left",
  ): string {
    const currentWidth = this.calculateStringWidth(text);
    const spacesNeeded = Math.max(0, targetWidth - currentWidth);

    if (spacesNeeded === 0) {
      return text;
    }

    const spaces = " ".repeat(spacesNeeded);

    switch (alignment) {
      case "center": {
        const leftSpaces = Math.floor(spacesNeeded / 2);
        const rightSpaces = spacesNeeded - leftSpaces;
        return " ".repeat(leftSpaces) + text + " ".repeat(rightSpaces);
      }
      case "right":
        return spaces + text;
      default:
        return text + spaces;
    }
  }
}
