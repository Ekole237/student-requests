"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DepartmentWithHead, Profile } from "../page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateEditDepartmentModalProps {
  department: DepartmentWithHead | null; // Null for create mode
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function CreateEditDepartmentModal({
  department,
  isOpen,
  onClose,
  onUpdateSuccess,
}: CreateEditDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    head_id: "",
  });
  const [availableHeads, setAvailableHeads] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Populate form if editing an existing department
    if (department) {
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || "",
        head_id: department.head_id || "none_id", // Initialize to "none_id" if null
      });
    } else {
      // Clear form for create mode
      setFormData({
        name: "",
        code: "",
        description: "",
        head_id: "none_id", // Initialize to "none_id" for new departments
      });
    }
    setError(null);
  }, [department]);

  useEffect(() => {
    // Fetch profiles that could be department heads
    async function fetchHeads() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name");
      if (error) {
        console.error("Error fetching potential heads:", error);
      } else {
        setAvailableHeads(data as Profile[]);
      }
    }
    fetchHeads();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "none_id" ? "" : value })); // Convert "none_id" to empty string for backend
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const headIdToSend = formData.head_id === "none_id" ? null : formData.head_id; // Ensure null is sent to DB

      if (department) {
        // Update existing department
        const { error: updateError } = await supabase
          .from("departments")
          .update({
            name: formData.name,
            code: formData.code,
            description: formData.description,
            head_id: headIdToSend,
          })
          .eq("id", department.id);

        if (updateError) throw updateError;
      } else {
        // Create new department
        const { error: createError } = await supabase.from("departments").insert({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          head_id: headIdToSend,
        });

        if (createError) throw createError;
      }

      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error saving department:", err);
      setError(err.message || "An error occurred during save.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {department ? "Edit Department" : "Create New Department"}
          </DialogTitle>
          <DialogDescription>
            {department
              ? "Make changes to the department here."
              : "Add a new department to your system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="head_id">Department Head</Label>
            <Select
              name="head_id"
              value={formData.head_id}
              onValueChange={(value) => handleSelectChange("head_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a head (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none_id">None</SelectItem>
                {availableHeads.map((head) => (
                  <SelectItem key={head.id} value={head.id}>
                    {head.first_name} {head.last_name} ({head.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : department
              ? "Save Changes"
              : "Create Department"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
