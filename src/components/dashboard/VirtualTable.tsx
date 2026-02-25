import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualTableProps {
    columns: string[];
    rows: Record<string, any>[]; // may include group header markers
    rowHeight?: number;
    stickyFirst?: boolean;
    visibleColumns?: string[];
    columnWidths?: number[];
    // optional index to programmatically scroll to
    scrollToIndex?: number | null;
    // optional external scroll container ref (so header can be in same scroller)
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export function VirtualTable({ columns, rows, rowHeight = 44, stickyFirst = true, visibleColumns, columnWidths, scrollToIndex = null, scrollContainerRef }: VirtualTableProps) {
    const parentRef = React.useRef<HTMLDivElement | null>(null);

    const visibleCols = visibleColumns ?? columns;

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => (scrollContainerRef?.current ?? parentRef.current),
        estimateSize: () => rowHeight,
        overscan: 6,
    });

    // respond to external scrollToIndex requests
    React.useEffect(() => {
        if (typeof scrollToIndex === "number" && scrollToIndex >= 0 && scrollToIndex < rows.length) {
            rowVirtualizer.scrollToIndex(scrollToIndex, { align: 'center' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scrollToIndex]);

    const totalHeight = rowVirtualizer.getTotalSize();

    return (
        <div className="w-full">
            {scrollContainerRef ? (
                // If an external scroll container is provided, render only the inner positioned container
                <div style={{ height: totalHeight, position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const r = rows[virtualRow.index];
                        const top = virtualRow.start;
                        const isGroup = !!r.__isGroupHeader;

                        return (
                            <div
                                key={virtualRow.index}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${top}px)`,
                                }}
                                className={`flex items-center border-b bg-card ${isGroup ? 'bg-muted/10 font-semibold' : ''}`}
                            >
                                {/* Document / first column */}
                                <div
                                    className={`flex-shrink-0 px-4 py-3 text-left min-w-[220px] border ${stickyFirst ? 'sticky left-0 z-20 bg-card' : ''}`}
                                >
                                    {r.__docLabel ?? ''}
                                </div>

                                {/* other columns */}
                                {(() => {
                                    const hasWidths = columnWidths && columnWidths.length === visibleCols.length;
                                    const totalMinWidth = hasWidths ? columnWidths!.reduce((s, w) => s + w, 0) : visibleCols.length * 160;
                                    const template = hasWidths ? columnWidths!.map((w) => `${w}px`).join(' ') : visibleCols.map(() => '160px').join(' ');
                                    return (
                                        <div className="flex-1 min-w-0 grid" style={{ gridTemplateColumns: template, minWidth: `${totalMinWidth}px` }}>
                                            {visibleCols.map((col) => {
                                                const val = r[col];
                                                const render = (() => {
                                                    if (val == null) return "";
                                                    if (typeof val === "number") return val.toLocaleString();
                                                    if (typeof val === "string") return val;
                                                    try {
                                                        const s = JSON.stringify(val);
                                                        return s.length > 200 ? s.slice(0, 200) + "…" : s;
                                                    } catch (e) {
                                                        return String(val);
                                                    }
                                                })();

                                                return (
                                                    <div key={col} className="px-4 py-3 whitespace-nowrap text-foreground truncate border">
                                                        {render}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="overflow-auto" ref={parentRef} style={{ maxHeight: 'calc(100vh - 260px)' }}>
                    <div style={{ height: totalHeight, position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const r = rows[virtualRow.index];
                            const top = virtualRow.start;
                            const isGroup = !!r.__isGroupHeader;

                            return (
                                <div
                                    key={virtualRow.index}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${top}px)`,
                                    }}
                                    className={`flex items-center border-b bg-card ${isGroup ? 'bg-muted/10 font-semibold' : ''}`}
                                >
                                    {/* Document / first column */}
                                    <div
                                        className={`flex-shrink-0 px-4 py-3 text-left min-w-[220px] ${stickyFirst ? 'sticky left-0 z-20 bg-card' : ''}`}
                                        style={{ borderRight: '1px solid rgba(0,0,0,0.04)' }}
                                    >
                                        {r.__docLabel ?? ''}
                                    </div>

                                    {/* other columns */}
                                    {(() => {
                                        const hasWidths = columnWidths && columnWidths.length === visibleCols.length;
                                        const totalMinWidth = hasWidths ? columnWidths!.reduce((s, w) => s + w, 0) : visibleCols.length * 160;
                                        const template = hasWidths ? columnWidths!.map((w) => `${w}px`).join(' ') : visibleCols.map(() => '160px').join(' ');
                                        return (
                                            <div className="flex-1 min-w-0 grid" style={{ gridTemplateColumns: template, minWidth: `${totalMinWidth}px` }}>
                                                {visibleCols.map((col) => {
                                                    const val = r[col];
                                                    const render = (() => {
                                                        if (val == null) return "";
                                                        if (typeof val === "number") return val.toLocaleString();
                                                        if (typeof val === "string") return val;
                                                        try {
                                                            const s = JSON.stringify(val);
                                                            return s.length > 200 ? s.slice(0, 200) + "…" : s;
                                                        } catch (e) {
                                                            return String(val);
                                                        }
                                                    })();

                                                    return (
                                                        <div key={col} className="px-4 py-3 whitespace-nowrap text-foreground truncate border">
                                                            {render}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VirtualTable;
