import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, FileText, HelpCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Bienvenue</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Gérez vos requêtes académiques facilement
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mes Requêtes
            </CardTitle>
            <CardDescription>Consultez l'historique de vos demandes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/requests">Voir mes requêtes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nouvelle Requête
            </CardTitle>
            <CardDescription>Créer une nouvelle demande académique</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/requests/new">Soumettre une requête</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Comment ça marche?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-sm">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Soumettre une requête</h3>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur "Nouvelle Requête" pour créer une demande académique
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-sm">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Validation administrative</h3>
                <p className="text-sm text-muted-foreground">
                  Votre requête est validée par l'administration pour conformité
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-sm">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Routage et traitement</h3>
                <p className="text-sm text-muted-foreground">
                  Votre requête est acheminée au département responsable
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-sm">
                  4
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Résolution</h3>
                <p className="text-sm text-muted-foreground">
                  Vous recevez la réponse à votre requête
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertCircle className="h-5 w-5" />
            Conseils utiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
          <p>• Remplissez tous les champs obligatoires avec soin</p>
          <p>• Joignez les documents justificatifs nécessaires</p>
          <p>• Consultez régulièrement l'état de vos requêtes</p>
          <p>• Contactez l'administration si une requête ne progresse pas</p>
        </CardContent>
      </Card>
    </div>
  );
}
