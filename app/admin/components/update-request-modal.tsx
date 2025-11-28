"use client";

import { useState, useEffect } from "react";
import type { Requete, RequestStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AuditLogList from "./audit-log-list";

interface UpdateRequestModalProps {
  request: Requete | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function UpdateRequestModal({
  request,
  isOpen,
  onClose,
  onUpdateSuccess,
}: UpdateRequestModalProps) {
  const [status, setStatus] = useState<RequestStatus | "">("");
  const [adminComment, setAdminComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setAdminComment(request.admin_comment || "");
    }
  }, [request]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!request) return;

    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("requetes")
        .update({
          status: status as RequestStatus,
          admin_comment: adminComment,
        })
        .eq("id", request.id);

      if (error) throw error;

      onUpdateSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Request: {request.title}</DialogTitle>
          <DialogDescription>
            Modify the status and add comments for this request.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="update">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="update">Update</TabsTrigger>
            <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="update">
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: RequestStatus) => setStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adminComment">Admin Comment</Label>
                <Textarea
                  id="adminComment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Add your comments here..."
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Request"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="audit-log">
            <AuditLogList requestId={request.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
