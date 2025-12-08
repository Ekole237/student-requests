import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Requete } from "@/lib/types";

interface HistoryTabProps {
  request: Requete;
}

export default function HistoryTab({ request }: HistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div className="w-0.5 h-8 bg-gray-200" />
            </div>
            <div>
              <p className="font-semibold text-sm">Requête soumise</p>
              <p className="text-xs text-muted-foreground">
                {new Date(request.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
          {request.validated_at && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                {request.resolved_at && <div className="w-0.5 h-8 bg-gray-200" />}
              </div>
              <div>
                <p className="font-semibold text-sm">Requête validée</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.validated_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
