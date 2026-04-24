FROM node:22-slim

WORKDIR /app

# Install system dependencies if needed (slim needs more manual setup but is faster)
# For now, let's keep it simple.
COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
