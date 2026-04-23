-- Add extra FAQ Q/A entries to help center (idempotent)
INSERT INTO help_articles (id, topic_id, topic_title, topic_description, topic_order, title, content, article_order)
SELECT gen_random_uuid(), 'compte', 'Compte utilisateur', 'Creation, profil et acces utilisateur', 2,
       'Comment modifier mon profil ?',
       'Allez dans Mon espace > Parametres du compte pour modifier nom, email ou telephone.',
       2
WHERE NOT EXISTS (
  SELECT 1 FROM help_articles WHERE topic_id = 'compte' AND title = 'Comment modifier mon profil ?'
);

INSERT INTO help_articles (id, topic_id, topic_title, topic_description, topic_order, title, content, article_order)
SELECT gen_random_uuid(), 'compte', 'Compte utilisateur', 'Creation, profil et acces utilisateur', 2,
       'Comment changer mon mot de passe ?',
       'Dans Mon espace > Parametres du compte, renseignez le mot de passe actuel puis le nouveau mot de passe.',
       3
WHERE NOT EXISTS (
  SELECT 1 FROM help_articles WHERE topic_id = 'compte' AND title = 'Comment changer mon mot de passe ?'
);

INSERT INTO help_articles (id, topic_id, topic_title, topic_description, topic_order, title, content, article_order)
SELECT gen_random_uuid(), 'billets', 'Mes billets', 'Consultation et suivi des billets', 3,
       'Pourquoi je ne vois pas mes billets ?',
       'Connectez-vous avec votre compte. Mes billets est disponible uniquement pour les utilisateurs connectes.',
       1
WHERE NOT EXISTS (
  SELECT 1 FROM help_articles WHERE topic_id = 'billets' AND title = 'Pourquoi je ne vois pas mes billets ?'
);

INSERT INTO help_articles (id, topic_id, topic_title, topic_description, topic_order, title, content, article_order)
SELECT gen_random_uuid(), 'billets', 'Mes billets', 'Consultation et suivi des billets', 3,
       'Comment telecharger mon billet ?',
       'Ouvrez Mes billets puis cliquez sur Telecharger le billet (statut a jour).',
       2
WHERE NOT EXISTS (
  SELECT 1 FROM help_articles WHERE topic_id = 'billets' AND title = 'Comment telecharger mon billet ?'
);

INSERT INTO help_articles (id, topic_id, topic_title, topic_description, topic_order, title, content, article_order)
SELECT gen_random_uuid(), 'proposition', 'Proposer un evenement', 'Creation d evenements utilisateur', 4,
       'Pourquoi faut-il un compte pour proposer un evenement ?',
       'Le compte permet d associer l evenement a son proprietaire et de gerer son suivi dans Mes evenements.',
       1
WHERE NOT EXISTS (
  SELECT 1 FROM help_articles WHERE topic_id = 'proposition' AND title = 'Pourquoi faut-il un compte pour proposer un evenement ?'
);
