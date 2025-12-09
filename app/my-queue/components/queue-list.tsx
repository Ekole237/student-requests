"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { AlertCircle, CheckCircle2, Search, FileText, Clock } from "lucide-react";
import type { Requete } from "@/lib/types";

interface QueueListProps {
  requests: Requete[];
  userRole: string;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";
type SortBy = "date_asc" | "date_desc" | "type";

export default function QueueList({ requests, userRole }: QueueListProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [sortBy, setSortBy] = useState<SortBy>("date_desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests_, setRequests_] = useState(requests);

  // Filter requests
  const filtered = requests_
    .filter((req) => {
      const matchStatus = 
        filterStatus === "all" || 
        (filterStatus === "pending" && req.final_status === null) ||
        (filterStatus !== "pending" && req.final_status === filterStatus);
      const matchSearch =
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.created_by.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.request_type.localeCompare(b.request_type);
    });

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200",
      approved: "bg-green-50 dark:bg-green-950/20 border-green-200",
      rejected: "bg-red-50 dark:bg-red-950/20 border-red-200",
    };
    return colors[status] || "";
  };

  const getPendingCount = () => requests_.filter((r) => r.final_status === null).length;
  const getApprovedCount = () => requests_.filter((r) => r.final_status === "approved").length;
  const getRejectedCount = () => requests_.filter((r) => r.final_status === "rejected").length;

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
    <div className="space-y-6">
      {/* Filters & Sort */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres & Tri</CardTitle>
          <CardDescription>Organisez votre queue de traitement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
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

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvées</SelectItem>
                <SelectItem value="rejected">Rejetées</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Plus récentes d'abord</SelectItem>
                <SelectItem value="date_asc">Plus anciennes d'abord</SelectItem>
                <SelectItem value="type">Par type</SelectItem>
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
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{getPendingCount()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Traitées</p>
              <p className="text-2xl font-bold text-blue-600">
                {getApprovedCount() + getRejectedCount()}
              </p>
            </div>
          </div>

          {/* User Role */}
          <div className="pt-4 border-t flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Votre rôle:</p>
            <Badge variant="outline">{getRoleLabel()}</Badge>
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
                <p className="text-muted-foreground">
                  {requests_.length === 0 ? "Aucune requête routée" : "Aucun résultat trouvé"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filtered.map((request) => (
            <Card
              key={request.id}
              className={`hover:shadow-md transition-shadow ${getStatusColor(request.final_status || "pending")}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold truncate text-lg">{request.title}</h3>
                      <Badge variant="secondary">{getTypeLabel(request.request_type)}</Badge>
                      {request.final_status === null && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                          En attente
                        </Badge>
                      )}
                      {request.final_status === "approved" && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          ✓ Approuvée
                        </Badge>
                      )}
                      {request.final_status === "rejected" && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          ✗ Rejetée
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
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <div>
                          <p className="text-xs">Reçue le</p>
                          <p className="font-medium text-foreground">
                            {new Date(request.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      {request.final_status !== null && (
                        <div>
                          <p className="text-xs">Traitée</p>
                          <p className="font-medium text-foreground">
                            {request.updated_at
                              ? new Date(request.updated_at).toLocaleDateString("fr-FR")
                              : "-"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => {
                      router.push(`/my-queue/${request.id}`);
                    }}
                    className="flex-shrink-0 mt-2"
                    variant={request.final_status === null ? "default" : "outline"}
                  >
                    {request.final_status === null ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Traiter
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

      {/* Treatment Modal */}
    </div>
  );
}
