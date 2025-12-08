# Synchronisation Adonis ↔ Supabase

## Vue d'ensemble

Le système synchronise les utilisateurs d'Adonis vers Supabase pour permettre aux deux systèmes de coexister:
- **Adonis**: Gestion complète de l'authentification et des tokens
- **Supabase**: Stockage des profils utilisateur et RLS (Row Level Security)

## Architecture

```
┌─────────────────────┐
│  User Login         │
│  (Email + Password) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Adonis API         │
│  /api/auth/login    │
│  ├─ Verify creds    │
│  ├─ Create token    │
│  └─ Return token    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Frontend Action    │
│  login()            │
│  ├─ Save token      │
│  │   (cookies)      │
│  └─ Sync to Supabase│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase Sync      │
│  /api/auth/         │
│  sync-supabase      │
│  ├─ Fetch user      │
│  │   from Adonis    │
│  ├─ Upsert to       │
│  │   Supabase       │
│  └─ Done            │
└─────────────────────┘
```

## Fichiers Impliqués

### 1. **lib/supabase-sync.ts** (Logique de synchronisation)
- `syncUserToSupabase(user)` - Synchronise un utilisateur
- `getSupabaseUser(userId)` - Récupère un utilisateur
- `deleteSupabaseUser(userId)` - Supprime un utilisateur
- `syncUsersToSupabase(users)` - Synchronise plusieurs utilisateurs

### 2. **app/api/auth/sync-supabase/route.ts** (Endpoint API)
- Route: `POST /api/auth/sync-supabase`
- Récupère l'utilisateur authentifié
- Appelle `syncUserToSupabase()`

### 3. **app/actions/auth.ts** (Server Action Login)
- Appelle Adonis login
- Sauvegarde le token
- **Appelle automatiquement** `/api/auth/sync-supabase`

## Configuration Requise

### Supabase Table: `users`

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  matricule VARCHAR(50) NOT NULL,
  role VARCHAR(50) DEFAULT 'etudiant',
  department_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_matricule ON users(matricule);
```

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_AUTH_URL=http://localhost:3333
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Flux de Synchronisation

### 1. Lors du Login
```typescript
// 1. Utilisateur rentre email + password
// 2. Frontend appelle login(formData)
// 3. Login action envoie à Adonis:
//    POST /api/auth/login { email, password }
// 4. Adonis vérifie credentials et retourne token
// 5. Frontend sauvegarde token dans cookie secure
// 6. Frontend appelle /api/auth/sync-supabase
// 7. sync-supabase récupère l'utilisateur complet
// 8. Supabase upsert l'utilisateur
// 9. Redirection vers /dashboard
```

### 2. Données Synchronisées
```typescript
{
  id: "12",                          // User ID from Adonis
  email: "user@enspd-udo.cm",       // Email
  first_name: "John",               // First name
  last_name: "Doe",                 // Last name
  matricule: "25T00001",            // Student ID
  role: "etudiant",                 // User role
  department_code: "GC",            // Department
  is_active: true,                  // Active status
  created_at: "2025-12-07T...",    // Creation date
  updated_at: "2025-12-08T..."     // Update date
}
```

## Utilisation

### Synchroniser un utilisateur après login
```typescript
// C'est fait automatiquement dans login()
// Mais vous pouvez aussi appeler manuellement:

const { syncUserToSupabase } = await import('@/lib/supabase-sync');
const user = await getUser();
await syncUserToSupabase(user);
```

### Récupérer un utilisateur depuis Supabase
```typescript
import { getSupabaseUser } from '@/lib/supabase-sync';

const user = await getSupabaseUser(userId);
console.log(user);
```

### Utiliser RLS (Row Level Security)
```sql
-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Créer une policy pour que les utilisateurs ne voient que leurs données
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Créer une policy pour que les admins voient tout
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin'
    )
  );
```

## Sécurité

### Service Role Key
- ✅ Utilisée **uniquement côté serveur**
- ✅ Contient des permissions élevées
- ✅ Bypasse le RLS
- ✅ Ne jamais exposer au client

### Anon Key
- ✅ Utilisée côté client
- ✅ Permissions limitées par RLS
- ✅ Safe à exposer publiquement

### Auth Token (Adonis)
- ✅ Stocké dans cookie httpOnly
- ✅ Sécure (HTTPS en production)
- ✅ SameSite: strict
- ✅ Valide 7 jours

## Dépannage

### Utilisateur non synchronisé
```typescript
// 1. Vérifier les logs
console.log('Sync result:', result);

// 2. Vérifier que la table existe
SELECT * FROM users LIMIT 1;

// 3. Appeler manuellement la sync
POST /api/auth/sync-supabase
```

### Erreur: "Service Role Key missing"
- Ajouter `SUPABASE_SERVICE_ROLE_KEY` à `.env.local`
- Vérifier que c'est la bonne clé depuis Supabase

### Erreur: "User not authenticated"
- Le token Adonis n'est pas dans les cookies
- Vérifier que le login a réussi
- Vérifier que les cookies sont activés

## Prochaines Étapes

1. ✅ Créer la table `users` dans Supabase
2. ✅ Configurer les environment variables
3. ✅ Activer RLS si nécessaire
4. ✅ Tester le flux complet
5. ⏳ Implémenter les autres tables (requetes, profiles, etc.)
