import type { ParsedTable } from "./tableParser";
import { WidthCalculator } from "./widthCalculator";

export abstract class TableFormatter {
  protected widthCalculator: WidthCalculator;

  constructor(fontWidthRatio = "1:2") {
    this.widthCalculator = new WidthCalculator(fontWidthRatio);
  }

  abstract format(table: ParsedTable): string[];

  protected createSeparatorRow(
    columnWidths: number[],
    alignments: ("left" | "center" | "right" | "none")[],
  ): string {
    const separators = columnWidths.map((width, index) => {
      const alignment = alignments[index];
      const minDashes = Math.max(3, width);

      switch (alignment) {
        case "center":
          if (minDashes >= 4) {
            const centerDashes = minDashes - 2;
            return `:${"-".repeat(centerDashes)}:`;
          }
          return ":-:";
        case "right":
          if (minDashes >= 3) {
            const rightDashes = minDashes - 1;
            return `${"-".repeat(rightDashes)}:`;
          }
          return "--:";
        case "left":
          if (minDashes >= 3) {
            const leftDashes = minDashes - 1;
            return `:${"-".repeat(leftDashes)}`;
          }
          return ":--";
        default:
          return "-".repeat(minDashes);
      }
    });

    return `| ${separators.join(" | ")} |`;
  }
}

export class ConsolidateFormatter extends TableFormatter {
  format(table: ParsedTable): string[] {
    const result: string[] = [];

    const formatRow = (row: { cells: { content: string }[] }) => {
      const cells = row.cells.map((cell) => cell.content);
      return `| ${cells.join(" | ")} |`;
    };

    result.push(formatRow(table.headerRow));

    const columnWidths = table.headerRow.cells.map(() => 3);
    result.push(this.createSeparatorRow(columnWidths, table.columnAlignments));

    for (const row of table.dataRows) {
      result.push(formatRow(row));
    }

    return result;
  }
}

export class EvenlyDistributedFormatter extends TableFormatter {
  format(table: ParsedTable): string[] {
    const result: string[] = [];
    const _columnCount = table.headerRow.cells.length;

    const columnWidths = this.calculateColumnWidths(table);

    const formatRow = (row: { cells: { content: string }[] }) => {
      const formattedCells = row.cells.map((cell, index) => {
        const alignment = table.columnAlignments[index];
        return this.widthCalculator.padString(
          cell.content,
          columnWidths[index],
          alignment,
        );
      });
      return `| ${formattedCells.join(" | ")} |`;
    };

    result.push(formatRow(table.headerRow));
    result.push(this.createSeparatorRow(columnWidths, table.columnAlignments));

    for (const row of table.dataRows) {
      result.push(formatRow(row));
    }

    return result;
  }

  private calculateColumnWidths(table: ParsedTable): number[] {
    const columnCount = table.headerRow.cells.length;
    const columnWidths: number[] = new Array(columnCount).fill(0);

    const allRows = [table.headerRow, ...table.dataRows];

    for (const row of allRows) {
      for (let i = 0; i < Math.min(row.cells.length, columnCount); i++) {
        const cellWidth = this.widthCalculator.calculateStringWidth(
          row.cells[i].content,
        );
        columnWidths[i] = Math.max(columnWidths[i], cellWidth);
      }
    }

    for (let i = 0; i < columnWidths.length; i++) {
      columnWidths[i] = Math.max(columnWidths[i], 3);
    }

    return columnWidths;
  }
}
