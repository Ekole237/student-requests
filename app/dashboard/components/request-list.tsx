"use client";

import { useState } from "react";
import type { Requete } from "@/lib/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import ViewRequestModal from "./view-request-modal";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { InboxIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RequestListProps {
  requetes: Requete[];
}

export default function RequestList({ requetes }: RequestListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const onViewRequest = (request: Requete) => {
    setSelectedRequestId(request.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequestId(null);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mes Requêtes</h1>
        <Button asChild>
          <Link href="/requests/new">Nouvelle Requête</Link>
        </Button>
      </div>

      {requetes.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant={'icon'}>
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No requests yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any requests. Click the button above to create one.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DataTable columns={columns(onViewRequest)} data={requetes as Requete[]} />
      )}

      <ViewRequestModal
        requestId={selectedRequestId}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
