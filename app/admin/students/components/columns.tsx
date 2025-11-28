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
import { StudentWithProfile } from "../page";

export const columns = (onViewStudent: (student: StudentWithProfile) => void): ColumnDef<StudentWithProfile>[] => [
  {
    accessorKey: "profile.first_name",
    header: "Prénom",
  },
  {
    accessorKey: "profile.last_name",
    header: "Nom",
  },
  {
    accessorKey: "matricule",
    header: "Matricule",
  },
  {
    accessorKey: "promotion",
    header: "Promotion",
  },
  {
    accessorKey: "filiere",
    header: "Filière",
  },
  {
    accessorKey: "profile.email",
    header: "Email",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original;

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
              onClick={() => navigator.clipboard.writeText(student.id)}
            >
              Copy student ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewStudent(student)}>View details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
