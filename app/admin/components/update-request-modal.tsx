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
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function UpdateRequestModal({
  requestId,
  isOpen,
  onClose,
  onUpdateSuccess,
}: UpdateRequestModalProps) {
  const [request, setRequest] = useState<Requete | null>(null);
  const [status, setStatus] = useState<RequestStatus | "">("");
  const [priority, setPriority] = useState<Requete['priority'] | "">(""); // Added
  const [assignedTo, setAssignedTo] = useState<string | null>(null); // Added
  const [adminComment, setAdminComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [possibleAssignees, setPossibleAssignees] = useState<{ id: string; first_name: string; last_name: string }[]>([]); // Added


  useEffect(() => {
    async function fetchRequestDetails() {
      if (!requestId) return;

      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("requetes")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error) {
        console.error("Error fetching request for update:", error);
        setError(error.message);
        setRequest(null);
      } else {
        setRequest(data as Requete);
        setStatus(data.status);
        setAdminComment(data.admin_comment || "");
        setPriority(data.priority || "");
        setAssignedTo(data.assigned_to || null);
      }
      setIsLoading(false);
    }

    fetchRequestDetails();
  }, [requestId]);

  // Effect to fetch possible assignees
  useEffect(() => {
    async function fetchPossibleAssignees() {
      const supabase = createClient();
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (userRolesError) {
        console.error("Error fetching user roles:", userRolesError);
        return;
      }

      const assignableRoles = ["admin", "department_head", "teacher"];
      const filteredAssignees = profilesData
        .filter(profile =>
          userRolesData.some(
            role => role.user_id === profile.id && assignableRoles.includes(role.role)
          )
        )
        .map(profile => ({
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
        }));
      setPossibleAssignees(filteredAssignees);
    }

    fetchPossibleAssignees();
  }, []); // Run once on component mount

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!request) return;

    setIsUpdating(true);
    setError(null);
    const supabase = createClient();

          try {
            const updatePayload: Partial<Requete> = {
              status: status as RequestStatus,
              priority: priority as Requete['priority'],
              assigned_to: assignedTo,
              processing_comment: adminComment,
            };
    
            // Set resolved_at and resolved_by if status becomes 'completed'
            if (status === "completed" && request.status !== "completed") {
              updatePayload.resolved_at = new Date().toISOString();
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              if (userError) throw userError;
              updatePayload.resolved_by = user?.id || null;
            } else if (status !== "completed" && request.status === "completed") {
              // Clear resolved_at and resolved_by if status changes from 'completed'
              updatePayload.resolved_at = null;
              updatePayload.resolved_by = null;
            }
    
            const { error } = await supabase
              .from("requetes")
              .update(updatePayload)
              .eq("id", request.id);
    
            if (error) throw error;
    
            onUpdateSuccess();
            onClose();
          } catch (error: unknown) {
            setError((error as Error).message);
          } finally {
            setIsUpdating(false);
          }  };

  if (!requestId || !isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Loading Request...</DialogTitle>
          </DialogHeader>
          <p>Loading request details for update. Please wait.</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p className="text-red-500">Error loading request: {error}</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Request: {request.title}</DialogTitle>
          <DialogDescription>
            Modify the status, priority, assignee, and add comments for this request.
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
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value: Requete['priority']) => setPriority(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={assignedTo || "unassigned_id"}
                  onValueChange={(value: string) => setAssignedTo(value === "unassigned_id" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned_id">Unassigned</SelectItem>
                    {possibleAssignees.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        {assignee.first_name} {assignee.last_name}
                      </SelectItem>
                    ))}
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
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Request"}
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
