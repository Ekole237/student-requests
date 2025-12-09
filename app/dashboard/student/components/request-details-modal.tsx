"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import type { Requete } from "@/lib/types";

interface RequestDetailsModalProps {
  request: Requete;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestDetailsModal({
  request,
  isOpen,
  onClose,
}: RequestDetailsModalProps) {
  const supabase = createClient();
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load attachments
  const loadAttachments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("requete_id", request.id);

      if (!error) {
        setAttachments(data || []);
      }
    } catch (err) {
      console.error("Error loading attachments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attachments when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadAttachments();
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      grade_inquiry: "📊 Demande de Note",
      absence_justification: "📋 Justification d'Absence",
      certificate_request: "📜 Demande de Certificat",
      grade_correction: "✏️ Correction de Note",
      schedule_change: "📅 Changement d'Horaire",
      other: "❓ Autre",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Détails de la Requête
          </DialogTitle>
          <DialogDescription>{request.title}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Infos</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type</p>
                <Badge>{getTypeLabel(request.request_type)}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Titre</p>
                <p className="font-semibold">{request.title}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{request.description}</p>
              </div>

              {request.grade_type && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type de Note</p>
                  <Badge variant="outline">{request.grade_type}</Badge>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="docs" className="space-y-4 mt-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : attachments.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Aucun document fourni</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold">Documents fournis ({attachments.length})</p>
                {attachments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = `/api/download/${doc.id}`;
                        link.download = doc.file_name;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Step 1: Submitted */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  {(request.validation_status || request.status !== "rejected") && (
                    <div className="w-1 h-8 bg-gray-200 dark:bg-gray-700 my-2" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-semibold">Soumise</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              {/* Step 2: Validation */}
              {request.status === "submitted" && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    {request.validation_status === "rejected" && (
                      <div className="w-1 h-8 bg-gray-200 dark:bg-gray-700 my-2" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold">
                      {request.validation_status === "pending"
                        ? "En attente de validation"
                        : request.validation_status === "validated"
                          ? "Validée"
                          : "Rejetée"}
                    </p>
                    {request.validation_status === "rejected" && request.rejection_reason && (
                      <Alert className="mt-2 bg-red-50 dark:bg-red-950/20 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                          <strong>Motif:</strong> {request.rejection_reason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Treatment */}
              {(request.validation_status === "validated" ||
                request.final_status === "approved" ||
                request.final_status === "rejected") && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    {(request.final_status === "approved" ||
                      request.final_status === "rejected") && (
                      <div className="w-1 h-8 bg-gray-200 dark:bg-gray-700 my-2" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold">En cours de traitement</p>
                    <p className="text-sm text-muted-foreground">
                      Par le{" "}
                      {request.routed_to_role === "teacher"
                        ? "professeur"
                        : request.routed_to_role === "department_head"
                          ? "responsable pédagogique"
                          : "membre"}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Final Decision */}
              {(request.final_status === "approved" ||
                request.final_status === "rejected") && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        request.final_status === "approved"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {request.final_status === "approved" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {request.final_status === "approved" ? "Approuvée ✓" : "Rejetée ✗"}
                    </p>
                    {request.final_comment && (
                      <div
                        className={`mt-2 p-3 rounded text-sm ${
                          request.final_status === "approved"
                            ? "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200"
                            : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200"
                        }`}
                      >
                        <p className="font-medium mb-1">Commentaire:</p>
                        <p>{request.final_comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
