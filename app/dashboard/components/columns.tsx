"use client";

import { Requete } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Eye as ViewIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const typeLabels: Record<string, string> = {
  cc_absence: "Absence CC",
  cc_error: "Erreur CC",
  sn_absence: "Absence SN",
  other: "Autre",
};

const statusConfig: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
  pending: { variant: "secondary", label: "En attente" },
  in_progress: { variant: "default", label: "En cours" },
  completed: { variant: "default", label: "Complétée" },
  rejected: { variant: "destructive", label: "Rejetée" },
};

export const columns = (onViewRequest: (request: Requete) => void): ColumnDef<Requete>[] => [
  {
    accessorKey: "title",
    header: "Titre",
    cell: ({ row }) => {
      const title: string = row.getValue("title");
      return <div className="font-medium max-w-xs truncate">{title}</div>;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type: string = row.getValue("type");
      return <span className="text-sm">{typeLabels[type] || type}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status: Requete["status"] = row.getValue("status");
      const config = statusConfig[status] || { variant: "default", label: status };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Créée le",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      const formatted = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return <div className="text-sm">{formatted}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const requete = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewRequest(requete)}
            className="gap-2"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">Voir</span>
          </Button>
        </div>
      );
    },
  },
];
