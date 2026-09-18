FROM node:24-alpine

# ENV GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/serviceAccountKey.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase-service-account

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

EXPOSE 4000

HEALTHCHECK  CMD curl -f http://localhost:4000/health || exit 1

CMD ["npm", "start"]