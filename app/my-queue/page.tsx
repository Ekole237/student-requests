import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, FileText, Clock } from "lucide-react";

import QueueList from "./components/queue-list";

export const dynamic = "force-dynamic";

export default async function MyQueuePage() {
  const supabase = await createClient();

  // Check authentication with Adonis
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user has treatment role
  const validRoles = ["enseignant", "responsable_pedagogique", "directeur", "member"];

  if (!validRoles.includes(user.role?.name || "")) {
    redirect("/dashboard");
  }

  // Fetch all validated requests from the same filière/promotion
  // RPs can see:
  // 1. Requests routed directly to them
  // 2. Requests routed to any teacher in their filière/promotion
  
  const userPromotionCode = user.promotion?.name || "";
  
  // First, get all requests from this promotion
  const { data: allPromotionRequests, error: requestsError } = await supabase
    .from("requetes")
    .select("*")
    .eq("status", "validated")
    .eq("promotion_code", userPromotionCode)
    .order("created_at", { ascending: false });

  if (requestsError) {
    console.error("Error fetching requests:", requestsError);
  }

  // Get all teachers in the same promotion (for checking if routed_to is a teacher)
  const { data: promotionTeachers, error: teachersError } = await supabase
    .from("users")
    .select("id")
    .eq("role", "teacher")
    .eq("promotion_code", userPromotionCode)
    .eq("is_active", true);

  const teacherIds = new Set(promotionTeachers?.map(t => t.id) || []);

  // Filter requests based on RP's authority
  const requests = (allPromotionRequests || []).filter(req => {
    // RP can see requests routed directly to them
    if (req.routed_to === user.id.toString()) {
      return true;
    }
    
    // RP can see requests routed to any teacher in their filière
    if (req.routed_to && teacherIds.has(req.routed_to)) {
      return true;
    }
    
    return false;
  });
  const pendingCount = requests.filter((r) => r.final_status === "pending").length;
  const approvedCount = requests.filter((r) => r.final_status === "approved").length;
  const rejectedCount = requests.filter((r) => r.final_status === "rejected").length;

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      enseignant: "👨‍🏫 Enseignant",
      responsable_pedagogique: "📊 Responsable Pédagogique",
      directeur: "👔 Directeur",
      member: "👤 Membre",
    };
    return labels[user.role?.name || ""] || user.role?.name || "Utilisateur";
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Ma Queue de Traitement</h1>
              <p className="text-muted-foreground">
                Traitez les requêtes routées vers vous
              </p>
            </div>
            <Badge variant="outline" className="text-base py-2 px-3">
              {getRoleLabel()}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Total</p>
                <p className="text-4xl font-bold">{requests.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-yellow-600" />
                <p className="text-sm text-muted-foreground mb-2">En attente</p>
                <p className="text-4xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground mb-2">Approuvées</p>
                <p className="text-4xl font-bold text-green-600">{approvedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-5 w-5 mx-auto mb-2 text-red-600" />
                <p className="text-sm text-muted-foreground mb-2">Rejetées</p>
                <p className="text-4xl font-bold text-red-600">{rejectedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        {pendingCount > 0 && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Vous avez {pendingCount} requête{pendingCount > 1 ? "s" : ""} en attente de traitement.
              Prenez votre décision et ajoutez vos commentaires.
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-3">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">Aucune requête à traiter</h3>
                <p className="text-muted-foreground">
                  Les requêtes validées par l'admin vous seront assignées ici
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <QueueList requests={requests} userRole={user.role?.name || ""} />
        )}
      </div>
    </div>
  );
}
