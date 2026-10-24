FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/campusclaim.sqlite
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node","server/index.cjs"]
