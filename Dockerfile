# Använd en officiell och lättvikts Node-image
FROM node:20-alpine

# Sätt arbetskatalogen i containern
WORKDIR /usr/src/app

# Kopiera package.json och installera beroenden
COPY package*.json ./
RUN npm install --production

# Kopiera resten av källkoden (server.js och public/)
COPY . .

# Exponera porten som Express-servern körs på
EXPOSE 3000

# Starta applikationen
CMD ["node", "server.js"]