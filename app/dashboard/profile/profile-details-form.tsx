"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";

interface ProfileDetailsFormProps {
  initialProfileData: Profile;
}

export default function ProfileDetailsForm({
  initialProfileData,
}: ProfileDetailsFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialProfileData.first_name || "");
  const [lastName, setLastName] = useState(initialProfileData.last_name || "");
  const [phone, setPhone] = useState(initialProfileData.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(initialProfileData.first_name || "");
    setLastName(initialProfileData.last_name || "");
    setPhone(initialProfileData.phone || "");
  }, [initialProfileData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialProfileData.id);

      if (error) throw error;
      setSuccess("Profile updated successfully!");
      router.refresh(); // Re-fetch server-side props
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-lg">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={initialProfileData.email} disabled />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Update Profile"}
      </Button>
    </form>
  );
}
