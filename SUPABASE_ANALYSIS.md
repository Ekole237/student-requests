# Analyse Structure Supabase - Request Platform

## Configuration Actuelle

### Credentials
- **Project URL**: https://ywjpdouvnvhvppxqdrvo.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Public, safe to expose)
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Secret, server-side only)

### Client Configuration

#### 1. **lib/supabase/client.ts** (Browser)
- Utilise `createBrowserClient` de @supabase/ssr
- Crée un client Supabase côté client
- Accessibilité: Accessible depuis les composants client

#### 2. **lib/supabase/server.ts** (Server-side)
- Utilise `createServerClient` de @supabase/ssr
- Gère les cookies pour la session
- **Protection spéciale**: Empêche Supabase de modifier le cookie `auth_token` d'Adonis
- Créé dans chaque fonction pour éviter les problèmes de session

#### 3. **lib/supabase/proxy.ts** (Middleware)
- Proxy de session dans le middleware Next.js
- Redirige vers `/auth/login` si pas de session
- Gère les cookies de session

## Structure DB Supabase Supposée

Basé sur l'utilisation dans le code (recherche des tables utilisées):

### Tables Principales Probables

```sql
-- Users/Profiles
- users (id, email, created_at, etc.)
- profiles (user_id, first_name, last_name, etc.)

-- Academic
- students (user_id, matricule, promotion_id, etc.)
- teachers (user_id, department_id, etc.)
- promotions (id, name, level, etc.)
- departments (id, name, code, etc.)

-- Requests/Services
- requetes (user_id, title, status, etc.)
- user_roles (user_id, role)
```

## Authentification Actuelle

### Supabase Auth Utilisé Pour:
1. Gestion des sessions utilisateur
2. Vérification des droits d'accès
3. Stockage des profiles utilisateur

### Problème Actuel:
- Supabase gère l'authentification indépendamment
- Adonis a son propre système d'authentification
- Pas de synchronisation entre les deux

## Plan de Synchronisation (Option 1)

### Étape 1: Préparer la table users dans Supabase
La table doit avoir:
```sql
users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  matricule VARCHAR,
  role VARCHAR,
  department_code VARCHAR,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Étape 2: Implémenter syncUserToSupabase()
Après login avec Adonis:
```typescript
const user = await getUser(); // From Adonis
await syncUserToSupabase(user); // Write to Supabase users table
```

### Étape 3: Configurer RLS (Row Level Security)
Protéger l'accès:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id);
```

### Étape 4: Utiliser pour les opérations
```typescript
const supabase = createClient();
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single();
```

## RLS (Row Level Security) Considerations

### Problème:
Supabase RLS utilise `auth.uid()` qui vient de Supabase Auth, pas d'Adonis

### Solutions:
1. **Désactiver RLS** pour la table users (moins sécurisé)
2. **Utiliser Service Role Key** depuis le serveur (sécurisé)
3. **Créer custom JWT** reconnu par Supabase (complexe)

## Prochaines Étapes

1. Analyser les tables existantes dans Supabase
2. Vérifier la structure exacte de chaque table
3. Implémenter syncUserToSupabase()
4. Configurer RLS si nécessaire
5. Tester la synchronisation
