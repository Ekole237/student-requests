"use client";

import { useState } from "react";
import { columns } from "./columns";
import { DataTable } from "@/app/dashboard/components/data-table"; // Reusing the DataTable
import { StudentWithProfile } from "../page";
import ViewStudentModal from "./view-student-modal";
import { useRouter } from "next/navigation";

interface StudentListProps {
  students: StudentWithProfile[];
}

export default function StudentList({ students }: StudentListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProfile | null>(null);

  const onViewStudent = (student: StudentWithProfile) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const onUpdateSuccess = () => {
    router.refresh(); // Re-fetch data on update success
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <DataTable
        columns={columns(onViewStudent)}
        data={students}
        enableFilter={true}
        filterColumnId="profile.first_name" // Filter by first name
      />

      <ViewStudentModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={closeModal}
        onUpdateSuccess={onUpdateSuccess}
      />
    </div>
  );
}
