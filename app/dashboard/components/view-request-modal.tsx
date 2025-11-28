"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RequeteComplete, Message, Attachment } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ViewRequestModalProps {
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewRequestModal({
  requestId,
  isOpen,
  onClose,
}: ViewRequestModalProps) {
  const [request, setRequest] = useState<RequeteComplete | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRequestData = async () => {
    if (!requestId) return;

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);

      const { data: requestData, error: requestError } = await supabase
        .from("requetes_complete")
        .select("*")
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData as RequeteComplete);

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData as Message[]);

      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("attachments")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData as Attachment[]);
    } catch (err: any) {
      console.error("Error fetching request data:", err);
      setError(err.message);
      setRequest(null);
      setMessages([]);
      setAttachments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestData();
  }, [requestId]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestId || !currentUser || newMessage.trim() === "") return;

    setIsSendingMessage(true);
    setError(null);

    try {
      const { error: messageError } = await supabase.from("messages").insert([
        {
          request_id: requestId,
          sender_id: currentUser,
          message: newMessage.trim(),
        },
      ]);

      if (messageError) throw messageError;

      setNewMessage("");
      fetchRequestData(); // Re-fetch to update messages list
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!requestId || !isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading Request...</DialogTitle>
          </DialogHeader>
          <p>Loading request details. Please wait.</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{request.title}</DialogTitle>
          <DialogDescription>
            Type:{" "}
            <span className="capitalize">
              {request.type.replace(/_/g, " ")}
            </span>{" "}
            | Status: {request.status} | Priority: {request.priority}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">
              Messages ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments ({attachments.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Description:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {request.description}
                </span>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Student:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {request.student_first_name} {request.student_last_name} (
                  {request.student_email})
                </span>
              </div>
              {request.matricule && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium leading-none text-right">
                    Matricule:
                  </span>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {request.matricule}
                  </span>
                </div>
              )}
              {request.promotion && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium leading-none text-right">
                    Promotion:
                  </span>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {request.promotion}
                  </span>
                </div>
              )}
              {request.filiere && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium leading-none text-right">
                    Filiere:
                  </span>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {request.filiere}
                  </span>
                </div>
              )}

              {request.assigned_first_name && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium leading-none text-right">
                    Assigned To:
                  </span>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {request.assigned_first_name} {request.assigned_last_name}{" "}
                    ({request.assigned_email})
                  </span>
                </div>
              )}
              {request.admin_comment && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium leading-none text-right">
                    Admin Comment:
                  </span>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {request.admin_comment}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Created At:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleString()}
                </span>
              </div>
              {request.resolved_at && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium leading-none text-right">
                    Resolved At:
                  </span>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {new Date(request.resolved_at).toLocaleString()}
                  </span>
                </div>
              )}
              {request.resolved_by && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium leading-none text-right">
                    Resolved By:
                  </span>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {request.resolved_by}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Last Updated:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {new Date(request.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="messages">
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {messages.length === 0 ? (
                <p>No messages for this request.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="border p-2 rounded-md">
                    <p className="text-sm font-semibold">
                      {message.sender_id === request.student_id ? "Student" : "Admin"} (
                      {format(new Date(message.created_at), "PPP p")})
                    </p>
                    <p className="text-sm text-gray-700">{message.message}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={2}
                disabled={isSendingMessage}
              />
              <Button type="submit" disabled={isSendingMessage}>
                {isSendingMessage ? "Sending..." : "Send"}
              </Button>
            </form>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </TabsContent>
          <TabsContent value="attachments">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {attachments.length === 0 ? (
                <p>No attachments for this request.</p>
              ) : (
                attachments.map((attachment) => (
                  <div key={attachment.id} className="border p-2 rounded-md">
                    <a
                      href={attachment.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {attachment.file_name}
                    </a>
                    <p className="text-xs text-gray-500">
                      Uploaded by: {attachment.uploaded_by} on{" "}
                      {format(new Date(attachment.created_at), "PPP p")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
