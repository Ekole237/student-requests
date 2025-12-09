"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Requete } from "@/lib/types";
import RequestDetailsModal from "./request-details-modal";

interface RequestsListProps {
  requests: Requete[];
}

export default function RequestsList({ requests }: RequestsListProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<Requete | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "validated":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "completed":
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string, validationStatus?: string) => {
    if (status === "submitted") {
      if (validationStatus === "pending") return "En attente de validation";
      if (validationStatus === "validated") return "Validée - En cours de traitement";
      if (validationStatus === "rejected") return "Rejetée - Peut être resoumise";
    }
    if (status === "completed") return "Approuvée ✓";
    if (status === "approved") return "Approuvée ✓";
    if (status === "rejected") return "Rejetée ✗";
    return status;
  };

  const getStatusColor = (status: string, validationStatus?: string) => {
    if (status === "submitted") {
      if (validationStatus === "rejected") return "bg-red-50 dark:bg-red-950/20 border-red-200";
      return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200";
    }
    if (status === "completed" || status === "approved")
      return "bg-green-50 dark:bg-green-950/20 border-green-200";
    if (status === "rejected") return "bg-red-50 dark:bg-red-950/20 border-red-200";
    return "bg-blue-50 dark:bg-blue-950/20 border-blue-200";
  };

  const canResubmit = (request: Requete) => {
    return request.status === "submitted" && request.validation_status === "rejected";
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-3">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Aucune requête soumise</h3>
            <p className="text-muted-foreground">
              Soumettez une requête pour commencer
            </p>
            <Button className="mt-4" onClick={() => router.push("/requests/new")}>
              Soumettre une requête
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card
          key={request.id}
          className={`${getStatusColor(request.status, request.validation_status)} hover:shadow-md transition-shadow`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(request.status)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{request.title}</h3>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="secondary">{getTypeLabel(request.request_type)}</Badge>
                  <Badge variant="outline">
                    {getStatusLabel(request.status, request.validation_status)}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {request.description}
                </p>

                {/* Timeline */}
                <div className="space-y-2 text-sm">
                  {/* Soumise */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Soumise le{" "}
                      <span className="font-medium text-foreground">
                        {new Date(request.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </span>
                  </div>

                  {/* Validation Status */}
                  {request.status === "submitted" && request.validation_status === "rejected" && (
                    <Alert className="mt-2 bg-red-50 dark:bg-red-950/20 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        <strong>Motif du rejet:</strong> {request.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Routed Info */}
                  {request.validation_status === "validated" && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Validée - En cours de traitement par le{" "}
                        <span className="font-medium">
                          {request.routed_to_role === "teacher"
                            ? "professeur"
                            : request.routed_to_role === "department_head"
                              ? "responsable pédagogique"
                              : "membre"}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Final Result */}
                  {request.final_status === "approved" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">Approuvée ✓</span>
                      </div>
                      <div className="pl-6 bg-green-50 dark:bg-green-950/30 p-2 rounded text-green-800 dark:text-green-200 text-xs">
                        <p className="font-medium mb-1">Commentaire:</p>
                        <p>{request.final_comment}</p>
                      </div>
                    </div>
                  )}

                  {request.final_status === "rejected" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">Rejetée ✗</span>
                      </div>
                      <div className="pl-6 bg-red-50 dark:bg-red-950/30 p-2 rounded text-red-800 dark:text-red-200 text-xs">
                        <p className="font-medium mb-1">Motif:</p>
                        <p>{request.final_comment}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsModalOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Détails
                </Button>
                {canResubmit(request) && (
                  <Button
                    size="sm"
                    onClick={() => router.push(`/requests/new?edit=${request.id}`)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resoummettre
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}
