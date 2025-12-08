import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
}

interface DocumentsTabProps {
  attachments: Attachment[];
}

export default function DocumentsTab({ attachments }: DocumentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Documents Fournis</CardTitle>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun document fourni</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <div>
                    <p className="font-semibold text-sm">{att.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(att.file_size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <a
                    href={att.file_path}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
