-- Testimonials table for landing page social proof
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  city text,
  emoji text DEFAULT '🎤',
  quote text NOT NULL,
  stars integer NOT NULL DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_active_order ON testimonials (is_active, sort_order);

DROP TRIGGER IF EXISTS trg_testimonials_updated_date ON testimonials;
CREATE TRIGGER trg_testimonials_updated_date
BEFORE UPDATE ON testimonials
FOR EACH ROW EXECUTE FUNCTION set_updated_date();

-- Seed with the existing hardcoded testimonials
INSERT INTO testimonials (name, role, city, emoji, quote, stars, sort_order) VALUES
  ('Amara Diallo', 'Organisatrice formations', 'Dakar', '🎤',
   'EventFlow a transformé la façon dont nous gérons nos formations. Plus simple, plus de participants, plus de revenus.',
   5, 1),
  ('Kwame Mensah', 'Producteur musical', 'Lagos', '🎵',
   'Billets vendus en 24h, participants du Ghana, Cameroun, Bénin. La plateforme est vraiment pan-africaine.',
   5, 2),
  ('Zainab Hassan', 'CEO, Tech Summit Africa', 'Abuja', '💼',
   'Dashboard incroyable. Analytics, revenus, check-in QR. C''est tout ce qu''il nous fallait pour nos conférences.',
   5, 3)
ON CONFLICT DO NOTHING;
