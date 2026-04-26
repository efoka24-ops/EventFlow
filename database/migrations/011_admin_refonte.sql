-- Admin Refonte Migration
-- Adds featured/approval workflow on events, suspension on creator_accounts,
-- event_categories table, admin_roles table for full Super Admin back office

-- 1. Events: featured + approval status
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Events submitted by users start as pending approval
UPDATE events SET approval_status = 'pending' WHERE submitted_by_user = true AND approval_status = 'approved';

-- 2. Creator accounts: suspension + verification
ALTER TABLE creator_accounts
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS organizer_bio text,
  ADD COLUMN IF NOT EXISTS organizer_website text,
  ADD COLUMN IF NOT EXISTS organizer_category text;

-- 3. Event categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  color text DEFAULT '#6b7280',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

-- Seed default categories
INSERT INTO event_categories (name, slug, description, icon, color, sort_order) VALUES
  ('Musique', 'musique', 'Concerts, festivals et événements musicaux', 'Music', '#8b5cf6', 1),
  ('Sport', 'sport', 'Événements sportifs et compétitions', 'Trophy', '#10b981', 2),
  ('Business', 'business', 'Conférences, networking et événements professionnels', 'Briefcase', '#3b82f6', 3),
  ('Art & Culture', 'art-culture', 'Expositions, théâtre et événements culturels', 'Palette', '#ec4899', 4),
  ('Technologie', 'technologie', 'Hackathons, meetups tech et conférences IT', 'Cpu', '#f59e0b', 5),
  ('Gastronomie', 'gastronomie', 'Dégustations, food festivals et événements culinaires', 'UtensilsCrossed', '#ef4444', 6),
  ('Éducation', 'education', 'Formations, ateliers et séminaires', 'GraduationCap', '#06b6d4', 7),
  ('Mode & Beauté', 'mode-beaute', 'Défilés, salons de beauté et fashion shows', 'Sparkles', '#f97316', 8),
  ('Religion & Spiritualité', 'religion-spiritualite', 'Événements religieux et spirituels', 'Heart', '#84cc16', 9),
  ('Autre', 'autre', 'Autres types d''événements', 'Star', '#6b7280', 10)
ON CONFLICT (slug) DO NOTHING;

-- 4. Platform settings table (CMS + config)
CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value text,
  label text,
  description text,
  type text DEFAULT 'text' CHECK (type IN ('text', 'number', 'boolean', 'json', 'textarea')),
  category text DEFAULT 'general',
  updated_date timestamptz NOT NULL DEFAULT NOW(),
  updated_by uuid REFERENCES admin_accounts(id)
);

-- Seed default settings
INSERT INTO platform_settings (key, value, label, description, type, category) VALUES
  ('platform_name', 'EventFlow', 'Nom de la plateforme', 'Nom affiché sur le site', 'text', 'general'),
  ('platform_commission_rate', '10', 'Commission plateforme (%)', 'Pourcentage prélevé sur chaque paiement', 'number', 'finance'),
  ('platform_service_fee', '500', 'Frais de service (FCFA)', 'Frais fixes par transaction', 'number', 'finance'),
  ('event_approval_required', 'true', 'Approbation événements requise', 'Les événements soumis par les utilisateurs nécessitent une validation', 'boolean', 'events'),
  ('max_events_per_organizer', '50', 'Max événements par organisateur', 'Limite d''événements actifs par organisateur', 'number', 'events'),
  ('maintenance_mode', 'false', 'Mode maintenance', 'Activer le mode maintenance (site inaccessible au public)', 'boolean', 'technical'),
  ('smtp_from_name', 'EventFlow', 'Nom expéditeur email', 'Nom affiché dans les emails envoyés', 'text', 'notifications'),
  ('homepage_hero_title', 'Découvrez les meilleurs événements', 'Titre hero homepage', 'Titre principal de la page d''accueil', 'text', 'cms'),
  ('homepage_hero_subtitle', 'Trouvez et réservez vos événements préférés en quelques clics', 'Sous-titre hero homepage', 'Sous-titre de la page d''accueil', 'text', 'cms'),
  ('promo_banner_active', 'false', 'Bannière promo active', 'Afficher la bannière promotionnelle en haut du site', 'boolean', 'marketing'),
  ('promo_banner_text', '', 'Texte bannière promo', 'Texte de la bannière promotionnelle', 'text', 'marketing'),
  ('featured_events_count', '6', 'Nombre d''événements mis en avant', 'Nombre d''événements à afficher dans la section Featured', 'number', 'marketplace')
ON CONFLICT (key) DO NOTHING;

-- 5. Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code = UPPER(code)),
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT NOW(),
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES admin_accounts(id),
  created_date timestamptz NOT NULL DEFAULT NOW()
);

-- 6. Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_accounts(id),
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  created_date timestamptz NOT NULL DEFAULT NOW()
);

-- 7. User reports / signalements
CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_email text,
  reporter_name text,
  reported_type text NOT NULL CHECK (reported_type IN ('event', 'user', 'content')),
  reported_id text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  resolved_by uuid REFERENCES admin_accounts(id),
  resolved_at timestamptz,
  resolution_note text,
  created_date timestamptz NOT NULL DEFAULT NOW()
);
