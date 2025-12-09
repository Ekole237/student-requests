# Analyse: Flux de Soumission de Requête par un Étudiant

## Vue d'ensemble

Un étudiant authentifié peut soumettre une requête via la page `/requests/new`. Le système utilise Supabase pour stocker les données et les fichiers.

## Architecture du Flux

```
┌─────────────────────────────────────┐
│   Student clicks "Submit Request"   │
│   or navigates to /requests/new     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   NewRequest Component              │
│   (Client-side React)               │
│   - Form validation                 │
│   - File upload handling            │
│   - UI/UX state management          │
└──────────────┬──────────────────────┘
               │
               ▼ handleSubmit()
┌─────────────────────────────────────┐
│   Supabase Client                   │
│   (Browser-side with RLS)           │
│   - Get authenticated user          │
│   - Insert into requetes table      │
│   - Upload files to storage         │
│   - Insert attachments              │
│   - Create notification             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Supabase Database                 │
│   Tables:                           │
│   - requetes                        │
│   - attachments                     │
│   - notifications                   │
└──────────────┬──────────────────────┘
               │
               ▼
        Router.push("/dashboard")
```

## Étapes Détaillées

### 1. **Authentification**
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("User not authenticated.");
```
- Récupère l'utilisateur Supabase authentifié
- Vérifie que l'utilisateur existe
- Utilise `user.id` comme `student_id`

### 2. **Validation du Formulaire**
```typescript
// Validations obligatoires:
- formData.type (type de requête)
- formData.title (titre, max 100 caractères)
- formData.description (description, max 10 lignes)
- formData.gradeType (pour grade_inquiry)
- formData.subcategory (pour CC notes)

// Validations de fichiers:
- Maximum 5 fichiers
- Taille max 5MB par fichier
- Types acceptés: PDF, JPEG, PNG, DOC, DOCX
```

### 3. **Création de la Requête dans Supabase**
```typescript
const { data: request, error: requestError } = await supabase
  .from("requetes")
  .insert({
    student_id: user.id,              // ID de l'étudiant authentifié
    type: formData.type,              // grade_inquiry, certificate_request, etc.
    title: titleToUse,                // Titre (peut inclure sous-catégorie)
    description: formData.description, // Description détaillée
    status: "submitted",              // Statut initial
    validation_status: "pending",     // En attente de validation
    grade_type: formData.gradeType,  // CC ou SN (si pertinent)
    priority: "normal",               // Priorité par défaut
  })
  .select()                           // Récupère l'enregistrement créé
  .single();
```

### 4. **Upload des Fichiers** (si présents)
```typescript
for (const file of files) {
  // Génère un nom de fichier unique
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name}`;
  
  // Construit le chemin: user_id/request_id/filename
  const filePath = `${user.id}/${request.id}/${fileName}`;

  // Upload le fichier dans Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("request-attachments")
    .upload(filePath, file);

  // Enregistre les métadonnées dans la table attachments
  const { error: attachmentError } = await supabase
    .from("attachments")
    .insert({
      request_id: request.id,
      file_name: file.name,            // Nom original
      file_path: filePath,             // Chemin dans le storage
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user.id,
    });
}
```

### 5. **Création de Notification**
```typescript
await supabase.from("notifications").insert({
  user_id: user.id,
  request_id: request.id,
  title: "Requête soumise",
  message: `Votre requête "${formData.title}" a été soumise...`,
  type: "request_created",
});
```
- Notifie l'étudiant que la requête est soumise
- Apparaît dans le centre de notifications

### 6. **Redirection**
```typescript
router.push("/dashboard");
// L'étudiant est redirigé vers le dashboard
```

## Types de Requête Disponibles

| Type | Code | Description |
|------|------|-------------|
| Demande de Note | `grade_inquiry` | Demander des informations sur une note |
| Justification d'Absence | `absence_justification` | Justifier une absence en classe |
| Demande de Certificat | `certificate_request` | Demander un certificat académique |
| Correction de Note | `grade_correction` | Demander une correction de note |
| Changement d'Horaire | `schedule_change` | Demander un changement d'emploi du temps |
| Autre | `other` | Autres demandes |

## Sous-catégories (pour Demande de Note CC)

Pour les demandes concernant les notes de Contrôle Continu (CC):

- **missing** (Absence de note) - La note est manquante
- **error** (Erreur de note) - La note semble erronée
- **other** (Autre) - Autre problème

## Données Stockées dans Supabase

### Table: `requetes`
```sql
{
  id: UUID,
  student_id: UUID,                    -- ID Supabase de l'étudiant
  type: VARCHAR (grade_inquiry, ...),
  title: VARCHAR,                      -- Peut inclure (Absence de note) etc.
  description: TEXT,
  status: VARCHAR (submitted, ...),
  validation_status: VARCHAR (pending, ...),
  grade_type: VARCHAR (CC, SN, null),
  priority: VARCHAR (normal, ...),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Table: `attachments`
```sql
{
  id: UUID,
  request_id: UUID,
  file_name: VARCHAR,
  file_path: VARCHAR,                  -- Chemin dans storage
  file_size: INTEGER,
  file_type: VARCHAR,
  uploaded_by: UUID,
  created_at: TIMESTAMP
}
```

### Storage: `request-attachments`
```
request-attachments/
├── {user_id}/
│   ├── {request_id}/
│   │   ├── {timestamp}_{random}_{original_name}.pdf
│   │   ├── {timestamp}_{random}_{original_name}.jpg
```

## Gestion des Erreurs

```typescript
try {
  // Processus de soumission
} catch (err: unknown) {
  setError((err as Error).message || "An error occurred...");
  // Affiche le message d'erreur à l'utilisateur
  // Le formulaire reste rempli pour permettre une nouvelle tentative
} finally {
  setLoading(false);
}
```

## Problèmes Actuels

### ❌ Utilisation de Supabase Auth
- La page utilise `supabase.auth.getUser()` (Supabase Auth)
- Mais l'authentification se fait via Adonis
- **Problème**: Les `student_id` sont des Supabase UUIDs, pas des IDs Adonis!

### ❌ Pas de Synchronisation des Données
- Les requêtes sont stockées avec `user.id` de Supabase
- Mais l'utilisateur authentifié a un ID Adonis
- **Incohérence**: Les données ne sont pas liées correctement

## Solutions Nécessaires

### Option 1: Migrer vers Adonis pour les Requêtes
- Stocker les requêtes dans la BD Adonis (PostgreSQL)
- Utiliser l'ID utilisateur d'Adonis
- Plus cohérent avec l'authentification

### Option 2: Synchroniser les IDs
- Stocker aussi l'ID Adonis dans Supabase
- Utiliser l'ID Adonis comme `student_id`
- Permet de garder Supabase

### Option 3: API Gateway (Recommandé)
- Créer une API Next.js Server Action
- Elle récupère l'utilisateur Adonis
- Elle crée la requête dans Adonis (ou Supabase avec l'ID correct)
- Plus sécurisé et cohérent

## Améliorations à Faire

### Immédiat
1. ✅ Fixer l'authentification de la requête (utiliser Adonis, pas Supabase Auth)
2. ✅ Créer une Server Action pour soumettre les requêtes
3. ✅ Synchroniser correctement les IDs utilisateur

### À Moyen Terme
1. ⏳ Ajouter validation côté serveur
2. ⏳ Ajouter gestion des quotas (limite de requêtes par étudiant)
3. ⏳ Ajouter historique des modifications
4. ⏳ Ajouter recherche et filtrage des requêtes

### À Long Terme
1. ⏳ Ajouter système de commentaires sur les requêtes
2. ⏳ Ajouter notifications temps réel (WebSocket)
3. ⏳ Ajouter signature numérique pour les documents
4. ⏳ Intégration avec système académique
