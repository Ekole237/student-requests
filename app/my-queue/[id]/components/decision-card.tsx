import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface DecisionCardProps {
  decision: "approve" | "reject" | null;
  comment: string;
  processing: boolean;
  onDecisionChange: (decision: "approve" | "reject" | null) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}

export default function DecisionCard({
  decision,
  comment,
  processing,
  onDecisionChange,
  onCommentChange,
  onSubmit,
}: DecisionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prendre une Décision</CardTitle>
        <CardDescription>Approuver ou rejeter la requête</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button
            variant={decision === "approve" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onDecisionChange("approve")}
          >
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
            Approuver
          </Button>
          <Button
            variant={decision === "reject" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onDecisionChange("reject")}
          >
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            Rejeter
          </Button>
        </div>

        {decision && (
          <div className="pt-4 border-t">
            <Label htmlFor="comment" className="text-sm font-semibold mb-2 block">
              Commentaire {decision === "reject" ? "(obligatoire)" : "(optionnel)"}
            </Label>
            <Textarea
              id="comment"
              placeholder={
                decision === "reject"
                  ? "Expliquez pourquoi vous rejetez cette requête..."
                  : "Ajoutez un commentaire optionnel..."
              }
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="mb-4"
              rows={4}
            />
            <Button
              className="w-full"
              disabled={
                processing ||
                (decision === "reject" && !comment.trim())
              }
              onClick={onSubmit}
            >
              {processing ? "Traitement..." : "Valider la Décision"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
