import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { Requete } from "@/lib/types";

interface Student {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  matricule: string;
  department_code: string | null;
}

interface InfoCardProps {
  request: Requete;
  student: Student | null;
}

export default function InfoCard({ request, student }: InfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {student && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Étudiant</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Nom</p>
                <p className="text-sm font-semibold">
                  {student.first_name} {student.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Matricule</p>
                <p className="text-sm font-mono">{student.matricule}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-semibold break-words">{student.email}</p>
              </div>
              {student.department_code && (
                <div>
                  <p className="text-xs text-muted-foreground">Département</p>
                  <p className="text-sm font-semibold">{student.department_code}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Type</p>
          <Badge>{request.request_type}</Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Priorité</p>
          <Badge variant="outline">{request.priority}</Badge>
        </div>
        {request.grade_type && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Type de Note</p>
            <Badge variant="outline">{request.grade_type}</Badge>
          </div>
        )}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Soumise le</p>
          <p className="text-sm font-medium">
            {new Date(request.created_at).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        
      </CardContent>
    </Card>
  );
}
