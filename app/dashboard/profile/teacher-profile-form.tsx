"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Teacher } from "@/lib/types";

interface TeacherProfileFormProps {
  initialTeacherData: Teacher | null;
  userId: string;
}

export default function TeacherProfileForm({
  initialTeacherData,
  userId,
}: TeacherProfileFormProps) {
  const router = useRouter();
  const [specialization, setSpecialization] = useState(initialTeacherData?.specialization || "");
  const [officeNumber, setOfficeNumber] = useState(initialTeacherData?.office_number || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSpecialization(initialTeacherData?.specialization || "");
    setOfficeNumber(initialTeacherData?.office_number || "");
  }, [initialTeacherData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    try {
      if (initialTeacherData) {
        // Update existing teacher profile
        const { error } = await supabase
          .from("teachers")
          .update({
            specialization,
            office_number: officeNumber,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) throw error;
        setSuccess("Teacher profile updated successfully!");
      } else {
        // Create new teacher profile
        const { error } = await supabase.from("teachers").insert({
          user_id: userId,
          specialization,
          office_number: officeNumber,
        });

        if (error) throw error;
        setSuccess("Teacher profile created successfully!");
      }
      router.refresh(); // Re-fetch server-side props
    } catch (err: any) {
      console.error("Error saving teacher profile:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-lg">
      <div className="grid gap-2">
        <Label htmlFor="specialization">Specialization</Label>
        <Input
          id="specialization"
          type="text"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="officeNumber">Office Number</Label>
        <Input
          id="officeNumber"
          type="text"
          value={officeNumber}
          onChange={(e) => setOfficeNumber(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading
          ? "Saving..."
          : initialTeacherData
          ? "Update Teacher Profile"
          : "Create Teacher Profile"}
      </Button>
    </form>
  );
}
