"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, FileText, Download } from "lucide-react";
import { RequestStatus, ValidationStatus, FinalStatus, RequestTypeEnum, RequestType, GradeType } from "@/lib/types";
import DocumentViewer from "@/app/my-queue/[id]/components/document-viewer";

interface RequestAttachment {
  id: string;
  requete_id: string;
  file_name: string;
  file_size: number;
  file_path: string;
  created_at: string;
}

interface RequestData {
  id: string;
  created_by: string;
  request_type: RequestTypeEnum;
  title: string;
  description: string;
  status: RequestStatus;
  validation_status: ValidationStatus;
  final_status: FinalStatus;
  grade_type: GradeType;
  priority: string;
  created_at: string;
  updated_at: string;
  routed_to?: string | null;
  internal_notes?: string | null;
  student_name?: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<RequestData | null>(null);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const supabase = await createClient();

        // Fetch request
        const { data: requestData, error: requestError } = await supabase
          .from("requetes")
          .select("*")
          .eq("id", requestId)
          .single();

        if (requestError) {
          setError("Request not found");
          setLoading(false);
          return;
        }

        // Fetch student name if available
        if (requestData?.created_by) {
          const { data: studentData } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", requestData.created_by)
            .single();

          if (studentData) {
            requestData.student_name = `${studentData.first_name} ${studentData.last_name}`.trim();
          }
        }

        setRequest(requestData);

        // Fetch attachments
        const { data: attachmentData } = await supabase
          .from("attachments")
          .select("*")
          .eq("requete_id", requestId)
          .order("created_at", { ascending: false });

        if (attachmentData) {
          setAttachments(attachmentData);
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load request");
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "validated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "assigned":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "processing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getValidationStatusColor = (status: ValidationStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "validated":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const statusLabels: Record<RequestStatus, string> = {
    submitted: "Soumise",
    validated: "Validée",
    assigned: "Assignée",
    processing: "En traitement",
    completed: "Complétée",
    rejected: "Rejetée",
  };

  const validationLabels: Record<ValidationStatus, string> = {
    pending: "En attente",
    validated: "Validée",
    rejected: "Rejetée",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Request not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{request.title}</h1>
            <p className="text-muted-foreground">Requête #{request.id.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Statut de la Requête</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(request.status)}>
              {statusLabels[request.status]}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Statut de Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getValidationStatusColor(request.validation_status)}>
              {validationLabels[request.validation_status]}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de la Requête</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Type</h3>
              <p className="text-base font-medium mt-1">
                {RequestType[request.request_type]}
              </p>
            </div>

            {request.grade_type && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Type de Note</h3>
                <p className="text-base font-medium mt-1">{request.grade_type}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Priorité</h3>
              <p className="text-base font-medium mt-1 capitalize">{request.priority}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Créée le</h3>
              <p className="text-base font-medium mt-1">
                {new Date(request.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
            <p className="text-base whitespace-pre-wrap">{request.description}</p>
          </div>

          {request.internal_notes && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Notes internes</h3>
              <p className="text-base whitespace-pre-wrap">{request.internal_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      {attachments.length > 0 && (
        <DocumentViewer attachments={attachments} />
      )}
    </div>
  );
}
