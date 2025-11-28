"use client";

import { useState } from "react";
import type { Requete } from "@/lib/types";
import { columns } from "./columns";
import { DataTable } from "../../dashboard/components/data-table"; // Reusing the DataTable from dashboard
import ViewRequestModal from "../../dashboard/components/view-request-modal"; // Reusing the ViewRequestModal from dashboard
import UpdateRequestModal from "./update-request-modal";
import { useRouter } from "next/navigation";

interface AdminRequestListProps {
  requetes: Requete[];
}

export default function AdminRequestList({ requetes }: AdminRequestListProps) {
  const router = useRouter();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const onViewRequest = (request: Requete) => {
    setSelectedRequestId(request.id);
    setIsViewModalOpen(true);
  };

  const onUpdateRequest = (request: Requete) => {
    setSelectedRequestId(request.id);
    setIsUpdateModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRequestId(null);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedRequestId(null);
  };

  const onUpdateSuccess = () => {
    router.refresh(); // Re-fetch data on update success
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <DataTable
        columns={columns(onViewRequest, onUpdateRequest)}
        data={requetes as Requete[]}
        enableFilter={true}
        filterColumnId="title"
      />

      <ViewRequestModal
        requestId={selectedRequestId}
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
      />

      <UpdateRequestModal
        request={requetes.find(r => r.id === selectedRequestId) || null}
        isOpen={isUpdateModalOpen}
        onClose={closeUpdateModal}
        onUpdateSuccess={onUpdateSuccess}
      />
    </div>
  );
}
