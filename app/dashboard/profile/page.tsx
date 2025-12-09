import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building2, Key } from "lucide-react";
import { getUser } from "@/lib/auth";
import type { User as AuthUser } from "@/lib/backend-types";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUser() as AuthUser | null;

  if (!user) {
    redirect("/auth/login");
  }

  const getRoleLabel = (roleName: string) => {
    const roleMap: Record<string, { label: string; emoji: string }> = {
      etudiant: { label: 'Étudiant', emoji: '👨‍🎓' },
      enseignant: { label: 'Enseignant', emoji: '👨‍🏫' },
      responsable_pedagogique: { label: 'Responsable Pédagogique', emoji: '📊' },
      admin: { label: 'Administrateur', emoji: '👤' },
    };
    return roleMap[roleName] || { label: roleName, emoji: '👤' };
  };

  const role = getRoleLabel(user.role.name);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mon Profil</h1>
          <p className="text-muted-foreground">
            Consultez et gérez vos informations personnelles
          </p>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-bold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {role.emoji} {role.label}
                  </Badge>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "✓ Actif" : "✗ Inactif"}
                  </Badge>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Matricule</p>
                <p className="font-mono text-lg font-semibold text-foreground">{user.matricule}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>
                Vos données de base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prénom</p>
                <p className="text-sm font-semibold">{user.firstName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nom</p>
                <p className="text-sm font-semibold">{user.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matricule</p>
                <p className="text-sm font-mono font-semibold">{user.matricule}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-semibold">{user.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact
              </CardTitle>
              <CardDescription>
                Coordonnées de contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Principal</p>
                <p className="text-sm font-semibold break-all">{user.email}</p>
              </div>
              {user.personalEmail && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email Personnel</p>
                  <p className="text-sm font-semibold break-all">{user.personalEmail}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-semibold">{user.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Statut du Compte
              </CardTitle>
              <CardDescription>
                État de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rôle</p>
                <Badge variant="outline" className="capitalize">
                  {role.emoji} {role.label}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut</p>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "✓ Actif" : "✗ Inactif"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Authentification 2FA</p>
                <Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>
                  {user.twoFactorEnabled ? "✓ Activée" : "✗ Désactivée"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Academic/Department Information */}
          {(user.departement || user.promotion) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Affiliation Académique
                </CardTitle>
                <CardDescription>
                  Département et promotion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.departement && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Département</p>
                    <Badge variant="secondary">
                      {user.departement.name}
                    </Badge>
                  </div>
                )}
                {user.promotion && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Promotion</p>
                    <Badge variant="outline">
                      {user.promotion.code} - Niveau {user.promotion.niveau}
                      {user.promotion.isTroncCommun && ' (TCO)'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>


      </div>
    </div>
  );
}
