import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Student, Teacher, Profile } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, Mail, Phone, MapPin } from "lucide-react";

import ProfileDetailsForm from "./profile-details-form";
import ProfileForm from "./profile-form";
import TeacherProfileForm from "./teacher-profile-form";

// Force dynamic rendering to prevent pre-rendering issues with Supabase
export const dynamic = 'force-dynamic';

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
  const isTeacher = roles.includes("teacher");

  let studentProfile: Student | null = null;
  if (isStudent) {
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (studentError && studentError.code !== 'PGRST116') {
      console.error("Error fetching student profile:", studentError);
      return <p>Error loading student profile.</p>;
    }
    studentProfile = studentData;
  }

  let teacherProfile: Teacher | null = null;
  if (isTeacher) {
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (teacherError && teacherError.code !== 'PGRST116') {
      console.error("Error fetching teacher profile:", teacherError);
      return <p>Error loading teacher profile.</p>;
    }
    teacherProfile = teacherData;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et préférences
          </p>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {profileData.first_name} {profileData.last_name}
                  </h2>
                  <p className="text-muted-foreground text-sm">{profileData.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <Badge key={role} variant="secondary" className="capitalize">
                      {role === "student" && "👨‍🎓 Étudiant"}
                      {role === "teacher" && "👨‍🏫 Enseignant"}
                      {role === "admin" && "👤 Administrateur"}
                      {role === "department_head" && "📊 Responsable Pédagogique"}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Compte créé le</p>
                <p className="font-medium">
                  {new Date(profileData.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Général</span>
            </TabsTrigger>
            {isStudent && (
              <TabsTrigger value="student" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Études</span>
              </TabsTrigger>
            )}
            {isTeacher && (
              <TabsTrigger value="teacher" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Enseignement</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* General Information Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Informations de Contact
                  </CardTitle>
                  <CardDescription>
                    Vos coordonnées de contact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileDetailsForm initialProfileData={profileData} />
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations du Compte
                  </CardTitle>
                  <CardDescription>
                    Détails de votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm font-semibold">{profileData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Date de création
                      </p>
                      <p className="text-sm font-semibold">
                        {new Date(profileData.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Dernière mise à jour
                      </p>
                      <p className="text-sm font-semibold">
                        {new Date(profileData.updated_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Statut</p>
                      <Badge variant={profileData.is_active ? "default" : "destructive"}>
                        {profileData.is_active ? "✓ Actif" : "✗ Inactif"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Student Information Tab */}
          {isStudent && (
            <TabsContent value="student" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Academic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Informations Académiques
                    </CardTitle>
                    <CardDescription>
                      Détails de votre scolarité
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentProfile ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Matricule
                          </p>
                          <p className="text-sm font-semibold">{studentProfile.matricule}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Promotion
                          </p>
                          <Badge variant="outline">{studentProfile.promotion}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Filière
                          </p>
                          <Badge variant="outline">{studentProfile.filiere}</Badge>
                        </div>
                        {studentProfile.date_naissance && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Date de naissance
                            </p>
                            <p className="text-sm font-semibold">
                              {new Date(studentProfile.date_naissance).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Informations académiques non disponibles
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Edit Student Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Modifier Profil Académique
                    </CardTitle>
                    <CardDescription>
                      Mettez à jour vos informations académiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProfileForm
                      initialStudentData={studentProfile}
                      userId={user.id}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Teacher Information Tab */}
          {isTeacher && (
            <TabsContent value="teacher" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Teaching Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Informations Pédagogiques
                    </CardTitle>
                    <CardDescription>
                      Détails de votre enseignement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teacherProfile ? (
                      <div className="space-y-3">
                        {teacherProfile.specialization && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Spécialisation
                            </p>
                            <Badge variant="outline">
                              {teacherProfile.specialization}
                            </Badge>
                          </div>
                        )}
                        {teacherProfile.office_number && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Numéro de Bureau
                            </p>
                            <p className="text-sm font-semibold">
                              {teacherProfile.office_number}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Compte créé
                          </p>
                          <p className="text-sm font-semibold">
                            {new Date(teacherProfile.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Informations pédagogiques non disponibles
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Edit Teacher Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-4" />
                      Modifier Profil Pédagogique
                    </CardTitle>
                    <CardDescription>
                      Mettez à jour vos informations pédagogiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TeacherProfileForm
                      initialTeacherData={teacherProfile}
                      userId={user.id}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
