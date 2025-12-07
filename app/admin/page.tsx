import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Requete } from "@/lib/types";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
import AdminRequestList from "./components/admin-request-list";

export default async function AdminDashboard() {
  const user = await getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Check role from ENSPD API
  if (user.role.name !== "admin" && user.role.name !== "Admin") {
    return redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: requetes, error } = await supabase
    .from("requetes")
    .select("*");

  if (error) {
    console.error("Error fetching requetes for admin:", error);
    return <p>Error loading requests.</p>;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <h1 className="text-2xl font-bold">Administration des Requêtes</h1>
      <AdminRequestList requetes={requetes as Requete[]} />
    </div>
  );
}
