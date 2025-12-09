"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Requete } from "@/lib/types";
import DecisionCard from "./components/decision-card";
import InfoCard from "./components/info-card";
import RequestDetailsCard from "./components/request-details-card";
import DocumentViewer from "./components/document-viewer";
import HistoryTab from "./components/history-tab";

interface Student {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  matricule: string;
  department_code: string | null;
}

interface Attachment {
  id: string;
  requete_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
}

export default function TreatRequestPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const supabase = createClient();

  const [request, setRequest] = useState<Requete | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

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

        // Load student info
        if (req.created_by) {
          const { data: studentData, error: studentError } = await supabase
            .from("users")
            .select("*")
            .eq("id", req.created_by)
            .single();

          if (!studentError && studentData) {
            setStudent(studentData);
          }
        }

        // Load attachments
        const { data: atts, error: attError } = await supabase
          .from("attachments")
          .select("*")
          .eq("requete_id", requestId);

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
      // Use Server Action to get current user (Adonis auth, not Supabase)
      const { getCurrentUser } = await import('@/app/actions/user');
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from("requetes")
        .update({
          final_status: decision === "approve" ? "approved" : "rejected",  // ✅ Correct enum values
          internal_notes: comment || null,                                  // ✅ Correct field name
          resolved_by: currentUser.id.toString(),                           // ✅ Convert to string (Adonis ID is number)
          resolved_at: new Date().toISOString(),                            // ✅ NOUVEAU
          status: "completed",                                              // ✅ NOUVEAU - Mark as completed
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId);

      if (error) throw error;

      // Create notification for student
      await supabase.from("notifications").insert({
        user_id: request.created_by,
        requete_id: request.id,
        title: decision === "approve" ? "Requête approuvée" : "Requête rejetée",
        message: `Votre requête "${request.title}" a été ${decision === "approve" ? "approuvée" : "rejetée"}.${comment ? ` Commentaire: ${comment}` : ''}`,
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
            <InfoCard request={request} student={student} />
            <DecisionCard
              decision={decision}
              comment={comment}
              processing={processing}
              onDecisionChange={setDecision}
              onCommentChange={setComment}
              onSubmit={handleSubmitDecision}
            />
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

              <TabsContent value="details" className="space-y-6 mt-4">
                <RequestDetailsCard request={request} />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6 mt-4">
                <DocumentViewer attachments={attachments} />
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-4">
                <HistoryTab request={request} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
