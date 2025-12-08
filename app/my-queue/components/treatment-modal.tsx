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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, FileText, Download, User } from "lucide-react";
import type { Requete } from "@/lib/types";

interface TreatmentModalProps {
  request: Requete;
  isOpen: boolean;
  onClose: () => void;
  onTreat: (request: Requete) => void;
  userRole: string;
}

type TreatmentDecision = "approve" | "reject" | null;

export default function TreatmentModal({
  request,
  isOpen,
  onClose,
  onTreat,
  userRole,
}: TreatmentModalProps) {
  const supabase = createClient();
  const [decision, setDecision] = useState<TreatmentDecision>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  // Load attachments and student info
  const loadData = async () => {
    try {
      // Load attachments
      const { data: docs, error: docsError } = await supabase
        .from("attachments")
        .select("*")
        .eq("request_id", request.id);

      if (!docsError) {
        setAttachments(docs || []);
      }

      // Load student info
      const { data: student, error: studentError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .eq("id", request.student_id)
        .single();

      if (!studentError) {
        setStudentInfo(student);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  // Fetch data on modal open
  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadData();
    }
  };

  // Submit treatment decision
  const handleSubmit = async () => {
    if (!decision) {
      setError("Veuillez sélectionner une décision");
      return;
    }

    if (!comment.trim()) {
      setError("Veuillez ajouter un commentaire");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update request
      const { data: updated, error: err } = await supabase
        .from("requetes")
        .update({
          final_status: decision === "approve" ? "approved" : "rejected",
          final_comment: comment,
          status: decision === "approve" ? "completed" : "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .select()
        .single();

      if (err) throw err;

      // Create notification for student
      await supabase.from("notifications").insert({
        user_id: request.student_id,
        request_id: request.id,
        title: decision === "approve" ? "Requête approuvée" : "Requête rejetée",
        message:
          decision === "approve"
            ? `Votre requête "${request.title}" a été approuvée.`
            : `Votre requête "${request.title}" a été rejetée. Motif: ${comment}`,
        type: decision === "approve" ? "request_approved" : "request_rejected",
      });

      onTreat(updated);
    } catch (err: unknown) {
      setError((err as Error).message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      teacher: "Enseignant",
      department_head: "Responsable Pédagogique",
      director: "Directeur",
      member: "Membre",
    };
    return labels[userRole] || userRole;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Traiter Requête
          </DialogTitle>
          <DialogDescription>
            Examinez la requête et prenez votre décision (approuver/rejeter)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="request">Requête</TabsTrigger>
            <TabsTrigger value="student">Étudiant</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
            <TabsTrigger value="decision">Décision</TabsTrigger>
          </TabsList>

          {/* Request Tab */}
          <TabsContent value="request" className="space-y-4 mt-4">
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
                <Label className="text-sm text-muted-foreground">Statut Validation</Label>
                <Badge variant="outline">
                  {request.validation_status === "validated" ? "✓ Validée" : request.validation_status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Soumise le</Label>
                <p className="font-semibold">
                  {new Date(request.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Student Tab */}
          <TabsContent value="student" className="space-y-4 mt-4">
            {studentInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg border">
                  <User className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">
                      {studentInfo.first_name} {studentInfo.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{studentInfo.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">ID Étudiant</Label>
                  <p className="font-monospace font-semibold text-sm">{request.student_id}</p>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Chargement des infos étudiant...</AlertDescription>
              </Alert>
            )}
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
                  }}
                  className="h-20 flex flex-col"
                >
                  <CheckCircle2 className="h-6 w-6 mb-2" />
                  <span>Approuver</span>
                </Button>
                <Button
                  variant={decision === "reject" ? "destructive" : "outline"}
                  onClick={() => {
                    setDecision("reject");
                  }}
                  className="h-20 flex flex-col"
                >
                  <AlertCircle className="h-6 w-6 mb-2" />
                  <span>Rejeter</span>
                </Button>
              </div>
            </div>

            {/* Comment - Always Required */}
            <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border">
              <Label className="text-base font-semibold">
                Commentaire {decision && "(Obligatoire)"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {decision === "approve"
                  ? "Ajoutez un commentaire pour justifier votre approbation"
                  : decision === "reject"
                    ? "Expliquez le motif du rejet"
                    : "Ajoutez un commentaire pour clarifier votre décision"}
              </p>
              <Textarea
                placeholder="Votre commentaire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {comment.length}/500 caractères
              </p>
            </div>

            {/* Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                L'étudiant recevra une notification avec votre commentaire
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !decision || !comment.trim()}
            variant={decision === "reject" ? "destructive" : "default"}
          >
            {loading ? "Traitement..." : decision === "reject" ? "Rejeter" : "Approuver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
