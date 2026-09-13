import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kioskfy/ui";
import { cn } from "@kioskfy/ui";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Key of the row data used by the global search box. */
  searchKey?: keyof TData & string;
  searchPlaceholder?: string;
  /** Initial page size (can be changed by the user via the pager). */
  pageSize?: number;
}

function readCellValue<TData>(row: TData, key: string): unknown {
  if (row && typeof row === "object" && key in (row as Record<string, unknown>)) {
    return (row as Record<string, unknown>)[key];
  }
  return null;
}

/**
 * Generic data table built on @tanstack/react-table.
 * Provides sorting (per-column), search (on `searchKey`), and client-side
 * pagination driven by TanStack Table's pagination state.
 */
export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Rechercher...",
  pageSize = 20,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: search, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: searchKey
      ? (row: Row<TData>, _columnId: string, filterValue: string) => {
          const value = readCellValue(row.original, searchKey);
          return String(value ?? "")
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }
      : undefined,
    // Reset to the first page whenever data or the search filter changes.
    autoResetPageIndex: true,
  });

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const visibleRows = table.getRowModel().rows;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = totalRows === 0 ? 0 : pageIndex * pagination.pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pagination.pageSize, totalRows);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">Aucune donnée</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {searchKey && (
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            placeholder={searchPlaceholder}
            className="h-9 pl-9 pr-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearch("");
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              aria-label="Effacer la recherche"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X data-icon="inline-start" />
            </Button>
          )}
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(canSort && "cursor-pointer select-none")}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSorted === "asc" && <ArrowUp className="size-3.5 shrink-0" />}
                          {isSorted === "desc" && <ArrowDown className="size-3.5 shrink-0" />}
                          {!isSorted && canSort && (
                            <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground/40" />
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {search ? "Aucun résultat pour votre recherche" : "Aucune donnée"}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
        <span>
          {totalRows > 0 ? `${startRow}–${endRow} sur ${totalRows}` : "0"} résultat
          {totalRows > 1 ? "s" : ""}
        </span>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Lignes par page</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                setPagination({ pageIndex: 0, pageSize: Number(value) })
              }
            >
              <SelectTrigger className="h-8 w-17.5" aria-label="Lignes par page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">
              Page {pageIndex + 1}/{pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Première page"
              >
                <ChevronsLeft data-icon="inline-start" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Page précédente"
              >
                <ChevronLeft data-icon="inline-start" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Page suivante"
              >
                <ChevronRight data-icon="inline-start" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Dernière page"
              >
                <ChevronsRight data-icon="inline-start" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
