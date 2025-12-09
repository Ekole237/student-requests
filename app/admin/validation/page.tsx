export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { getUser } from "@/lib/auth";
import { requirePermission } from "@/lib/middleware/requirePermission";

import ValidationList from "./components/validation-list";

export default async function ValidationPage() {
  // Check authentication and permission
  const user = await getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Vérifie que l'utilisateur a la permission de valider
  requirePermission(user, "requetes:validate");

  const supabase = await createClient();

  // Fetch all submitted requests
  const { data: requests, error: requestsError } = await supabase
    .from("requetes")
    .select("*")
    .eq("status", "submitted")
    .order("created_at", { ascending: false });

  if (requestsError) {
    console.error("Error fetching requests:", requestsError);
  }

  const allRequests = requests || [];
  const pendingCount = allRequests.filter((r) => r.validation_status === "pending").length;
  const validatedCount = allRequests.filter((r) => r.validation_status === "validated").length;
  const rejectedCount = allRequests.filter((r) => r.validation_status === "rejected").length;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Validation des Requêtes</h1>
          <p className="text-muted-foreground">
            Vérifiez la conformité des documents et validez ou rejetez les requêtes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Total</p>
                <p className="text-4xl font-bold">{allRequests.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-5 w-5 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-muted-foreground mb-2">En attente</p>
                <p className="text-4xl font-bold text-orange-600">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground mb-2">Validées</p>
                <p className="text-4xl font-bold text-green-600">{validatedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-5 w-5 mx-auto mb-2 text-red-600" />
                <p className="text-sm text-muted-foreground mb-2">Rejetées</p>
                <p className="text-4xl font-bold text-red-600">{rejectedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        {pendingCount > 0 && (
          <Alert className="mb-8 border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              Vous avez {pendingCount} requête{pendingCount > 1 ? "s" : ""} en attente de validation.
              Vérifiez la conformité des documents avant de valider ou rejeter.
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {allRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-3">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">Aucune requête à valider</h3>
                <p className="text-muted-foreground">
                  Les requêtes soumises par les étudiants apparaîtront ici
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ValidationList requests={allRequests} />
        )}
      </div>
    </div>
  );
}
