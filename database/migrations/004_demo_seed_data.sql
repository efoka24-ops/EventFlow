-- Seed demo data for local/staging environments (idempotent)
-- WARNING: This migration inserts sample data. Avoid applying on production if not desired.

BEGIN;

-- Demo creator account (plain password kept for backward compatibility in current app)
INSERT INTO creator_accounts (id, full_name, email, phone, password, password_hash)
SELECT
  'f0868e31-6f66-4c08-a39e-f7e4f7b4ec7c'::uuid,
  'Demo Creator',
  'creator.demo@eventflow.local',
  '+237690000001',
  'demo1234',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM creator_accounts WHERE LOWER(email) = 'creator.demo@eventflow.local'
);

-- Demo events
INSERT INTO events (
  id,
  title,
  description,
  category,
  date_start,
  date_end,
  location_name,
  city,
  address,
  image_url,
  max_participants,
  price,
  status,
  tags,
  submitted_by_user,
  organizer_name,
  organizer_email,
  organizer_phone
)
VALUES
  (
    '3b9fbe2a-f6a1-48f9-8ab6-33b3c9bb87a5'::uuid,
    'Cameroon Tech Meetup 2026',
    'Conference focused on web, data and product communities.',
    'technologie',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 6 hours',
    'Douala Tech Hub',
    'Douala',
    'Akwa, Boulevard de la Liberte',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    300,
    5000,
    'publie',
    'tech,meetup,community',
    false,
    'EventFlow Team',
    'contact@eventflow.local',
    '+237690000010'
  ),
  (
    'a59ecf5f-8b0c-4f6b-a76e-cf9f4c4ac13c'::uuid,
    'Festival Urbain de Yaounde',
    'Open-air music and food event.',
    'festival',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days 8 hours',
    'Esplanade Hotel de Ville',
    'Yaounde',
    'Centre-ville',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    1000,
    2500,
    'publie',
    'festival,music,food',
    false,
    'Ville de Yaounde',
    'culture@eventflow.local',
    '+237690000011'
  )
ON CONFLICT (id) DO NOTHING;

-- Demo help articles
INSERT INTO help_articles (
  id,
  topic_id,
  topic_title,
  topic_description,
  topic_order,
  title,
  content,
  article_order
)
VALUES
  (
    '6caeec86-8f58-4d26-b4dc-18c81fe2e1b6'::uuid,
    'inscription',
    'Inscription',
    'Guide rapide pour participer a un evenement',
    1,
    'Comment s inscrire a un evenement',
    'Ouvrez la page evenement, cliquez sur Inscription puis remplissez le formulaire.',
    1
  ),
  (
    '8d3ec7de-c9cb-4cb7-941f-9fcb3d26963f'::uuid,
    'compte-createur',
    'Compte createur',
    'Publier et gerer ses evenements',
    2,
    'Comment creer un compte createur',
    'Depuis la page connexion, choisissez Createur puis completez les informations demandees.',
    1
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
