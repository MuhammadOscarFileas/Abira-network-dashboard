import { ReactNode } from "react";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
};

type SortState = {
  key: string | null;
  direction: "asc" | "desc";
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  sort: SortState;
  setSort: (s: SortState) => void;
};

export default function SortableTable<T extends Record<string, any>>({
  columns,
  data,
  sort,
  setSort,
}: Props<T>) {
  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sort.key === key) {
      setSort({
        key,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSort({ key, direction: "asc" });
    }
  };

  const sortedData = (() => {
    if (!sort.key) return data;
    return [...data].sort((a, b) => {
      const av = a[sort.key!];
      const bv = b[sort.key!];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.direction === "asc" ? av - bv : bv - av;
      }
      return sort.direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  })();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-background">
            {columns.map((col) => {
              const isActive = sort.key === col.key;
              return (
                <th
                  key={String(col.key)}
                  className="px-3 py-2 text-left font-semibold select-none cursor-pointer"
                  onClick={() => handleSort(String(col.key), col.sortable)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-[10px] text-textcharcoal/60">
                        {isActive
                          ? sort.direction === "asc"
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr
              key={idx}
              className={idx % 2 === 0 ? "bg-white" : "bg-background"}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-3 py-2">
                  {col.render ? col.render(row) : (row[col.key as string] as any)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

