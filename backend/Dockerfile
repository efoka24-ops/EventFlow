FROM node:22-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copie du code source
COPY . .

# Port exposé par le serveur Express (à vérifier dans src/server.js)
EXPOSE 3001

CMD ["npm", "start"]
