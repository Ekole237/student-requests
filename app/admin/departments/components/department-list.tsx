"use client";

import { useState } from "react";
import { columns } from "./columns";
import { DataTable } from "@/app/dashboard/components/data-table"; // Reusing the DataTable
import { DepartmentWithHead } from "../page";
import CreateEditDepartmentModal from "./create-edit-department-modal";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DepartmentListProps {
  departments: DepartmentWithHead[];
}

export default function DepartmentList({ departments }: DepartmentListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentWithHead | null>(null);

  const onCreateDepartment = () => {
    setSelectedDepartment(null); // Clear selection for create mode
    setIsModalOpen(true);
  };

  const onEditDepartment = (department: DepartmentWithHead) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const onDeleteDepartment = async (departmentId: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      const supabase = createClient();
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", departmentId);

      if (error) {
        console.error("Error deleting department:", error);
        alert("Error deleting department: " + error.message);
      } else {
        router.refresh(); // Re-fetch data
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDepartment(null);
  };

  const onUpdateSuccess = () => {
    router.refresh(); // Re-fetch data on update success
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="flex justify-end">
        <Button onClick={onCreateDepartment}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Nouveau Département
        </Button>
      </div>
      <DataTable
        columns={columns(onEditDepartment, onDeleteDepartment)}
        data={departments}
        enableFilter={true}
        filterColumnId="name" // Filter by department name
      />

      <CreateEditDepartmentModal
        department={selectedDepartment}
        isOpen={isModalOpen}
        onClose={closeModal}
        onUpdateSuccess={onUpdateSuccess}
      />
    </div>
  );
}
