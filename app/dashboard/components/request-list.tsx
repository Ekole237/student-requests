"use client";

import { useState, useMemo } from "react";
import type { Requete } from "@/lib/types";
import ViewRequestModal from "./view-request-modal";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InboxIcon, Plus, Search, Eye, FileText, Calendar, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RequestListProps {
  requetes: Requete[];
}

const statusConfig: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
  pending: { variant: "secondary", label: "En attente" },
  in_progress: { variant: "default", label: "En cours" },
  completed: { variant: "default", label: "Complétée" },
  rejected: { variant: "destructive", label: "Rejetée" },
};

export default function RequestList({ requetes }: RequestListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredRequetes = useMemo(() => {
    return requetes.filter((req) => {
      const matchSearch =
        req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "" || req.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requetes, searchQuery, statusFilter]);

  const paginatedRequetes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequetes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRequetes, currentPage]);

  const totalPages = Math.ceil(filteredRequetes.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    return {
      total: requetes.length,
      submitted: requetes.filter((r) => r.status === "submitted").length,
      validated: requetes.filter((r) => r.status === "validated").length,
      assigned: requetes.filter((r) => r.status === "assigned").length,
      processing: requetes.filter((r) => r.status === "processing").length,
      completed: requetes.filter((r) => r.status === "completed").length,
      rejected: requetes.filter((r) => r.status === "rejected").length,
    };
  }, [requetes]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequestId(null);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes Requêtes</h1>
          <p className="text-muted-foreground mt-1">Gérez et suivez vos requêtes soumises</p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/dashboard/submit">
            <Plus size={18} />
            Nouvelle Requête
          </Link>
        </Button>
      </div>

      {requetes.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant={"icon"}>
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>Aucune requête</EmptyTitle>
            <EmptyDescription>
              Vous n&apos;avez pas encore créé de requête. Cliquez sur le bouton ci-dessus pour en créer une.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Soumises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Validées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.validated}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Complétées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rejetées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par titre ou ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les statuts</SelectItem>
                  <SelectItem value="submitted">Soumise</SelectItem>
                  <SelectItem value="validated">Validée</SelectItem>
                  <SelectItem value="assigned">Assignée</SelectItem>
                  <SelectItem value="processing">En traitement</SelectItem>
                  <SelectItem value="completed">Complétée</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Requests List */}
          {filteredRequetes.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant={"icon"}>
                  <InboxIcon />
                </EmptyMedia>
                <EmptyTitle>Aucun résultat</EmptyTitle>
                <EmptyDescription>
                  Aucune requête ne correspond à vos critères de recherche.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedRequetes.map((requete) => (
                  <RequestCard
                    key={requete.id}
                    requete={requete}
                    onView={() => {
                      setSelectedRequestId(requete.id);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="text-sm text-muted-foreground">
                    Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequetes.length)} sur{" "}
                    {filteredRequetes.length} requêtes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="gap-2"
                    >
                      <ChevronLeft size={16} />
                      Précédent
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          className="w-10 h-10 p-0"
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="gap-2"
                    >
                      Suivant
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <ViewRequestModal
            requestId={selectedRequestId}
            isOpen={isModalOpen}
            onClose={closeModal}
          />
        </>
      )}
    </div>
  );
}

// Request Card Component
function RequestCard({
  requete,
  onView,
}: {
  requete: Requete;
  onView: () => void;
}) {
  const statusConfig: Record<string, { variant: BadgeProps["variant"]; label: string; color: string }> = {
    submitted: { variant: "secondary", label: "Soumise", color: "bg-yellow-50 border-yellow-200" },
    validated: { variant: "default", label: "Validée", color: "bg-blue-50 border-blue-200" },
    assigned: { variant: "default", label: "Assignée", color: "bg-purple-50 border-purple-200" },
    processing: { variant: "default", label: "En traitement", color: "bg-cyan-50 border-cyan-200" },
    completed: { variant: "default", label: "Complétée", color: "bg-green-50 border-green-200" },
    rejected: { variant: "destructive", label: "Rejetée", color: "bg-red-50 border-red-200" },
  };

  const config = statusConfig[requete.status] || statusConfig.submitted;
  const createdDate = requete.created_at ? new Date(requete.created_at) : null;

  return (
    <Card className={`${config.color} cursor-pointer transition-all hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            {/* Title and Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold">{requete.title || "Requête sans titre"}</h3>
                </div>
                <p className="text-sm text-muted-foreground">ID: {requete.id}</p>
              </div>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>

            {/* Description */}
            {requete.description && (
              <p className="text-sm text-foreground/80 line-clamp-2">{requete.description}</p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {createdDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={16} />
                  <span>{format(createdDate, "d MMM yyyy", { locale: fr })}</span>
                </div>
              )}

              {requete.status === "rejected" && requete.rejection_reason && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={16} />
                  <span className="truncate">{requete.rejection_reason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="gap-2 mt-1"
          >
            <Eye size={16} />
            Voir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
