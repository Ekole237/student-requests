"use client";

import { Requete } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, badgeVariants } from "@/components/ui/badge";

export const columns = (
  onViewRequest: (request: Requete) => void,
  onUpdateRequest: (request: Requete) => void,
) => {
  const adminColumns: ColumnDef<Requete>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type: string = row.getValue("type");
        return (
          <span className="capitalize">
            {type.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status: Requete["status"] = row.getValue("status");
        let variant: Parameters<typeof badgeVariants>[0]["variant"] = "default";
        if (status === "pending") {
          variant = "secondary";
        } else if (status === "in_progress") {
          variant = "default";
        } else if (status === "completed") {
          variant = "default";
        } else if (status === "rejected") {
          variant = "destructive";
        }
        return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
      },
    },
    {
      accessorKey: "student_id",
      header: "Student ID",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        const formatted = date.toLocaleDateString();
        return <div>{formatted}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const requete = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(requete.id)}
              >
                Copy request ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewRequest(requete)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateRequest(requete)}>
                Update Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return adminColumns;
};
