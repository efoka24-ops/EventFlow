FROM node:22-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copie du code source
COPY . .

# Configuration du script de démarrage
RUN chmod +x /app/entrypoint.sh

# Port exposé
EXPOSE 3001

ENTRYPOINT ["/app/entrypoint.sh"]
