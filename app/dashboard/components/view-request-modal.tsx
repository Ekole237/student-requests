"use client";

import { Requete } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ViewRequestModalProps {
  request: Requete | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewRequestModal({
  request,
  isOpen,
  onClose,
}: ViewRequestModalProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{request.title}</DialogTitle>
          <DialogDescription>
            Type: {request.type.replace(/_/g, " ")}
          </DialogDescription>
        </DialogHeader>
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
              Status:
            </span>
            <span className="col-span-3 text-sm text-muted-foreground">
              {request.status}
            </span>
          </div>
          {request.assigned_to && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium leading-none text-right">
                Assigned To:
              </span>
              <span className="col-span-3 text-sm text-muted-foreground">
                {request.assigned_to}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-sm font-medium leading-none text-right">
              Last Updated:
            </span>
            <span className="col-span-3 text-sm text-muted-foreground">
              {new Date(request.updated_at).toLocaleString()}
            </span>
          </div>
          {request.attachment_url && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium leading-none text-right">
                Attachment:
              </span>
              <a
                href={request.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-3 text-sm text-blue-500 hover:underline"
              >
                View Attachment
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
