import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "@unpic/react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kioskfy/ui";
import {
  MoreHorizontal,
  Globe,
  Archive,
  Trash2,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import { useActiveOrganization } from "@/hooks/use-organizations.hook";
import { useNavigate } from "@tanstack/react-router";
import { selectedNewspaperStore } from "@/lib/selected-newspaper-store";

interface LabNewspaper {
  id: string;
  issueNumber: string;
  coverImage: string;
  publishDate: string;
  price: string;
  status: string;
  pdf?: string | null;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") return <Badge variant="default">Publié</Badge>;
  if (status === "draft") return <Badge variant="secondary">Brouillon</Badge>;
  if (status === "archived") return <Badge variant="outline">Archivé</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function NewspapersList() {
  const { organization } = useActiveOrganization();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const organizationId = organization?.id ?? "";

  const { data: newspapers, isLoading } = useQuery({
    queryKey: ["labo-newspapers", organizationId],
    queryFn: async () => {
      const page = (await api.newspapers.getByOrganization(organizationId, {
        limit: 100,
        cursor: 0,
        includeAllStatuses: true,
      })) as unknown as { data: LabNewspaper[] };
      return page?.data ?? [];
    },
    enabled: !!organizationId,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.newspapers.updateStatus(id, status);
      queryClient.invalidateQueries({ queryKey: ["labo-newspapers"] });
    } catch (err) {
      console.error("Status update error:", err);
      window.alert("Erreur lors de la mise à jour du statut.");
    }
  };

  const removeNewspaper = async (id: string) => {
    if (!window.confirm("Supprimer définitivement ce journal ?")) return;
    try {
      await api.newspapers.delete(id);
      queryClient.invalidateQueries({ queryKey: ["labo-newspapers"] });
    } catch (err) {
      console.error("Delete error:", err);
      window.alert("Erreur lors de la suppression.");
    }
  };

  const viewNewspaper = (id: string) => {
    selectedNewspaperStore.setSelected(id);
    navigate({ to: "/organization/render" });
  };

  const columns: ColumnDef<LabNewspaper>[] = [
    {
      accessorKey: "coverImage",
      header: "Couverture",
      cell: ({ row }) => (
        <div className="relative h-16 w-12 overflow-hidden rounded-md border bg-muted">
          {row.original.coverImage ? (
            <Image
              src={row.original.coverImage}
              alt={`Couverture ${row.original.issueNumber}`}
              layout="fullWidth"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
              N/A
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "issueNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3 h-8 hover:bg-accent/50"
        >
          Numéro
          <ArrowUpDown data-icon="inline-start" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("issueNumber")}</div>
      ),
    },
    {
      accessorKey: "publishDate",
      header: "Date de publication",
      cell: ({ row }) => {
        const date = row.getValue("publishDate") as string;
        return date
          ? new Date(date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "N/A";
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      filterFn: (row, id, value) =>
        value === "all" ? true : row.getValue(id) === value,
    },
    {
      accessorKey: "price",
      header: "Prix",
      cell: ({ row }) =>
        `${Number(row.getValue("price")).toLocaleString("fr-FR")} XAF`,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const newspaper = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Ouvrir le menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => viewNewspaper(newspaper.id)}
                  className="focus:text-primary focus:bg-primary/10"
                >
                  <Eye data-icon="inline-start" />
                  Visualiser
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateStatus(newspaper.id, "published")}
                  disabled={newspaper.status === "published"}
                  className="text-green-600 focus:text-green-700 focus:bg-green-50"
                >
                  <Globe data-icon="inline-start" />
                  Publier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateStatus(newspaper.id, "archived")}
                  disabled={newspaper.status === "archived"}
                  className="text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                >
                  <Archive data-icon="inline-start" />
                  Archiver
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => removeNewspaper(newspaper.id)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 data-icon="inline-start" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const data = newspapers ?? [];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro..."
            value={
              (table.getColumn("issueNumber")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("issueNumber")?.setFilterValue(event.target.value)
            }
            className="pl-8"
          />
        </div>
        <Select
          value={
            (table.getColumn("status")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun journal trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft data-icon="inline-start" />
          Précédent
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} sur{" "}
          {Math.max(1, table.getPageCount())}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Suivant
          <ChevronRight data-icon="inline-start" />
        </Button>
      </div>
    </div>
  );
}
