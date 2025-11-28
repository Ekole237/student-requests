import { createClient } from "@/lib/supabase/server";
import type { Requete } from "@/lib/types";
import RequestList from "./components/request-list";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: requetes, error } = await supabase
    .from("requetes")
    .select("*");

  if (error) {
    console.error("Error fetching requetes:", error);
    return <p>Error loading requests.</p>;
  }

  return <RequestList requetes={requetes as Requete[]} />;
}
