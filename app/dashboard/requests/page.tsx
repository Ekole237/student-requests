import { createClient } from "@/lib/supabase/server";
import type { Requete } from "@/lib/types";
import RequestsDataTable from "../components/requests-data-table";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { data: requetes, error } = await supabase
    .from("requetes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching requetes:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes Requêtes</h1>
        </div>
        <div className="border rounded-lg p-6 bg-red-50">
          <p className="text-red-800">
            Erreur lors du chargement: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Requêtes</h1>
          <p className="text-muted-foreground">
            Gérez et suivez vos requêtes académiques
          </p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <FileText className="mr-2 h-4 w-4" />
            Nouvelle requête
          </Link>
        </Button>
      </div>

      <RequestsDataTable requetes={requetes as Requete[]} />
    </div>
  );
}
