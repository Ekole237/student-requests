"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuditLog } from "@/lib/types"; // Assuming AuditLog type is defined in lib/types.ts
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditLogListProps {
  requestId: string;
}

export default function AuditLogList({ requestId }: AuditLogListProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching audit logs:", error);
        setError(error.message);
      } else {
        setLogs(data as AuditLog[]);
      }
      setIsLoading(false);
    };

    if (requestId) {
      fetchAuditLogs();
    }
  }, [requestId]);

  if (isLoading) {
    return <p>Loading audit logs...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (logs.length === 0) {
    return <p>No audit logs for this request.</p>;
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {log.action.replace(/_/g, " ")}{" "}
              <span className="text-sm text-gray-500">
                ({format(new Date(log.created_at), "PPP p")})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {log.user_id && (
              <p className="text-sm">
                By user: <span className="font-semibold">{log.user_id}</span>
              </p>
            )}
            {log.old_value !== null && (
              <p className="text-sm">
                Old Value: <span className="font-semibold">{JSON.stringify(log.old_value)}</span>
              </p>
            )}
            {log.new_value !== null && (
              <p className="text-sm">
                New Value: <span className="font-semibold">{JSON.stringify(log.new_value)}</span>
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
