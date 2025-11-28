"use client";

import { useState } from "react";
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
import { RequestType, RequestTypeEnum } from "@/lib/types";
import { useRouter } from "next/navigation";
import {  UploadIcon, XIcon } from "lucide-react";
import { z } from "zod";

// Zod schema for file validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileSchema = z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, {
  message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
}).refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
  message: `File type not supported. Allowed types: PDF, JPG, PNG, DOC, DOCX.`,
});

export default function NewRequest() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    type: "" as RequestTypeEnum,
    title: "",
    description: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      selectedFiles.forEach((file) => {
        const result = fileSchema.safeParse(file);
        if (result.success) {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name}: ${result.error.errors[0].message}`);
        }
      });

      if (invalidFiles.length > 0) {
        setError(invalidFiles.join("; "));
      } else {
        setError(null);
      }
      setFiles(validFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      // 2. Create the request
      const { data: request, error: requestError } = await supabase
        .from("requetes")
        .insert({
          student_id: user.id,
          type: formData.type,
          title: formData.title,
          description: formData.description,
          status: "pending",
          priority: "normal", // Default priority
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 3. Upload attachments (if any)
      if (files.length > 0) {
        for (const file of files) {
          const fileName = `${Date.now()}_${file.name}`;
          const filePath = `${user.id}/${request.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("request-attachments") // Ensure this bucket exists in Supabase Storage
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: attachmentError } = await supabase
            .from("attachments")
            .insert({
              request_id: request.id,
              file_name: file.name,
              file_path: filePath, // Store the path for later retrieval
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id,
            });

          if (attachmentError) throw attachmentError;
        }
      }

      // 4. Create a notification for the student
      await supabase.from("notifications").insert({
        user_id: user.id,
        request_id: request.id,
        title: "Requête créée",
        message: `Votre requête "${formData.title}" a été soumise avec succès.`,
        type: "request_created",
      });

      router.push("/dashboard"); // Redirect to the dashboard
    } catch (err: any) {
      console.error("Error creating request:", err);
      setError(err.message || "An error occurred while creating the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Nouvelle Requête</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Type de Requête</Label>
          <Select
            name="type"
            value={formData.type}
            onValueChange={(value: RequestTypeEnum) =>
              setFormData((prev) => ({ ...prev, type: value }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a request type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(RequestType).map((key) => (
                <SelectItem key={key} value={key}>
                  {RequestType[key as keyof typeof RequestType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* File Upload Section */}
        <div>
          <Label htmlFor="attachments">Pièces jointes (facultatif)</Label>
          <Input
            id="attachments"
            type="file"
            multiple
            accept={ALLOWED_FILE_TYPES.join(",")}
            onChange={handleFileChange}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Formats acceptés : PDF, JPG, PNG, DOC, DOCX (max{" "}
            {MAX_FILE_SIZE / (1024 * 1024)} MB par fichier)
          </p>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Fichiers sélectionnés :</p>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-md text-sm"
                >
                  <div className="flex items-center gap-2">
                    <UploadIcon className="h-4 w-4 text-blue-500" />
                    <span>
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Soumission..." : "Soumettre la Requête"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="px-6"
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
