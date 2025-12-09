-- ============================================================================
-- SCHÉMA SUPABASE SIMPLIFIÉ - Request Platform
-- Version: 2.0 - Synchronized with Adonis Backend
-- ============================================================================
-- Cette version est optimisée pour:
--   ✅ Synchroniser avec le backend Adonis (pas de duplication de données statiques)
--   ✅ Gérer UNIQUEMENT les requêtes et leur lifecycle
--   ✅ Implémenter les RLS policies basées sur le système de permissions
--   ✅ Maintenir la cohérence des données
--
-- ⚠️  ATTENTION: Ce script supprime TOUTES les données existantes!
--     Exécutez uniquement si vous êtes certain de vouloir reconstruire la DB
-- ============================================================================

-- ============================================================================
-- PHASE 1: SUPPRESSION DES ANCIENNES TABLES (Ordre inverse des dépendances)
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS request_routing CASCADE;
DROP TABLE IF EXISTS request_validation CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS requetes CASCADE;
DROP TABLE IF EXISTS request_platform_roles CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les types ENUM existants
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS validation_status CASCADE;
DROP TYPE IF EXISTS final_status CASCADE;
DROP TYPE IF EXISTS request_type CASCADE;
DROP TYPE IF EXISTS request_priority CASCADE;
DROP TYPE IF EXISTS grade_type CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS request_platform_permission CASCADE;

-- ============================================================================
-- PHASE 2: CRÉATION DES TYPES ENUM
-- ============================================================================

-- Types pour les requêtes
CREATE TYPE request_type AS ENUM (
  'grade_inquiry',              -- Demande de note
  'absence_justification',      -- Justification d'absence
  'certificate_request',        -- Demande de certificat
  'grade_correction',           -- Correction de note
  'schedule_change',            -- Changement d'horaire
  'other'                       -- Autre
);

CREATE TYPE request_status AS ENUM (
  'submitted',                  -- Soumise
  'validated',                  -- Validée
  'assigned',                   -- Assignée
  'processing',                 -- En traitement
  'completed',                  -- Complétée
  'rejected'                    -- Rejetée
);

CREATE TYPE validation_status AS ENUM (
  'pending',                    -- En attente
  'validated',                  -- Validée
  'rejected'                    -- Rejetée
);

CREATE TYPE final_status AS ENUM (
  'approved',                   -- Approuvée
  'rejected'                    -- Rejetée
);

CREATE TYPE request_priority AS ENUM (
  'low',                        -- Basse
  'normal',                     -- Normale
  'high',                       -- Haute
  'urgent'                      -- Urgente
);

CREATE TYPE grade_type AS ENUM (
  'CC',                         -- Contrôle Continu
  'SN'                          -- Session Normale
);

-- Rôles de l'application (mappés de Adonis)
CREATE TYPE app_role AS ENUM (
  'admin',                      -- Administrateur système
  'student',                    -- Étudiant (étudiant in Adonis)
  'teacher',                    -- Enseignant (enseignant in Adonis)
  'department_head'             -- Responsable pédagogique
);

-- Permissions du système Request Platform
CREATE TYPE request_platform_permission AS ENUM (
  'requetes:create',            -- Créer une requête
  'requetes:view-own',          -- Voir ses propres requêtes
  'requetes:view-routed-to-me', -- Voir les requêtes routées vers soi
  'requetes:view-department',   -- Voir les requêtes du département
  'requetes:validate',          -- Valider une requête
  'requetes:route',             -- Router une requête
  'requetes:resolve',           -- Résoudre une requête
  'requetes:view-all',          -- Voir toutes les requêtes
  'system:manage'               -- Gérer le système
);

-- ============================================================================
-- PHASE 3: TABLES MINIMALES (synchronisées avec Adonis)
-- ============================================================================

-- Table: Utilisateurs (synchronisée depuis Adonis)
-- Cette table est la source de synchronisation unique entre Adonis et Supabase
CREATE TABLE users (
  -- Identifiants
  id TEXT PRIMARY KEY,                          -- UUID ou ID Adonis
  email VARCHAR(255) NOT NULL UNIQUE,
  
  -- Informations de base
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Information académique
  matricule VARCHAR(50) NOT NULL UNIQUE,        -- Matricule unique
  role app_role DEFAULT 'student',              -- Rôle: student, teacher, department_head, admin
  department_code VARCHAR(10),                  -- Code du département (référence Adonis)
  promotion_code VARCHAR(20),                   -- Code de la promotion (référence Adonis)
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_matricule ON users(matricule);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_department_code ON users(department_code);

-- Table: Profils détaillés (optionnel, pour informations supplémentaires)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  bio TEXT,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ============================================================================
-- PHASE 4: TABLES DE CONFIGURATION DU SYSTÈME
-- ============================================================================

-- Table: Mapping des rôles Adonis → Permissions Request Platform
CREATE TABLE request_platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adonis_role VARCHAR(50) NOT NULL UNIQUE,     -- 'étudiant', 'enseignant', 'responsable_pedagogique', 'admin'
  app_role app_role NOT NULL UNIQUE,           -- 'student', 'teacher', 'department_head', 'admin'
  name VARCHAR(100) NOT NULL,
  permissions request_platform_permission[] NOT NULL,
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_request_platform_roles_adonis_role ON request_platform_roles(adonis_role);
CREATE INDEX idx_request_platform_roles_app_role ON request_platform_roles(app_role);

-- Insérer les rôles et permissions
INSERT INTO request_platform_roles (adonis_role, app_role, name, permissions, description) VALUES
  (
    'admin',
    'admin'::app_role,
    'Administrateur Système',
    ARRAY[
      'requetes:create'::request_platform_permission,
      'requetes:view-own'::request_platform_permission,
      'requetes:view-routed-to-me'::request_platform_permission,
      'requetes:view-department'::request_platform_permission,
      'requetes:validate'::request_platform_permission,
      'requetes:route'::request_platform_permission,
      'requetes:resolve'::request_platform_permission,
      'requetes:view-all'::request_platform_permission,
      'system:manage'::request_platform_permission
    ],
    'Accès complet au système'
  ),
  (
    'etudiant',
    'student'::app_role,
    'Étudiant',
    ARRAY[
      'requetes:create'::request_platform_permission,
      'requetes:view-own'::request_platform_permission
    ],
    'Peut créer et voir ses propres requêtes'
  ),
  (
    'enseignant',
    'teacher'::app_role,
    'Enseignant',
    ARRAY[
      'requetes:create'::request_platform_permission,
      'requetes:view-own'::request_platform_permission,
      'requetes:view-routed-to-me'::request_platform_permission,
      'requetes:view-department'::request_platform_permission,
      'requetes:resolve'::request_platform_permission
    ],
    'Peut créer, voir ses requêtes et résoudre celles routées'
  ),
  (
    'responsable_pedagogique',
    'department_head'::app_role,
    'Responsable Pédagogique',
    ARRAY[
      'requetes:create'::request_platform_permission,
      'requetes:view-own'::request_platform_permission,
      'requetes:view-routed-to-me'::request_platform_permission,
      'requetes:view-department'::request_platform_permission,
      'requetes:validate'::request_platform_permission,
      'requetes:route'::request_platform_permission,
      'requetes:resolve'::request_platform_permission
    ],
    'Peut valider, router et résoudre les requêtes du département'
  );

-- ============================================================================
-- PHASE 5: TABLES PRINCIPALES - GESTION DES REQUÊTES
-- ============================================================================

-- Table: Requêtes
CREATE TABLE requetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiants
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  routed_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  
  -- Contenu
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  request_type request_type NOT NULL,
  priority request_priority DEFAULT 'normal',
  
  -- Contexte académique
  department_code VARCHAR(10) NOT NULL,        -- Référence au département Adonis
  promotion_code VARCHAR(20),                  -- Référence à la promotion Adonis (optionnel)
  subject VARCHAR(255),                        -- Sujet ou cours concerné
  
  -- Données spécifiques par type
  grade_type grade_type,                       -- CC ou SN (si applicable)
  grade_value FLOAT,                           -- Valeur de la note (si applicable)
  
  -- Statuts
  status request_status DEFAULT 'submitted',
  validation_status validation_status DEFAULT 'pending',
  final_status final_status,
  
  -- Notes et raisons
  internal_notes TEXT,                         -- Notes internes
  rejection_reason TEXT,                       -- Raison du rejet
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  routed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_requetes_created_by ON requetes(created_by);
CREATE INDEX idx_requetes_assigned_to ON requetes(assigned_to);
CREATE INDEX idx_requetes_routed_to ON requetes(routed_to);
CREATE INDEX idx_requetes_resolved_by ON requetes(resolved_by);
CREATE INDEX idx_requetes_status ON requetes(status);
CREATE INDEX idx_requetes_validation_status ON requetes(validation_status);
CREATE INDEX idx_requetes_department_code ON requetes(department_code);
CREATE INDEX idx_requetes_created_at ON requetes(created_at DESC);
CREATE INDEX idx_requetes_priority ON requetes(priority);
CREATE INDEX idx_requetes_request_type ON requetes(request_type);

-- Table: Validations de requêtes
CREATE TABLE request_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requete_id UUID NOT NULL REFERENCES requetes(id) ON DELETE CASCADE,
  validated_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  status validation_status NOT NULL,
  reason TEXT,                                 -- Raison de validation/rejet
  comments TEXT,                               -- Commentaires
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_request_validations_requete_id ON request_validations(requete_id);
CREATE INDEX idx_request_validations_validated_by ON request_validations(validated_by);
CREATE INDEX idx_request_validations_status ON request_validations(status);

-- Table: Routage de requêtes
CREATE TABLE request_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requete_id UUID NOT NULL REFERENCES requetes(id) ON DELETE CASCADE,
  routed_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  routed_to TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  reason TEXT,                                 -- Raison du routage
  comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_request_routing_requete_id ON request_routing(requete_id);
CREATE INDEX idx_request_routing_routed_by ON request_routing(routed_by);
CREATE INDEX idx_request_routing_routed_to ON request_routing(routed_to);

-- Table: Pièces jointes
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requete_id UUID NOT NULL REFERENCES requetes(id) ON DELETE CASCADE,
  
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,                     -- Chemin dans le stockage
  file_size BIGINT,                            -- Taille en octets
  file_type VARCHAR(100),                      -- MIME type
  uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attachments_requete_id ON attachments(requete_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);

-- Table: Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requete_id UUID REFERENCES requetes(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),                            -- 'info', 'warning', 'success', 'error'
  
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_requete_id ON notifications(requete_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Table: Logs d'audit
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(100) NOT NULL,                -- 'create', 'update', 'validate', 'route', 'resolve', etc.
  table_name VARCHAR(50),                      -- Table affectée
  record_id UUID,                              -- ID du record affecté
  
  old_values JSONB,                            -- Anciennes valeurs
  new_values JSONB,                            -- Nouvelles valeurs
  changes JSONB,                               -- Changements
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- PHASE 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_platform_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Users Table
-- ============================================================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

-- Les administrateurs peuvent voir tous les utilisateurs
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Les utilisateurs du même département peuvent se voir
CREATE POLICY "Users in same department can view each other"
  ON users FOR SELECT
  USING (
    department_code = (SELECT department_code FROM users WHERE id = auth.uid()::text)
    AND department_code IS NOT NULL
  );

-- Les utilisateurs ne peuvent modifier que leur propre profil
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- ============================================================================
-- RLS POLICIES - Requêtes Table
-- ============================================================================

-- Les utilisateurs peuvent voir leurs propres requêtes
CREATE POLICY "Users can view own requests"
  ON requetes FOR SELECT
  USING (auth.uid()::text = created_by);

-- Les utilisateurs avec permission 'requetes:view-all' voient toutes les requêtes
CREATE POLICY "Users with view-all permission see all requests"
  ON requetes FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT u.id FROM users u
      WHERE u.role = 'admin'
    )
  );

-- Les utilisateurs voient les requêtes routées vers eux
CREATE POLICY "Users see requests routed to them"
  ON requetes FOR SELECT
  USING (
    auth.uid()::text = routed_to
    OR auth.uid()::text = assigned_to
  );

-- Les utilisateurs du même département voient les requêtes du département
CREATE POLICY "Department heads see department requests"
  ON requetes FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT id FROM users WHERE role = 'department_head'
    )
    AND department_code = (
      SELECT department_code FROM users WHERE id = auth.uid()::text
    )
  );

-- Les utilisateurs avec permission 'requetes:view-department' voient les requêtes du département
CREATE POLICY "Users with view-department permission see department requests"
  ON requetes FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT id FROM users 
      WHERE role IN ('teacher', 'department_head')
    )
    AND department_code = (
      SELECT department_code FROM users WHERE id = auth.uid()::text
    )
  );

-- Les utilisateurs peuvent créer des requêtes (vérifié par politique applicative)
CREATE POLICY "Users can create requests"
  ON requetes FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

-- Les utilisateurs peuvent modifier leurs propres requêtes non validées
CREATE POLICY "Users can update own unvalidated requests"
  ON requetes FOR UPDATE
  USING (
    auth.uid()::text = created_by
    AND validation_status = 'pending'
  )
  WITH CHECK (
    auth.uid()::text = created_by
    AND validation_status = 'pending'
  );

-- Les responsables de département/enseignants peuvent valider les requêtes
CREATE POLICY "Teachers can validate requests routed to them"
  ON requetes FOR UPDATE
  USING (
    (auth.uid()::text = routed_to OR auth.uid()::text = assigned_to)
    AND status IN ('submitted', 'validated')
  )
  WITH CHECK (
    (auth.uid()::text = routed_to OR auth.uid()::text = assigned_to)
    AND status IN ('submitted', 'validated')
  );

-- Les administrateurs peuvent modifier n'importe quelle requête
CREATE POLICY "Admins can update any request"
  ON requetes FOR UPDATE
  USING (auth.uid()::text IN (SELECT id FROM users WHERE role = 'admin'))
  WITH CHECK (auth.uid()::text IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================================
-- RLS POLICIES - Request Validations
-- ============================================================================

CREATE POLICY "Users can view validations of their requests"
  ON request_validations FOR SELECT
  USING (
    requete_id IN (
      SELECT id FROM requetes WHERE created_by = auth.uid()::text
      OR routed_to = auth.uid()::text
      OR assigned_to = auth.uid()::text
    )
  );

CREATE POLICY "Validators can create validations"
  ON request_validations FOR INSERT
  WITH CHECK (
    validated_by = auth.uid()::text
    AND requete_id IN (
      SELECT id FROM requetes 
      WHERE routed_to = auth.uid()::text OR assigned_to = auth.uid()::text
    )
  );

-- ============================================================================
-- RLS POLICIES - Request Routing
-- ============================================================================

CREATE POLICY "Users can view request routing"
  ON request_routing FOR SELECT
  USING (
    requete_id IN (
      SELECT id FROM requetes WHERE created_by = auth.uid()::text
      OR routed_to = auth.uid()::text
      OR routed_by = auth.uid()::text
    )
  );

CREATE POLICY "Authorized users can create routing"
  ON request_routing FOR INSERT
  WITH CHECK (
    routed_by = auth.uid()::text
    AND auth.uid()::text IN (
      SELECT id FROM users WHERE role IN ('department_head', 'teacher', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES - Attachments
-- ============================================================================

CREATE POLICY "Users can view attachments of their requests"
  ON attachments FOR SELECT
  USING (
    requete_id IN (
      SELECT id FROM requetes WHERE created_by = auth.uid()::text
      OR routed_to = auth.uid()::text
      OR assigned_to = auth.uid()::text
    )
  );

CREATE POLICY "Users can upload attachments to their requests"
  ON attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()::text
    AND requete_id IN (
      SELECT id FROM requetes WHERE created_by = auth.uid()::text
    )
  );

-- ============================================================================
-- RLS POLICIES - Notifications
-- ============================================================================

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ============================================================================
-- RLS POLICIES - Audit Logs
-- ============================================================================

-- Seuls les admins peuvent voir les logs d'audit
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - Request Platform Roles
-- ============================================================================

-- Les rôles sont en lecture seule, visibles par tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view request platform roles"
  ON request_platform_roles FOR SELECT
  USING (true);

-- ============================================================================
-- PHASE 7: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les tables principales
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requetes_updated_at
BEFORE UPDATE ON requetes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_request_validations_updated_at
BEFORE UPDATE ON request_validations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_request_routing_updated_at
BEFORE UPDATE ON request_routing
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer un audit log automatiquement
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    auth.uid()::text,
    TG_ARGV[0]::text,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    NULL
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Triggers d'audit pour les actions importantes
CREATE TRIGGER audit_requetes_create
AFTER INSERT ON requetes
FOR EACH ROW
EXECUTE FUNCTION log_audit_trail('create');

CREATE TRIGGER audit_requetes_update
AFTER UPDATE ON requetes
FOR EACH ROW
EXECUTE FUNCTION log_audit_trail('update');

CREATE TRIGGER audit_request_validations_create
AFTER INSERT ON request_validations
FOR EACH ROW
EXECUTE FUNCTION log_audit_trail('validate');

CREATE TRIGGER audit_request_routing_create
AFTER INSERT ON request_routing
FOR EACH ROW
EXECUTE FUNCTION log_audit_trail('route');

-- ============================================================================
-- PHASE 8: VUE HELPERS
-- ============================================================================

-- Vue: Requêtes en attente de validation
CREATE OR REPLACE VIEW pending_validations AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.request_type,
  r.priority,
  u.first_name,
  u.last_name,
  u.email,
  r.created_at,
  r.department_code
FROM requetes r
JOIN users u ON r.created_by = u.id
WHERE r.validation_status = 'pending'
  AND r.status IN ('submitted', 'validated')
ORDER BY r.priority DESC, r.created_at ASC;

-- Vue: Requêtes à router
CREATE OR REPLACE VIEW pending_routing AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.request_type,
  r.priority,
  u.first_name,
  u.last_name,
  u.email,
  r.validated_at,
  r.department_code
FROM requetes r
JOIN users u ON r.created_by = u.id
WHERE r.status = 'validated'
  AND r.routed_to IS NULL
ORDER BY r.priority DESC, r.validated_at ASC;

-- Vue: Requêtes en cours de traitement
CREATE OR REPLACE VIEW active_requests AS
SELECT 
  r.id,
  r.title,
  r.request_type,
  r.status,
  r.priority,
  u_creator.email AS creator_email,
  u_assigned.email AS assigned_to_email,
  u_routed.email AS routed_to_email,
  r.created_at,
  r.updated_at
FROM requetes r
LEFT JOIN users u_creator ON r.created_by = u_creator.id
LEFT JOIN users u_assigned ON r.assigned_to = u_assigned.id
LEFT JOIN users u_routed ON r.routed_to = u_routed.id
WHERE r.status IN ('submitted', 'validated', 'assigned', 'processing');

-- ============================================================================
-- PHASE 9: DONNÉES DE CONFIGURATION INITIALES
-- ============================================================================

-- Note: Les données des utilisateurs, départements, etc. doivent être
-- synchronisées depuis Adonis via l'endpoint /api/auth/sync-supabase

-- Vous pouvez ajouter des utilisateurs de test ici si nécessaire:
-- INSERT INTO users (id, email, matricule, first_name, last_name, role, is_active)
-- VALUES ('test-user-1', 'test@example.com', 'TEST001', 'Test', 'User', 'student'::app_role, true);

-- ============================================================================
-- PHASE 10: GRANTS & SÉCURITÉ
-- ============================================================================

-- Créer un rôle pour l'application Supabase
-- (généralement géré par Supabase automatiquement)

-- Rendre les tables RLS-ready
-- Les policies ci-dessus gèrent l'accès basé sur auth.uid()

COMMIT;

-- ============================================================================
-- ✅ SCHEMA CRÉÉ AVEC SUCCÈS
-- ============================================================================
-- 
-- Étapes suivantes:
--
-- 1. Vérifier que les policies RLS fonctionnent correctement
-- 2. Configurer l'endpoint /api/auth/sync-supabase dans Adonis
-- 3. Tester la synchronisation des utilisateurs depuis Adonis
-- 4. Ajouter les webhooks pour les événements Adonis
-- 5. Configurer les triggers Edge Functions (si nécessaire)
--
-- ============================================================================
