-- Seed default help articles when table is empty (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM help_articles LIMIT 1) THEN
    INSERT INTO help_articles (
      id,
      topic_id,
      topic_title,
      topic_description,
      topic_order,
      title,
      content,
      article_order
    ) VALUES
      (
        gen_random_uuid(),
        'inscription',
        'Inscription',
        'Guide rapide pour participer aux evenements',
        1,
        'Comment s inscrire a un evenement',
        'Ouvrez la page evenement, cliquez sur Inscription, puis remplissez le formulaire unique.',
        1
      ),
      (
        gen_random_uuid(),
        'compte',
        'Compte utilisateur',
        'Creation et connexion au compte',
        2,
        'Pourquoi creer un compte',
        'Un compte est requis pour consulter vos billets et suivre vos inscriptions.',
        1
      ),
      (
        gen_random_uuid(),
        'paiement',
        'Paiement',
        'Statuts et validation des paiements',
        3,
        'Comment verifier un paiement',
        'Le statut est actualise automatiquement dans votre suivi de billet.',
        1
      );
  END IF;
END $$;
