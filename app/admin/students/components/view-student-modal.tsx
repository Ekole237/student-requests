"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentWithProfile } from "../page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ViewStudentModalProps {
  student: StudentWithProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void; // Callback after successful update
}

export default function ViewStudentModal({
  student,
  isOpen,
  onClose,
  onUpdateSuccess,
}: ViewStudentModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    matricule: "",
    promotion: "",
    filiere: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.profile?.first_name || "",
        last_name: student.profile?.last_name || "",
        email: student.profile?.email || "",
        phone: student.profile?.phone || "",
        matricule: student.matricule || "",
        promotion: student.promotion || "",
        filiere: student.filiere || "",
      });
      setError(null);
    }
  }, [student]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsLoading(true);
    setError(null);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          // email is not directly updatable via profiles table in RLS context
        })
        .eq("id", student.user_id);

      if (profileError) throw profileError;

      // Update student academic info
      const { error: studentError } = await supabase
        .from("students")
        .update({
          matricule: formData.matricule,
          promotion: formData.promotion,
          filiere: formData.filiere,
        })
        .eq("user_id", student.user_id);

      if (studentError) throw studentError;

      onUpdateSuccess(); // Trigger parent to re-fetch data
      onClose();
    } catch (err: unknown) {
      console.error("Error updating student:", err);
      setError((err as Error).message || "An error occurred during update.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!student || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {student.profile?.first_name} {student.profile?.last_name}
          </DialogTitle>
          <DialogDescription>
            Manage student profile and academic details.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Email:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {student.profile?.email}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Phone:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {student.profile?.phone || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Matricule:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {student.matricule}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Promotion:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {student.promotion}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Filière:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {student.filiere}
                </span>
              </div>
              {student.date_naissance && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium leading-none text-right">
                    Date de naissance:
                  </span>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {format(new Date(student.date_naissance), "PPP")}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Created At:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {format(new Date(student.created_at), "PPP p")}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium leading-none text-right">
                  Last Updated:
                </span>
                <span className="col-span-3 text-sm text-muted-foreground">
                  {format(new Date(student.updated_at), "PPP p")}
                </span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="edit">
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="matricule">Matricule</Label>
                <Input
                  id="matricule"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="promotion">Promotion</Label>
                <Input
                  id="promotion"
                  name="promotion"
                  value={formData.promotion}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="filiere">Filière</Label>
                <Input
                  id="filiere"
                  name="filiere"
                  value={formData.filiere}
                  onChange={handleInputChange}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Student"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
