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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RequestType, RequestTypeEnum, GradeType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const MAX_DESCRIPTION_LINES = 10;
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
  message: `File type not supported. Allowed: PDF, JPG, PNG, DOC, DOCX.`,
});

type SubcategoryType = "missing" | "error" | "other" | null;

export default function NewRequest() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    type: "" as RequestTypeEnum | "",
    gradeType: null as GradeType,
    subcategory: null as SubcategoryType,
    title: "",
    description: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descriptionLineCount, setDescriptionLineCount] = useState(0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    
    if (name === "description") {
      const lines = value.split("\n").length;
      setDescriptionLineCount(lines);
      
      if (lines > MAX_DESCRIPTION_LINES) {
        setError(`Description limited to ${MAX_DESCRIPTION_LINES} lines`);
        return;
      }
      setError(null);
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as RequestTypeEnum | "",
      gradeType: null,
      subcategory: null,
    }));
    setError(null);
  };

  const handleGradeTypeChange = (value: GradeType) => {
    setFormData((prev) => ({
      ...prev,
      gradeType: value,
      subcategory: null,
    }));
  };

  const handleSubcategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategory: value as SubcategoryType,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalFiles = files.length + selectedFiles.length;

      if (totalFiles > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed. You selected ${totalFiles}`);
        return;
      }

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      selectedFiles.forEach((file) => {
        const result = fileSchema.safeParse(file);
        if (result.success) {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name}: ${result.error.issues[0].message}`);
        }
      });

      if (invalidFiles.length > 0) {
        setError(invalidFiles.join("; "));
        return;
      }

      setFiles((prev) => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.type) {
      setError("Please select a request type");
      return;
    }
    
    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }
    
    if (!formData.description.trim()) {
      setError("Please enter a description");
      return;
    }

    if (formData.type === "grade_inquiry" && !formData.gradeType) {
      setError("Please select CC or SN for grade inquiry");
      return;
    }

    if (formData.type === "grade_inquiry" && formData.gradeType === "CC" && !formData.subcategory) {
      setError("Please select the issue type");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      let titleToUse = formData.title;
      if (formData.type === "grade_inquiry" && formData.gradeType === "CC" && formData.subcategory) {
        const subcategoryLabels: Record<string, string> = {
          missing: "Absence de note",
          error: "Erreur de note",
        };
        titleToUse = `${formData.title} (${subcategoryLabels[formData.subcategory] || formData.subcategory})`;
      }

      const { data: request, error: requestError } = await supabase
        .from("requetes")
        .insert({
          student_id: user.id,
          type: formData.type,
          title: titleToUse,
          description: formData.description,
          status: "submitted",
          validation_status: "pending",
          grade_type: formData.gradeType,
          priority: "normal",
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Upload files
      if (files.length > 0) {
        for (const file of files) {
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name}`;
          const filePath = `${user.id}/${request.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("request-attachments")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: attachmentError } = await supabase
            .from("attachments")
            .insert({
              request_id: request.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id,
            });

          if (attachmentError) throw attachmentError;
        }
      }

      // Create notification for student
      await supabase.from("notifications").insert({
        user_id: user.id,
        request_id: request.id,
        title: "Requête soumise",
        message: `Votre requête "${formData.title}" a été soumise avec succès et sera vérifiée par l'administration.`,
        type: "request_created",
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred while creating the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Soumettre une Requête</h1>
          <p className="text-muted-foreground">
            Veuillez remplir le formulaire ci-dessous pour soumettre votre requête.
            L'administration vérifiera la conformité de vos documents avant traitement.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de la Requête</CardTitle>
            <CardDescription>
              Tous les champs marqués d'un astérisque (*) sont obligatoires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Request Type */}
              <div className="space-y-3">
                <Label htmlFor="type" className="text-base font-semibold">
                  Type de Requête *
                </Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Sélectionnez le type de requête" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade_inquiry">
                      📊 Demande de Note
                    </SelectItem>
                    <SelectItem value="absence_justification">
                      📋 Justification d'Absence
                    </SelectItem>
                    <SelectItem value="certificate_request">
                      📜 Demande de Certificat
                    </SelectItem>
                    <SelectItem value="grade_correction">
                      ✏️ Correction de Note
                    </SelectItem>
                    <SelectItem value="schedule_change">
                      📅 Changement d'Horaire
                    </SelectItem>
                    <SelectItem value="other">
                      ❓ Autre
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grade Type (only for grade_inquiry) */}
              {formData.type === "grade_inquiry" && (
                <div className="space-y-3 p-4 bg-secondary/50 rounded-lg border border-secondary">
                  <Label htmlFor="gradeType" className="text-base font-semibold">
                    Type de Note *
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sélectionnez si votre demande concerne le contrôle continu (CC) ou la session normale (SN)
                  </p>
                  <Select 
                    value={formData.gradeType || ""} 
                    onValueChange={(value) => handleGradeTypeChange(value as GradeType)}
                  >
                    <SelectTrigger id="gradeType">
                      <SelectValue placeholder="Sélectionnez CC ou SN" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">
                        Contrôle Continu (CC)
                      </SelectItem>
                      <SelectItem value="SN">
                        Session Normale (SN)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subcategory (for CC notes) */}
              {formData.type === "grade_inquiry" && formData.gradeType === "CC" && (
                <div className="space-y-3 p-4 bg-secondary/50 rounded-lg border border-secondary">
                  <Label htmlFor="subcategory" className="text-base font-semibold">
                    Nature du Problème *
                  </Label>
                  <Select value={formData.subcategory || ""} onValueChange={handleSubcategoryChange}>
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Sélectionnez la nature du problème" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="missing">
                        Absence de note
                      </SelectItem>
                      <SelectItem value="error">
                        Erreur de note
                      </SelectItem>
                      <SelectItem value="other">
                        Autre
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-semibold">
                  Titre *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ex: Correction de ma note de Mathématiques"
                  className="h-10"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 caractères
                </p>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-semibold">
                  Description Détaillée * (max {MAX_DESCRIPTION_LINES} lignes)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Décrivez votre requête en détail. Incluez le contexte, les informations pertinentes, etc."
                  className="resize-none"
                  rows={6}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{descriptionLineCount}/{MAX_DESCRIPTION_LINES} lignes</span>
                  {descriptionLineCount > MAX_DESCRIPTION_LINES && (
                    <span className="text-destructive">Dépassement du nombre de lignes</span>
                  )}
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-4 p-4 border-2 border-dashed rounded-lg bg-secondary/30">
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Pièces Jointes (Optionnel)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Upload plusieurs fichiers pour justifier votre requête. La conformité de vos documents sera vérifiée.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept={ALLOWED_FILE_TYPES.join(",")}
                    onChange={handleFileChange}
                    disabled={files.length >= MAX_FILES}
                    className="cursor-pointer"
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>✓ Formats acceptés: PDF, JPG, PNG, DOC, DOCX</p>
                    <p>✓ Taille maximale: {MAX_FILE_SIZE / (1024 * 1024)}MB par fichier</p>
                    <p>✓ Maximum: {MAX_FILES} fichiers ({files.length}/{MAX_FILES} sélectionnés)</p>
                  </div>
                </div>

                {/* Files List */}
                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-600">
                        {files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-background border rounded-md hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? "Soumission en cours..." : "Soumettre la Requête"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  size="lg"
                >
                  Annuler
                </Button>
              </div>

              {/* Info Note */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Après soumission, votre requête sera examinée par l'administration pour vérifier la conformité de vos documents avant traitement.
                </AlertDescription>
              </Alert>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
