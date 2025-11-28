"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequestType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewRequest() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to create a request.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("requetes").insert([
        {
          student_id: user.id,
          type: formData.get("type") as RequestType,
          title: formData.get("title") as string,
          description: formData.get("description") as string,
        },
      ]);

      if (error) throw error;

      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Nouvelle Requête</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Titre</Label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="type">Type de Requête</Label>
          <Select name="type" required>
            <SelectTrigger>
              <SelectValue placeholder="Select a request type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade_inquiry">Demande de note</SelectItem>
              <SelectItem value="absence_justification">
                Justification d&apos;absence
              </SelectItem>
              <SelectItem value="certificate_request">
                Demande de certificat
              </SelectItem>
              <SelectItem value="grade_correction">
                Correction de note
              </SelectItem>
              <SelectItem value="schedule_change">
                Changement d&apos;horaire
              </SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" required />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Envoi en cours..." : "Soumettre la Requête"}
        </Button>
      </form>
    </div>
  );
}
