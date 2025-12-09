-- ============================================================================
-- Migration: Ajouter la colonne routed_to_role à la table requetes
-- ============================================================================
-- Contexte: La table requetes a déjà la colonne routed_to (FK vers users)
-- On ajoute routed_to_role pour stocker le rôle du destinataire (enrichissement)
-- Cette migration est idempotente et peut être exécutée plusieurs fois sans danger

-- Ajouter la colonne routed_to_role si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requetes' AND column_name = 'routed_to_role'
  ) THEN
    ALTER TABLE requetes 
    ADD COLUMN routed_to_role app_role;
    
    -- Créer l'index pour routed_to_role
    CREATE INDEX idx_requetes_routed_to_role ON requetes(routed_to_role);
  END IF;
END $$;

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN requetes.routed_to IS 'ID de l''utilisateur destinataire (enseignant ou responsable pédagogique) sélectionné par l''étudiant';
COMMENT ON COLUMN requetes.routed_to_role IS 'Rôle du destinataire (teacher, department_head, admin, etc.)';
