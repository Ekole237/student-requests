import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Requete } from "@/lib/types";
import AdminRequestList from "./components/admin-request-list";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (roleError || !isAdmin) {
    return redirect("/dashboard");
  }

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
