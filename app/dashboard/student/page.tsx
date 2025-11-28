import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Clock, Plus } from "lucide-react";
import Link from "next/link";

import RequestsList from "./components/requests-list";

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // Check if student
  const { data: userRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError || !userRoles || !userRoles.some((ur) => ur.role === "student")) {
    redirect("/dashboard");
  }

  // Fetch student's requests
  const { data: requests, error: requestsError } = await supabase
    .from("requetes")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (requestsError) {
    console.error("Error fetching requests:", requestsError);
  }

  const allRequests = requests || [];

  // Calculate stats
  const submittedCount = allRequests.filter((r) => r.status === "submitted").length;
  const validatedCount = allRequests.filter((r) => r.status === "validated").length;
  const completedCount = allRequests.filter((r) => r.status === "completed").length;
  const rejectedCount = allRequests.filter((r) => r.status === "rejected").length;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mes Requêtes</h1>
              <p className="text-muted-foreground">
                Suivez l'état de vos requêtes en temps réel
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/requests/new">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle requête
              </Link>
            </Button>
          </div>
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

          <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-yellow-600" />
                <p className="text-sm text-muted-foreground mb-2">En attente</p>
                <p className="text-4xl font-bold text-yellow-600">
                  {submittedCount + validatedCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground mb-2">Approuvées</p>
                <p className="text-4xl font-bold text-green-600">{completedCount}</p>
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

        {/* Info Alert - Pending */}
        {submittedCount + validatedCount > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Requêtes en attente
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {submittedCount > 0 && (
                      <span>
                        {submittedCount} en attente de validation
                        {validatedCount > 0 && " et "}
                      </span>
                    )}
                    {validatedCount > 0 && (
                      <span>
                        {validatedCount} en cours de traitement
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requests List */}
        <RequestsList requests={allRequests} />
      </div>
    </div>
  );
}
