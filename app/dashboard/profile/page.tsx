import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail } from "lucide-react";
import { getUser } from "@/lib/auth";
import type { User as AuthUser } from "@/lib/backend-types";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUser() as AuthUser | null;

  if (!user) {
    redirect("/auth/login");
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
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {user.role.name === "etudiant" && "👨‍🎓 Étudiant"}
                    {user.role.name === "enseignant" && "👨‍🏫 Enseignant"}
                    {user.role.name === "admin" && "👤 Administrateur"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
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
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matricule</p>
                <p className="text-sm font-semibold">{user.matricule}</p>
              </div>
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
                  <p className="text-sm font-medium text-muted-foreground">Rôle</p>
                  <Badge variant="outline" className="capitalize">
                    {user.role.name}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <Badge variant="default">
                    ✓ Actif
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
