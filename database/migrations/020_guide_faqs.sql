CREATE TABLE IF NOT EXISTS guide_faqs (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT    NOT NULL,
  answer      TEXT    NOT NULL,
  sort_order  INT     NOT NULL DEFAULT 0,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO guide_faqs (question, answer, sort_order) VALUES
  ('Dois-je créer un compte pour m''inscrire à un événement ?',
   'Non. Vous pouvez vous inscrire avec votre email et/ou numéro de téléphone, sans créer de compte. Un compte permet simplement de pré-remplir vos informations.',
   1),
  ('Comment récupérer mes billets si j''ai perdu l''email ?',
   'Rendez-vous sur /participant/tickets et entrez votre email d''inscription. Tous vos billets apparaissent automatiquement.',
   2),
  ('Combien coûte la création d''un événement ?',
   'La création d''un événement est gratuite. Pour les événements payants, une commission est prélevée sur les transactions Mobile Money.',
   3),
  ('Mon événement peut-il être rejeté ?',
   'Oui. L''équipe EventFlow examine chaque événement soumis pour s''assurer qu''il respecte les conditions d''utilisation avant publication.',
   4),
  ('Puis-je modifier un événement après publication ?',
   'Oui, depuis votre dashboard (onglet Événements → bouton Modifier). Certaines modifications peuvent nécessiter une nouvelle validation.',
   5)
ON CONFLICT DO NOTHING;
