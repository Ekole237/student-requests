"use client";

import { useState } from "react";
import type { Requete } from "@/lib/types";
import { RequestType } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ITEMS_PER_PAGE = 10;

const statusConfig = {
  submitted: { label: "En attente", variant: "outline" as const },
  validated: { label: "Validée", variant: "default" as const },
  rejected: { label: "Rejetée", variant: "destructive" as const },
  processing: { label: "En cours", variant: "secondary" as const },
  assigned: { label: "Assignée", variant: "secondary" as const },
  completed: { label: "Résolue", variant: "default" as const },
};

export default function RequestsDataTable({
  requetes,
}: {
  requetes: Requete[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<Requete | null>(null);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);

  const totalPages = Math.ceil(requetes.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequetes = requetes.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

  const handleDelete = async (id: string) => {
    console.log("Delete request:", id);
    setDeleteRequestId(null);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequetes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Aucune requête trouvée
                </TableCell>
              </TableRow>
            ) : (
              paginatedRequetes.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="text-sm">
                    {format(new Date(req.created_at), "dd MMM yyyy", {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {RequestType[req.request_type as keyof typeof RequestType] ||
                      req.request_type}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusConfig[req.status as keyof typeof statusConfig]
                          ?.variant || "secondary"
                      }
                    >
                      {statusConfig[req.status as keyof typeof statusConfig]
                        ?.label || req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {req.status === "submitted" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteRequestId(req.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages} ({requetes.length} requête
            {requetes.length > 1 ? "s" : ""})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la requête</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Type
                  </p>
                  <p className="text-sm">
                    {RequestType[selectedRequest.request_type as keyof typeof RequestType] ||
                      selectedRequest.request_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Statut
                  </p>
                  <Badge
                    variant={
                      statusConfig[
                        selectedRequest.status as keyof typeof statusConfig
                      ]?.variant || "secondary"
                    }
                  >
                    {statusConfig[
                      selectedRequest.status as keyof typeof statusConfig
                    ]?.label || selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="text-sm">
                    {format(new Date(selectedRequest.created_at), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Dernière mise à jour
                  </p>
                  <p className="text-sm">
                    {format(new Date(selectedRequest.updated_at), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-sm p-3 bg-muted rounded">
                    {selectedRequest.description}
                  </p>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Motif du rejet
                  </p>
                  <p className="text-sm p-3 bg-destructive/10 text-destructive rounded">
                    {selectedRequest.rejection_reason}
                  </p>
                </div>
              )}

              {selectedRequest.attachment_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Pièce jointe
                  </p>
                  <a
                    href={selectedRequest.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Télécharger la pièce jointe
                  </a>
                </div>
              )}

              {selectedRequest.status === "submitted" && (
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setDeleteRequestId(selectedRequest.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteRequestId} onOpenChange={() => setDeleteRequestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette requête?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La requête sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteRequestId) {
                  handleDelete(deleteRequestId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
