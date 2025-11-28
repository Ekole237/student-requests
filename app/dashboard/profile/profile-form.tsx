"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Student } from "@/lib/types";

interface ProfileFormProps {
  initialStudentData: Student | null;
  userId: string;
}

export default function ProfileForm({
  initialStudentData,
  userId,
}: ProfileFormProps) {
  const router = useRouter();
  const [matricule, setMatricule] = useState(initialStudentData?.matricule || "");
  const [promotion, setPromotion] = useState(initialStudentData?.promotion || "");
  const [filiere, setFiliere] = useState(initialStudentData?.filiere || "");
  const [dateNaissance, setDateNaissance] = useState(
    initialStudentData?.date_naissance || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMatricule(initialStudentData?.matricule || "");
    setPromotion(initialStudentData?.promotion || "");
    setFiliere(initialStudentData?.filiere || "");
    setDateNaissance(initialStudentData?.date_naissance || "");
  }, [initialStudentData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    try {
      if (initialStudentData) {
        // Update existing student profile
        const { error } = await supabase
          .from("students")
          .update({
            matricule,
            promotion,
            filiere,
            date_naissance: dateNaissance,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) throw error;
        setSuccess("Student profile updated successfully!");
      } else {
        // Create new student profile
        const { error } = await supabase.from("students").insert({
          user_id: userId,
          matricule,
          promotion,
          filiere,
          date_naissance: dateNaissance,
        });

        if (error) throw error;
        setSuccess("Student profile created successfully!");
      }
      router.refresh();
    } catch (err: unknown) {
      console.error("Error saving student profile:", err);
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-lg">
      <div className="grid gap-2">
        <Label htmlFor="matricule">Matricule</Label>
        <Input
          id="matricule"
          type="text"
          value={matricule}
          onChange={(e) => setMatricule(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="promotion">Promotion</Label>
        <Input
          id="promotion"
          type="text"
          value={promotion}
          onChange={(e) => setPromotion(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="filiere">Filière</Label>
        <Input
          id="filiere"
          type="text"
          value={filiere}
          onChange={(e) => setFiliere(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dateNaissance">Date de Naissance</Label>
        <Input
          id="dateNaissance"
          type="date"
          value={dateNaissance}
          onChange={(e) => setDateNaissance(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading
          ? "Saving..."
          : initialStudentData
          ? "Update Student Profile"
          : "Create Student Profile"}
      </Button>
    </form>
  );
}
