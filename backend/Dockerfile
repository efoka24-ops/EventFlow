FROM node:22-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copie du code source
COPY . .

# Création d'un script de démarrage qui init la DB
RUN echo '#!/bin/sh\nnpm run db:init || echo "DB already initialized or init failed"\nnpm start' > /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Port exposé
EXPOSE 3001

CMD ["/app/entrypoint.sh"]
