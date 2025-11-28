'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { RequestDataTable } from '@/components/RequestDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Request {
  id: string;
  type: 'CC_ABSENCE' | 'CC_ERROR' | 'SN_ABSENCE' | 'OTHER';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  description: string;
  student: {
    firstName: string;
    lastName: string;
  };
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    CC_ABSENCE: 'CC - Absence de note',
    CC_ERROR: 'CC - Erreur de note',
    SN_ABSENCE: 'SN - Absence de note',
    OTHER: 'Autre requête',
  };
  return labels[type] || type;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    DRAFT: 'secondary',
    SUBMITTED: 'blue',
    UNDER_REVIEW: 'yellow',
    APPROVED: 'green',
    REJECTED: 'destructive',
  };
  return colors[status] || 'default';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    SUBMITTED: 'Soumise',
    UNDER_REVIEW: 'En révision',
    APPROVED: 'Approuvée',
    REJECTED: 'Rejetée',
  };
  return labels[status] || status;
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch requests from API
    const mockRequests: Request[] = [
      {
        id: '1',
        type: 'CC_ABSENCE',
        status: 'SUBMITTED',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        description: 'Absence de note pour le contrôle continu du 10 janvier',
        student: { firstName: 'Jean', lastName: 'Dupont' },
      },
      {
        id: '2',
        type: 'SN_ABSENCE',
        status: 'UNDER_REVIEW',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-22'),
        description: 'Note manquante pour la session normale',
        student: { firstName: 'Jean', lastName: 'Dupont' },
      },
    ];
    setRequests(mockRequests);
    setLoading(false);
  }, []);

  const columns: ColumnDef<Request>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="text-sm">{getTypeLabel(row.getValue('type'))}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm text-muted-foreground">
          {row.getValue('description')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={getStatusColor(row.getValue('status')) as any}>
          {getStatusLabel(row.getValue('status'))}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue('createdAt')), 'dd MMM yyyy', {
            locale: fr,
          })}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/requests/${row.original.id}`}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir détails
              </Link>
            </DropdownMenuItem>
            {row.original.status === 'DRAFT' && (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/requests/${row.original.id}/edit`}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Éditer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // TODO: Handle delete
                    console.log('Delete', row.original.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Requêtes</h1>
          <p className="text-muted-foreground">
            Gérez et suivez vos requêtes académiques
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/submit-request">
            <FileText className="mr-2 h-4 w-4" />
            Nouvelle requête
          </Link>
        </Button>
      </div>

      <RequestDataTable
        columns={columns}
        data={requests}
        searchPlaceholder="Rechercher par type, description..."
      />
    </div>
  );
}
