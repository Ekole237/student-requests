import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Student, Teacher, UserRole } from "@/lib/types"; // Import Teacher type
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ProfileForm from "./profile-form";
import ProfileDetailsForm from "./profile-details-form"; // Import the new component
import TeacherProfileForm from "./teacher-profile-form"; // Import TeacherProfileForm

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error("Error fetching profile:", profileError);
    // Handle error, maybe display a generic profile page or redirect
    return <p>Error loading profile.</p>;
  }

  const { data: userRolesData, error: userRolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (userRolesError) {
    console.error("Error fetching user roles:", userRolesError);
    return <p>Error loading user roles.</p>;
  }

  const roles = userRolesData?.map((ur) => ur.role) || [];
  const isStudent = roles.includes("student");
  const isTeacher = roles.includes("teacher"); // Check for teacher role

  let studentProfile: Student | null = null;
  if (isStudent) {
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (studentError && studentError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching student profile:", studentError);
      return <p>Error loading student profile.</p>;
    }
    studentProfile = studentData;
  }

  let teacherProfile: Teacher | null = null; // Initialize teacher profile
  if (isTeacher) {
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (teacherError && teacherError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching teacher profile:", teacherError);
      return <p>Error loading teacher profile.</p>;
    }
    teacherProfile = teacherData;
  }

  return (
    <div className="flex-1 p-4 md:p-8 mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1> {/* Changed title to My Profile */}

      <ProfileDetailsForm initialProfileData={profileData} /> {/* New component */}

      {isStudent && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Student Information</h2>
          <ProfileForm initialStudentData={studentProfile} userId={user.id} />
        </div>
      )}

      {isTeacher && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Teacher Information</h2>
          <TeacherProfileForm initialTeacherData={teacherProfile} userId={user.id} />
        </div>
      )}
    </div>
  );
}
