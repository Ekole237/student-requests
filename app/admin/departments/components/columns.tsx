"use client";

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
import { DepartmentWithHead } from "../page";

export const columns = (
  onEditDepartment: (department: DepartmentWithHead) => void,
  onDeleteDepartment: (departmentId: string) => void,
) => {
  const departmentColumns: ColumnDef<DepartmentWithHead>[] = [
    {
      accessorKey: "name",
      header: "Nom",
    },
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "head.first_name",
      header: "Responsable",
      cell: ({ row }) => {
        const head = row.original.head;
        return head ? `${head.first_name} ${head.last_name}` : "N/A";
      },
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
        const department = row.original;

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
                onClick={() => navigator.clipboard.writeText(department.id)}
              >
                Copy Department ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEditDepartment(department)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteDepartment(department.id)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return departmentColumns;
};
