"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Search, FileText } from "lucide-react";
import type { Requete } from "@/lib/types";
import ValidationModal from "./validation-modal";

interface ValidationListProps {
  requests: Requete[];
}

type FilterType = "all" | "grade_inquiry" | "certificate_request" | "other";

export default function ValidationList({ requests }: ValidationListProps) {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<Requete | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests_, setRequests_] = useState(requests);

  // Filter requests
  const filtered = requests_.filter((req) => {
    const matchType = filterType === "all" || req.request_type === filterType;
    const matchSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const handleValidate = (updatedRequest: Requete) => {
    setRequests_((prev) =>
      prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r))
    );
    setIsModalOpen(false);
    setSelectedRequest(null);
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

  const getGradeTypeLabel = (gradeType: string | null) => {
    if (!gradeType) return null;
    return gradeType === "CC" ? "CC (Continu)" : "SN (Session)";
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
          <CardDescription>Filtrez les requêtes à valider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Chercher par titre ou ID étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="grade_inquiry">Demande de Note</SelectItem>
                <SelectItem value="certificate_request">Demande de Certificat</SelectItem>
                <SelectItem value="absence_justification">Justification d'Absence</SelectItem>
                <SelectItem value="grade_correction">Correction de Note</SelectItem>
                <SelectItem value="schedule_change">Changement d'Horaire</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{requests_.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">À valider</p>
              <p className="text-2xl font-bold text-orange-600">
                {requests_.filter((r) => r.validation_status === "pending").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Filtrées</p>
              <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-3">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucune requête à valider</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filtered.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold truncate text-lg">{request.title}</h3>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {getTypeLabel(request.request_type)}
                      </Badge>
                      {request.grade_type && (
                        <Badge variant="outline" className="flex-shrink-0">
                          {getGradeTypeLabel(request.grade_type)}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {request.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div>
                        <p className="text-xs">Étudiant</p>
                        <p className="font-medium text-foreground">{request.created_by}</p>
                      </div>
                      <div>
                        <p className="text-xs">Soumise le</p>
                        <p className="font-medium text-foreground">
                          {new Date(request.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {request.validation_status === "pending" && (
                        <div className="flex items-center gap-1 text-orange-600 ml-auto">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">En attente</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsModalOpen(true);
                    }}
                    className="flex-shrink-0 mt-2"
                  >
                    {request.validation_status === "pending" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Valider
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Voir
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Validation Modal */}
      {selectedRequest && (
        <ValidationModal
          request={selectedRequest}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRequest(null);
          }}
          onValidate={handleValidate}
        />
      )}
    </div>
  );
}
