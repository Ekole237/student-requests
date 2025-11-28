export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Student, Profile } from "@/lib/types";
import StudentList from "./components/student-list";
export interface StudentWithProfile extends Student {
  profile: Profile | null;
}

export default async function AdminStudentsPage() {
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

  // Fetch all students
  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select("*");

  if (studentsError) {
    console.error("Error fetching students:", studentsError);
    return <p>Error loading students.</p>;
  }

  // Fetch all profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("*");

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return <p>Error loading profiles.</p>;
  }

  const studentsWithProfiles: StudentWithProfile[] = studentsData.map((student) => {
    const profile = profilesData?.find((profile) => profile.id === student.user_id) || null;
    return {
      ...student,
      profile,
    };
  });

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <h1 className="text-2xl font-bold">Gestion des Étudiants</h1>
      <StudentList students={studentsWithProfiles} />
    </div>
  );
}
