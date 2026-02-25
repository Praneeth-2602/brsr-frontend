import React from "react";

interface VirtualTableProps {
    columns: string[];
    rows: Record<string, any>[];
    rowHeight?: number;
    stickyFirst?: boolean;
    visibleColumns?: string[];
    columnWidths?: number[];
    scrollToIndex?: number | null;
    showLeadingColumn?: boolean;
    stickyColumnCount?: number;
    showHeader?: boolean;
}

export function VirtualTable({
    columns,
    rows,
    rowHeight = 44,
    stickyFirst = true,
    visibleColumns,
    columnWidths,
    scrollToIndex = null,
    showLeadingColumn = true,
    stickyColumnCount = 3,
    showHeader = true,
}: VirtualTableProps) {
    const tableRef = React.useRef<HTMLTableElement | null>(null);

    const visibleCols = visibleColumns ?? columns;

    const reactNodeToText = (node: any): string => {
        if (node == null) return "";
        if (typeof node === "string" || typeof node === "number") return String(node);
        if (Array.isArray(node)) return node.map(reactNodeToText).filter(Boolean).join(" ");
        if (React.isValidElement(node)) {
            return reactNodeToText((node as any).props?.children);
        }
        return "";
    };

    const isYearColumn = (col: string) => {
        const key = String(col).toLowerCase();
        return key.includes("year of incorporation") || key === "3. year of incorporation";
    };

    const isNumericCell = (val: any, col: string): boolean => {
        if (isYearColumn(col)) return false;
        return typeof val === "number";
    };

    const formatCellValue = (val: any, col: string): string => {
        if (val == null) return "";
        if (typeof val === "number") {
            if (isYearColumn(col)) return String(val);
            return val.toLocaleString();
        }
        if (typeof val === "string") return val;

        const fromReact = reactNodeToText(val);
        if (fromReact) return fromReact;

        if (typeof val === "object") {
            // Prefer human-readable object fields, especially for sector-like columns.
            const key = String(col).toLowerCase();
            const candidates = key.includes("sector")
                ? [val.sector, val.name, val.value, val.label]
                : [val.name, val.value, val.label, val.sector];
            for (const c of candidates) {
                if (typeof c === "string" || typeof c === "number") return String(c);
            }
        }

        try {
            const s = JSON.stringify(val);
            return s.length > 300 ? s.slice(0, 300) + "…" : s;
        } catch {
            return String(val);
        }
    };

    // Column width fallback
    const dataWidths = React.useMemo(() => {
        if (columnWidths && columnWidths.length === visibleCols.length) {
            return columnWidths;
        }
        return visibleCols.map(() => 180);
    }, [columnWidths, visibleCols]);

    const leadingWidth = 220;

    const finalColumns = React.useMemo(() => {
        if (!showLeadingColumn) return visibleCols;
        return ["__docLabel", ...visibleCols];
    }, [showLeadingColumn, visibleCols]);

    const finalWidths = React.useMemo(() => {
        if (!showLeadingColumn) return dataWidths;
        return [leadingWidth, ...dataWidths];
    }, [showLeadingColumn, dataWidths]);

    // Scroll to specific row
    React.useEffect(() => {
        if (
            typeof scrollToIndex !== "number" ||
            scrollToIndex < 0 ||
            scrollToIndex >= rows.length
        )
            return;

        const target = tableRef.current?.querySelector<HTMLTableRowElement>(
            `tr[data-row-index="${scrollToIndex}"]`
        );

        target?.scrollIntoView({ block: "center" });
    }, [scrollToIndex, rows.length]);

    // Calculate sticky left offset
    const getStickyLeft = (idx: number) => {
        if (!stickyFirst || idx >= stickyColumnCount) return undefined;
        const left = finalWidths
            .slice(0, idx)
            .reduce((sum, w) => sum + w, 0);
        return `${left}px`;
    };

    return (
        <table
            ref={tableRef}
            className="w-full text-sm table-fixed border-collapse"
            style={{
                minWidth: `${finalWidths.reduce((s, w) => s + w, 0)}px`,
            }}
        >
            {/* Column widths */}
            <colgroup>
                {finalWidths.map((w, idx) => (
                    <col key={`col-${idx}`} style={{ width: `${w}px` }} />
                ))}
            </colgroup>

            {/* HEADER */}
            {showHeader && (
                <thead>
                    <tr className="border-b border-border/70">
                        {finalColumns.map((col, idx) => (
                            <th
                                key={col}
                                className="px-4 py-2.5 text-left font-medium whitespace-nowrap border-b border-border/70"
                                style={{
                                    width: `${finalWidths[idx]}px`,
                                    minWidth: `${finalWidths[idx]}px`,
                                    position: "sticky",
                                    top: 0,
                                    left: getStickyLeft(idx),
                                    zIndex:
                                        stickyFirst && idx < stickyColumnCount
                                            ? 100 - idx
                                            : 50,
                                }}
                            >
                                {col === "__docLabel" ? "Document" : col}
                            </th>
                        ))}
                    </tr>
                </thead>
            )}

            {/* BODY */}
            <tbody>
                {rows.map((row, i) => (
                    <tr
                        key={i}
                        data-row-index={i}
                        className="hover:bg-muted/30"
                        style={{ height: `${rowHeight}px` }}
                    >
                        {finalColumns.map((col, idx) => {
                            const val =
                                col === "__docLabel" ? row.__docLabel : row[col];
                            const render = formatCellValue(val, col);
                            const numeric = isNumericCell(val, col);

                            return (
                                <td
                                    key={`${i}-${col}`}
                                    className="px-2 border-b border-border/70 align-top bg-background"
                                    style={{
                                        width: `${finalWidths[idx]}px`,
                                        minWidth: `${finalWidths[idx]}px`,
                                        height: `${rowHeight}px`,
                                        position:
                                            stickyFirst && idx < stickyColumnCount
                                                ? "sticky"
                                                : undefined,
                                        left: getStickyLeft(idx),
                                        zIndex:
                                            stickyFirst && idx < stickyColumnCount
                                                ? 50 - idx
                                                : 1,
                                    }}
                                >
                                    {/* Scrollable cell */}
                                    <textarea
                                        readOnly
                                        value={render}
                                        className={`w-full resize-none bg-transparent outline-none border-none text-sm overflow-hidden hover:overflow-auto ${
                                            numeric ? "text-right" : "text-left"
                                        }`}
                                        style={{
                                            height: `${rowHeight - 8}px`,
                                        }}
                                    />
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default VirtualTable;
