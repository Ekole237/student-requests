# Intégration Request Submission avec Adonis Auth

## Résumé des Changements

La soumission de requête a été modifiée pour utiliser l'authentification Adonis au lieu de Supabase Auth, assurant la cohérence des données à travers l'application.

## Avant (Problématique)

```typescript
// ❌ ANCIEN CODE - Utilisait Supabase Auth
const { data: { user } } = await supabase.auth.getUser();
// user.id était un UUID Supabase, pas l'ID Adonis!
```

**Problème**: Les requêtes étaient stockées avec des IDs Supabase, pas les IDs Adonis. Cela créait une incohérence car:
- Authentification via Adonis (ID entier)
- Requêtes stockées avec UUID Supabase
- Impossible de lier les requêtes au bon utilisateur

## Après (Solution)

```typescript
// ✅ NOUVEAU CODE - Utilise Adonis Auth
const user = await getUser();
// user.id est maintenant l'ID Adonis (nombre)
const { data: request } = await supabase
  .from('requetes')
  .insert({
    student_id: user.id.toString(), // ✅ ID Adonis converti en string
    // ... autres champs
  });
```

## Architecture

### Server Actions (`app/actions/requests.ts`)

#### 1. `createRequest(payload)`
Crée une nouvelle requête pour l'utilisateur authentifié.

```typescript
import { createRequest } from '@/app/actions/requests';

const result = await createRequest({
  type: 'grade_inquiry',
  title: 'Ma requête',
  description: 'Description...',
  gradeType: 'CC',
  subcategory: 'missing'
});

if (result.success) {
  console.log('Request created:', result.data.id);
} else {
  console.error('Error:', result.error);
}
```

**Points clés**:
- Récupère l'utilisateur Adonis authentifié
- Valide les données d'entrée
- Crée la requête dans Supabase avec l'ID Adonis
- Crée automatiquement une notification
- Retourne l'ID de la requête créée

#### 2. `uploadRequestFiles(requestId, formData)`
Upload les fichiers pour une requête.

```typescript
import { uploadRequestFiles } from '@/app/actions/requests';

const formData = new FormData();
files.forEach(file => formData.append('files', file));

const result = await uploadRequestFiles(requestId, formData);

if (result.success) {
  console.log('Files uploaded:', result.data.length);
}
```

**Points clés**:
- Génère des noms de fichier uniques avec timestamp
- Organise les fichiers par structure: `user_id/request_id/filename`
- Enregistre les métadonnées dans la table `attachments`
- Gère les erreurs individuelles par fichier

#### 3. `getUserRequests()`
Récupère toutes les requêtes de l'utilisateur authentifié.

```typescript
const result = await getUserRequests();

if (result.success) {
  console.log('User requests:', result.data);
}
```

#### 4. `getRequestDetails(requestId)`
Récupère une requête avec toutes ses pièces jointes.

```typescript
const result = await getRequestDetails(requestId);

if (result.success) {
  const { request, attachments } = result.data;
  console.log('Request:', request);
  console.log('Files:', attachments);
}
```

## Utilisation dans les Composants

### Exemple: Page de Création de Requête

```typescript
'use client'; // Client component

import { createRequest, uploadRequestFiles } from '@/app/actions/requests';

export default function NewRequest() {
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Créer la requête
    const createResult = await createRequest({
      type: formData.type,
      title: formData.title,
      description: formData.description,
    });

    if (!createResult.success) {
      setError(createResult.error);
      return;
    }

    // 2. Upload les fichiers
    if (files.length > 0) {
      const formDataFiles = new FormData();
      files.forEach(file => formDataFiles.append('files', file));
      
      const uploadResult = await uploadRequestFiles(
        createResult.data.id,
        formDataFiles
      );

      if (!uploadResult.success) {
        console.warn('File upload failed:', uploadResult.error);
      }
    }

    // 3. Redirection
    router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire */}
    </form>
  );
}
```

## Flux de Données

```
┌─────────────────┐
│  Student Form   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Client Component               │
│  - Validation côté client       │
│  - Gestion d'état (React)       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Server Action                  │
│  - createRequest()              │
│  - uploadRequestFiles()         │
│  - Récupère user Adonis         │
│  - Valide côté serveur          │
│  - Accès sécurisé à la BD       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Supabase                       │
│  - requetes table               │
│  - attachments table            │
│  - request-attachments storage  │
│  - notifications table          │
└─────────────────────────────────┘
```

## Sécurité

### ✅ Avantages de cette approche

1. **Authentification sécurisée**
   - Utilise le middleware Adonis (cookies httpOnly)
   - Pas d'exposition du token au client

2. **Validation côté serveur**
   - Impossible de contourner les validations
   - Les données sont vérifiées avant insertion

3. **Isolation de l'utilisateur**
   - Chaque utilisateur ne voit que ses requêtes
   - Les IDs Adonis lient les données correctement

4. **Gestion des fichiers**
   - Chemin organisé par user_id/request_id
   - Métadonnées enregistrées
   - Types de fichier validés

### ⚠️ Considérations

1. **Quotas**
   - À implémenter: limite de requêtes par étudiant
   - À implémenter: limite de taille totale

2. **Validation des fichiers**
   - Actuellement: validation par extension et type MIME
   - À améliorer: scanner antivirus, analyse de contenu

3. **Notifications**
   - Les notifications ne sont envoyées que lors de la création
   - À ajouter: notifications pour les mises à jour de statut

## Exemple Complet

```typescript
// app/requests/new/page.tsx
'use client';

import { createRequest, uploadRequestFiles } from '@/app/actions/requests';
import { useRouter } from 'next/navigation';

export default function NewRequest() {
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Create request
      const createRes = await createRequest({
        type: 'grade_inquiry',
        title: 'Correction de ma note',
        description: 'J\'ai une question sur ma note de...',
        gradeType: 'CC',
        subcategory: 'error',
      });

      if (!createRes.success) {
        alert('Error: ' + createRes.error);
        return;
      }

      const requestId = createRes.data.id;

      // Step 2: Upload files
      const formData = new FormData();
      formData.append('files', fileInput.files[0]);

      const uploadRes = await uploadRequestFiles(requestId, formData);

      if (!uploadRes.success) {
        console.warn('Files upload failed:', uploadRes.error);
        // Mais la requête a été créée
      }

      // Step 3: Success!
      alert('Requête soumise avec succès!');
      router.push('/dashboard');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire */}
    </form>
  );
}
```

## Prochaines Étapes

### Immédiat
- ✅ Implémenter server actions
- ✅ Utiliser Adonis pour l'authentification
- ⏳ Tester le flux complet

### Court terme
- ⏳ Implémenter quotas de requêtes
- ⏳ Ajouter antivirus pour les fichiers
- ⏳ Ajouter pagination pour les requêtes

### Moyen terme
- ⏳ Système de commentaires sur requêtes
- ⏳ Notifications temps réel
- ⏳ Export PDF des requêtes
- ⏳ Historique des modifications

### Long terme
- ⏳ Intégration API avec système académique
- ⏳ Workflow automatisé
- ⏳ Dashboard analytique
