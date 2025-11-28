import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Department, Profile } from "@/lib/types";
import DepartmentList from "./components/department-list";

export interface DepartmentWithHead extends Department {
  head: Profile | null;
}

export default async function AdminDepartmentsPage() {
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

  // Fetch all departments
  const { data: departmentsData, error: departmentsError } = await supabase
    .from("departments")
    .select("*");

  if (departmentsError) {
    console.error("Error fetching departments:", departmentsError);
    return <p>Error loading departments.</p>;
  }

  // Fetch all profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("*");

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return <p>Error loading profiles.</p>;
  }

  const departmentsWithHeads: DepartmentWithHead[] = departmentsData.map((dept) => {
    const headProfile = profilesData?.find((profile) => profile.id === dept.head_id) || null;
    return {
      ...dept,
      head: headProfile,
    };
  });

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <h1 className="text-2xl font-bold">Gestion des Départements</h1>
      <DepartmentList departments={departmentsWithHeads} />
    </div>
  );
}
