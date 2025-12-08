import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Requete } from "@/lib/types";

interface RequestDetailsCardProps {
  request: Requete;
}

export default function RequestDetailsCard({ request }: RequestDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Détails de la Requête</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Titre</Label>
          <p className="font-semibold">{request.title}</p>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Description</Label>
          <p className="text-sm whitespace-pre-wrap">{request.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">Étudiant</Label>
            <p className="font-semibold text-sm">{request.created_by}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-1 block">Département</Label>
            <p className="font-semibold text-sm">{request.department_code}</p>
          </div>
        </div>
        {request.routed_to && (
          <div className="pt-4 border-t bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <Label className="text-sm text-muted-foreground mb-1 block">Routée vers</Label>
            <p className="font-semibold text-sm">
              {request.routed_to_role === "teacher" ? "Enseignant" : "Responsable Pédagogique"}
            </p>
            <p className="text-xs text-muted-foreground">{request.routed_to}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
