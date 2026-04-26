# EventFlow

## Deploiement live

Le pipeline GitHub de [.github/workflows/deploy.yml](.github/workflows/deploy.yml) sait deja ecrire un fichier `.env` de production depuis le secret `DEPLOY_ENV_FILE_B64`.

Pour que le live reprenne les memes valeurs que votre local actuel:

1. Prenez les variables de `backend/.env` et reportez-les dans le fichier de deploiement utilise par le serveur.
2. Encodez ce fichier en base64 et placez-le dans le secret GitHub `DEPLOY_ENV_FILE_B64`, ou conservez un `.env` directement sur le serveur.
3. Le [docker-compose.yml](docker-compose.yml) transmet maintenant au backend les variables critiques utilisees en local: `DATABASE_URL`, `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`, `JWT_*`, `ADMIN_*`, `CAMPAY_*`, `ET_*`, `SMTP_*` et `CORS_ORIGIN`.
4. Si `DATABASE_URL` est present, il est prioritaire et le live peut reutiliser la meme base/configuration que votre environnement local actuel. Sinon, le compose retombe sur le conteneur Postgres `eventflow-db`.

Un modele de fichier de deploiement est disponible dans [.env.example](.env.example).