"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, FileText, Download } from "lucide-react";
import type { Requete } from "@/lib/types";

interface ValidationModalProps {
  request: Requete;
  isOpen: boolean;
  onClose: () => void;
  onValidate: (request: Requete) => void;
}

type ValidationDecision = "approve" | "reject" | null;

export default function ValidationModal({
  request,
  isOpen,
  onClose,
  onValidate,
}: ValidationModalProps) {
  const supabase = createClient();
  const [decision, setDecision] = useState<ValidationDecision>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [routedToId, setRoutedToId] = useState<string>("");
  const [routedToRole, setRoutedToRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Load attachments
  const loadAttachments = async () => {
    const { data, error: err } = await supabase
      .from("attachments")
      .select("*")
      .eq("request_id", request.id);

    if (err) {
      console.error("Error loading attachments:", err);
      return;
    }

    setAttachments(data || []);
  };

  // Fetch attachments on modal open
  const handleOpenChange = (open: boolean) => {
    if (open && request.id) {
      loadAttachments();
    }
  };

  // Validate & submit
  const handleSubmit = async () => {
    if (!decision) {
      setError("Veuillez sélectionner une décision");
      return;
    }

    if (decision === "reject" && !rejectionReason.trim()) {
      setError("Veuillez spécifier le motif du rejet");
      return;
    }

    if (decision === "approve" && !routedToId) {
      setError("Veuillez sélectionner le destinataire");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (decision === "reject") {
        // Reject: status = rejected
        const { data: updated, error: err } = await supabase
          .from("requetes")
          .update({
            validation_status: "rejected",
            rejection_reason: rejectionReason,
            status: "rejected",
          })
          .eq("id", request.id)
          .select()
          .single();

        if (err) throw err;

        // Create notification for student
        await supabase.from("notifications").insert({
          user_id: request.student_id,
          request_id: request.id,
          title: "Requête rejetée",
          message: `Votre requête "${request.title}" a été rejetée. Motif: ${rejectionReason}`,
          type: "request_rejected",
        });

        onValidate(updated);
      } else {
        // Approve: route to destinataire
        const { data: updated, error: err } = await supabase
          .from("requetes")
          .update({
            validation_status: "validated",
            status: "validated",
            routed_to_id: routedToId,
            routed_to_role: routedToRole,
          })
          .eq("id", request.id)
          .select()
          .single();

        if (err) throw err;

        // Create notification for student
        await supabase.from("notifications").insert({
          user_id: request.student_id,
          request_id: request.id,
          title: "Requête validée",
          message: `Votre requête "${request.title}" a été validée et est en cours de traitement.`,
          type: "request_validated",
        });

        // Create notification for destinataire
        await supabase.from("notifications").insert({
          user_id: routedToId,
          request_id: request.id,
          title: "Nouvelle requête à traiter",
          message: `Une nouvelle requête "${request.title}" vous a été assignée.`,
          type: "request_assigned",
        });

        onValidate(updated);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Auto-route based on type
  const getAutoRoute = () => {
    // TODO: Implémenter logique de routage intelligent
    // Pour maintenant, manuel
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Valider Requête
          </DialogTitle>
          <DialogDescription>
            Vérifiez la conformité des documents et validez ou rejetez
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Infos</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
            <TabsTrigger value="decision">Décision</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Type</Label>
                <Badge>{request.type}</Badge>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Titre</Label>
                <p className="font-semibold">{request.title}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-sm whitespace-pre-wrap">{request.description}</p>
              </div>
              {request.grade_type && (
                <div>
                  <Label className="text-sm text-muted-foreground">Type de Note</Label>
                  <Badge variant="outline">{request.grade_type}</Badge>
                </div>
              )}
              <div className="pt-3 border-t">
                <Label className="text-sm text-muted-foreground">Étudiant</Label>
                <p className="font-semibold">{request.student_id}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Soumise le</Label>
                <p className="font-semibold">
                  {new Date(request.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Docs Tab */}
          <TabsContent value="docs" className="space-y-4 mt-4">
            {attachments.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Aucun document fourni</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label>Documents fournis ({attachments.length})</Label>
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
                        // TODO: Implémenter download
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

          {/* Decision Tab */}
          <TabsContent value="decision" className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Label>Décision</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={decision === "approve" ? "default" : "outline"}
                  onClick={() => {
                    setDecision("approve");
                    setRejectionReason("");
                  }}
                  className="h-20 flex flex-col"
                >
                  <CheckCircle2 className="h-6 w-6 mb-2" />
                  <span>Valider</span>
                </Button>
                <Button
                  variant={decision === "reject" ? "destructive" : "outline"}
                  onClick={() => {
                    setDecision("reject");
                    setRoutedToId("");
                    setRoutedToRole("");
                  }}
                  className="h-20 flex flex-col"
                >
                  <AlertCircle className="h-6 w-6 mb-2" />
                  <span>Rejeter</span>
                </Button>
              </div>
            </div>

            {/* Approve: Select destinataire */}
            {decision === "approve" && (
              <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border">
                <Label className="text-base font-semibold">Destinataire</Label>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez qui doit traiter cette requête
                </p>

                <Select value={routedToRole} onValueChange={setRoutedToRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de destinataire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Enseignant (CC)</SelectItem>
                    <SelectItem value="department_head">Responsable Pédagogique (SN)</SelectItem>
                    <SelectItem value="director">Directeur</SelectItem>
                    <SelectItem value="member">Autre Membre</SelectItem>
                  </SelectContent>
                </Select>

                {routedToRole && (
                  <div>
                    <Label className="text-sm">Utilisateur spécifique</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      TODO: Liste dynamique selon le rôle
                    </p>
                    <Select value={routedToId} onValueChange={setRoutedToId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Fetch users by role from DB */}
                        <SelectItem value="demo-user-1">Utilisateur 1 (Demo)</SelectItem>
                        <SelectItem value="demo-user-2">Utilisateur 2 (Demo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Reject: Reason */}
            {decision === "reject" && (
              <div className="space-y-4 p-4 bg-destructive/10 rounded-lg border border-destructive/50">
                <Label className="text-base font-semibold">Motif du rejet</Label>
                <Textarea
                  placeholder="Décrivez le motif du rejet (ex: Documents manquants, Fichier corrompu, Mauvais format, etc.)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {rejectionReason.length}/500 caractères
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    L'étudiant recevra ce motif et pourra resoummettre
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !decision}
            variant={decision === "reject" ? "destructive" : "default"}
          >
            {loading ? "Traitement..." : decision === "reject" ? "Rejeter" : "Valider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
