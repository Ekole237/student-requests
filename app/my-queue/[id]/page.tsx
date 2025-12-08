"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, FileText, Download, ArrowLeft } from "lucide-react";
import type { Requete } from "@/lib/types";

export default function TreatRequestPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const supabase = createClient();

  const [request, setRequest] = useState<Requete | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Load request
  useEffect(() => {
    const loadRequest = async () => {
      try {
        const { data: req, error: reqError } = await supabase
          .from("requetes")
          .select("*")
          .eq("id", requestId)
          .single();

        if (reqError) throw reqError;
        setRequest(req);

        // Load attachments
        const { data: atts, error: attError } = await supabase
          .from("attachments")
          .select("*")
          .eq("request_id", requestId);

        if (!attError && atts) {
          setAttachments(atts);
        }
      } catch (err) {
        console.error("Error loading request:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [requestId, supabase]);

  const handleSubmitDecision = async () => {
    if (!request || !decision) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("requetes")
        .update({
          final_status: decision,
          processing_comment: comment || null,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Create notification for student
      await supabase.from("notifications").insert({
        user_id: request.created_by,
        requete_id: request.id,
        title: decision === "approve" ? "Requête approuvée" : "Requête rejetée",
        message: `Votre requête "${request.title}" a été ${decision === "approve" ? "approuvée" : "rejetée"}.`,
        type: "request_processed",
      });

      router.push("/my-queue");
    } catch (err) {
      console.error("Error updating request:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!request) {
    return <div className="p-8">Requête non trouvée</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header with back button */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Traiter la Requête</h1>
            <p className="text-muted-foreground mt-2">
              {request.title}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Decision Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Decision Card */}
            <Card>
              <CardHeader>
                <CardTitle>Prendre une Décision</CardTitle>
                <CardDescription>Approuver ou rejeter la requête</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    variant={decision === "approve" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setDecision("approve")}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                    Approuver
                  </Button>
                  <Button
                    variant={decision === "reject" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setDecision("reject")}
                  >
                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                    Rejeter
                  </Button>
                </div>

                {decision && (
                  <div className="pt-4 border-t">
                    <Label htmlFor="comment" className="text-sm font-semibold mb-2 block">
                      Commentaire {decision === "reject" ? "(obligatoire)" : "(optionnel)"}
                    </Label>
                    <Textarea
                      id="comment"
                      placeholder={
                        decision === "reject"
                          ? "Expliquez pourquoi vous rejetez cette requête..."
                          : "Ajoutez un commentaire optionnel..."
                      }
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mb-4"
                      rows={4}
                    />
                    <Button
                      className="w-full"
                      disabled={
                        processing ||
                        (decision === "reject" && !comment.trim())
                      }
                      onClick={handleSubmitDecision}
                    >
                      {processing ? "Traitement..." : "Valider la Décision"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <Badge>{request.request_type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Priorité</p>
                  <Badge variant="outline">{request.priority}</Badge>
                </div>
                {request.grade_type && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type de Note</p>
                    <Badge variant="outline">{request.grade_type}</Badge>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Soumise le</p>
                  <p className="text-sm font-medium">
                    {new Date(request.created_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Détails de la Requête</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">Titre</Label>
                      <p className="font-semibold">{request.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">Description</Label>
                      <p className="text-sm whitespace-pre-wrap">{request.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1 block">Étudiant</Label>
                        <p className="font-semibold text-sm">{request.created_by}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1 block">Département</Label>
                        <p className="font-semibold text-sm">{request.department_code}</p>
                      </div>
                    </div>
                    {request.routed_to && (
                      <div className="pt-4 border-t bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        <Label className="text-sm text-muted-foreground mb-1 block">Routée vers</Label>
                        <p className="font-semibold text-sm">
                          {request.routed_to_role === "teacher" ? "Enseignant" : "Responsable Pédagogique"}
                        </p>
                        <p className="text-xs text-muted-foreground">{request.routed_to}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documents Fournis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun document fourni</p>
                    ) : (
                      <div className="space-y-2">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <div>
                                <p className="font-semibold text-sm">{att.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(att.file_size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <a
                                href={att.file_path}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <div className="w-0.5 h-8 bg-gray-200" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Requête soumise</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      {request.validated_at && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            {request.resolved_at && <div className="w-0.5 h-8 bg-gray-200" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Requête validée</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.validated_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
