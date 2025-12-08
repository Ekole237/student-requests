"use client";

import { useState, useEffect } from "react";
import { createRequest, uploadRequestFiles } from "@/app/actions/requests";
import { getCurrentUser } from "@/app/actions/user";
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
import { useUserStore } from "@/stores/user";
import { PermissionGate } from "@/components/PermissionGate";

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

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default function NewRequest() {
  const router = useRouter();
  const supabase = createClient();
  const { hasPermission } = useUserStore();

  // Initialize all hooks at the top level
  const [formData, setFormData] = useState({
    type: "" as RequestTypeEnum | "",
    gradeType: null as GradeType,
    subcategory: null as SubcategoryType,
    title: "",
    description: "",
    routed_to: "",             // ✅ NOUVEAU: ID du destinataire
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descriptionLineCount, setDescriptionLineCount] = useState(0);
  
  // ✅ NOUVEAU: Listes d'utilisateurs
  const [teachers, setTeachers] = useState<User[]>([]);
  const [responsablePedagogiques, setResponsablePedagogiques] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userPromotionCode, setUserPromotionCode] = useState<string | null>(null);

  // ✅ NOUVEAU: Charger les enseignants et RP au montage
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        // Récupérer l'utilisateur actuel pour avoir son code de promotion
        const currentUser = await getCurrentUser();
        const promotionCode = currentUser?.promotion?.name || null;
        setUserPromotionCode(promotionCode);

        // Charger enseignants de la même filière/promotion
        let teacherQuery = supabase
          .from("users")
          .select("id, email, first_name, last_name")
          .eq("role", "teacher")
          .eq("is_active", true);

        // Filtrer par promotion si l'étudiant en a une
        if (promotionCode) {
          teacherQuery = teacherQuery.eq("promotion_code", promotionCode);
        }

        const { data: teacherUsers, error: teacherError } = await teacherQuery;

        if (!teacherError && teacherUsers) {
          setTeachers(teacherUsers);
        }

        // Charger responsables pédagogiques de la même filière/promotion
        let rpQuery = supabase
          .from("users")
          .select("id, email, first_name, last_name")
          .eq("role", "department_head")
          .eq("is_active", true);

        // Filtrer par promotion si l'étudiant en a une
        if (promotionCode) {
          rpQuery = rpQuery.eq("promotion_code", promotionCode);
        }

        const { data: rpUsers, error: rpError } = await rpQuery;

        if (!rpError && rpUsers) {
          setResponsablePedagogiques(rpUsers);
        }
      } catch (err) {
        console.error("Error loading users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [supabase]);

  // Check permission to create request - after all hooks
  if (!hasPermission('requetes:create')) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-3">
                <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
                <h3 className="text-lg font-semibold">Accès Refusé</h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas la permission de créer une requête
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
      routed_to: "",            // ✅ NOUVEAU: Reset destinataire
    }));
    setError(null);
  };

  const handleGradeTypeChange = (value: GradeType) => {
    setFormData((prev) => ({
      ...prev,
      gradeType: value,
      subcategory: null,
      routed_to: "",  // Reset la sélection
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

    // ✅ NOUVEAU: Vérifier la sélection du destinataire pour les demandes de note
    if (formData.type === "grade_inquiry" && !formData.routed_to) {
      const roleLabel = formData.gradeType === "CC" ? "enseignant" : "responsable pédagogique";
      setError(`Please select an ${roleLabel}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call server action to create request
      const result = await createRequest({
        type: formData.type as string,
        title: formData.title,
        description: formData.description,
        gradeType: formData.gradeType,
        subcategory: formData.subcategory,
        routed_to: formData.routed_to,             // ✅ NOUVEAU
      });

      if (!result.success) {
        setError(result.error || "Failed to create request");
        setLoading(false);
        return;
      }

      const requestId = result.data.id;
      console.log('✅ Request created:', requestId);

      // Upload files if any
      if (files.length > 0) {
        console.log('Uploading', files.length, 'files...');
        const formDataFile = new FormData();
        files.forEach((file) => {
          formDataFile.append('files', file);
        });

        const uploadResult = await uploadRequestFiles(requestId, formDataFile);
        
        if (!uploadResult.success) {
          console.warn('File upload warning:', uploadResult.error);
          // Don't fail the request if files fail to upload
        } else if (uploadResult.data) {
          console.log('✅ Files uploaded:', uploadResult.data.length);
        }
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred while creating the request.");
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
                <Select value={formData.type || ""} onValueChange={handleTypeChange}>
                  <SelectTrigger id="type" className="w-full">
                    {formData.type ? (
                      <SelectValue />
                    ) : (
                      <span className="text-muted-foreground">Sélectionnez le type de requête</span>
                    )}
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
                    <SelectTrigger id="gradeType" className="w-full">
                      {formData.gradeType ? (
                        <SelectValue />
                      ) : (
                        <span className="text-muted-foreground">Sélectionnez CC ou SN</span>
                      )}
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
                    <SelectTrigger id="subcategory" className="w-full">
                      {formData.subcategory ? (
                        <SelectValue />
                      ) : (
                        <span className="text-muted-foreground">Sélectionnez la nature du problème</span>
                      )}
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

              {/* ✅ NOUVEAU: Sélection du destinataire (Enseignant/RP) */}
              {formData.type === "grade_inquiry" && formData.gradeType && (
                <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Label className="text-base font-semibold text-blue-900 dark:text-blue-200">
                    {formData.gradeType === "CC" ? "Sélectionnez votre Enseignant *" : "Sélectionnez le Responsable Pédagogique *"}
                  </Label>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {formData.gradeType === "CC" 
                      ? "Votre requête sera envoyée directement à l'enseignant"
                      : "Votre requête sera envoyée directement au responsable pédagogique"}
                  </p>
                  
                  {loadingUsers ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Chargement des utilisateurs...</p>
                    </div>
                  ) : (
                    <Select 
                      value={formData.routed_to || ""} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, routed_to: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue 
                          placeholder={formData.gradeType === "CC" ? "Choisir un enseignant" : "Choisir un responsable pédagogique"} 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.gradeType === "CC" ? teachers : responsablePedagogiques).map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                            {user.email && <span className="text-muted-foreground text-xs"> ({user.email})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {formData.routed_to && (
                    <Alert className="bg-green-50/50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ✅ Votre requête sera envoyée directement au destinataire sélectionné
                      </AlertDescription>
                    </Alert>
                  )}
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
