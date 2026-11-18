# ---- EstuLanches: imagem da aplicação ----
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# instala só dependências de produção (aproveita cache de camadas)
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public

# executa como usuário sem privilégios (segurança)
USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
