export interface TableCell {
  content: string;
  alignment: "left" | "center" | "right" | "none";
}

export interface TableRow {
  cells: TableCell[];
}

export interface ParsedTable {
  startLine: number;
  endLine: number;
  headerRow: TableRow;
  separatorRow: string;
  dataRows: TableRow[];
  columnAlignments: ("left" | "center" | "right" | "none")[];
}

// biome-ignore lint/complexity/noStaticOnlyClass: Table parsing utility works well as static class
export class TableParser {
  private static readonly TABLE_ROW_REGEX = /^\s*\|(.+)\|\s*$/;
  private static readonly SEPARATOR_REGEX = /^\s*\|(\s*:?-+:?\s*\|)+$/;

  static parseDocument(text: string): ParsedTable[] {
    const lines = text.split("\n");
    const tables: ParsedTable[] = [];
    let i = 0;

    while (i < lines.length) {
      const tableStart = TableParser.findTableStart(lines, i);
      if (tableStart === -1) {
        break;
      }

      const table = TableParser.parseTable(lines, tableStart);
      if (table) {
        tables.push(table);
        i = table.endLine + 1;
      } else {
        i = tableStart + 1;
      }
    }

    return tables;
  }

  private static findTableStart(lines: string[], startIndex: number): number {
    for (let i = startIndex; i < lines.length; i++) {
      if (TableParser.TABLE_ROW_REGEX.test(lines[i])) {
        return i;
      }
    }
    return -1;
  }

  private static parseTable(
    lines: string[],
    startLine: number,
  ): ParsedTable | null {
    if (startLine >= lines.length - 1) {
      return null;
    }

    const headerLine = lines[startLine];
    const separatorLine = lines[startLine + 1];

    if (
      !TableParser.TABLE_ROW_REGEX.test(headerLine) ||
      !TableParser.SEPARATOR_REGEX.test(separatorLine.trimEnd())
    ) {
      return null;
    }

    const headerRow = TableParser.parseTableRow(headerLine);
    const columnAlignments = TableParser.parseAlignments(
      separatorLine.trimEnd(),
    );

    if (headerRow.cells.length !== columnAlignments.length) {
      return null;
    }

    const dataRows: TableRow[] = [];
    let endLine = startLine + 1;

    for (let i = startLine + 2; i < lines.length; i++) {
      if (TableParser.TABLE_ROW_REGEX.test(lines[i])) {
        const row = TableParser.parseTableRow(lines[i]);
        if (row.cells.length === columnAlignments.length) {
          dataRows.push(row);
          endLine = i;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return {
      startLine,
      endLine,
      headerRow,
      separatorRow: separatorLine,
      dataRows,
      columnAlignments,
    };
  }

  private static parseTableRow(line: string): TableRow {
    const match = line.match(TableParser.TABLE_ROW_REGEX);
    if (!match) {
      return { cells: [] };
    }

    const cellsText = match[1];
    const cells = cellsText.split("|").map((cell) => ({
      content: cell.trim(),
      alignment: "none" as const,
    }));

    return { cells };
  }

  private static parseAlignments(
    separatorLine: string,
  ): ("left" | "center" | "right" | "none")[] {
    const match = separatorLine.match(/\|([^|]+)/g);
    if (!match) {
      return [];
    }

    return match.map((cell) => {
      const trimmed = cell.replace("|", "").trim();
      const hasLeftColon = trimmed.startsWith(":");
      const hasRightColon = trimmed.endsWith(":");

      if (hasLeftColon && hasRightColon) {
        return "center";
      }
      if (hasRightColon) {
        return "right";
      }
      if (hasLeftColon) {
        return "left";
      }
      return "none";
    });
  }

  static formatTable(
    table: ParsedTable,
    formatter: (table: ParsedTable) => string[],
  ): string {
    return formatter(table).join("\n");
  }
}
