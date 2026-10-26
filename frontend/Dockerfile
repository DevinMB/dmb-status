FROM node:22.23.3-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 1.30.6 fixes three HIGH nginx CVEs in 1.30.5; taken before the usual two-week wait.
FROM nginx:1.30.6-alpine
# Alpine security fixes land between base image releases; CI's Trivy gate
# fails on fixable HIGH and CRITICAL findings.
RUN apk upgrade --no-cache
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
ARG COMMIT=unknown
ENV COMMIT=$COMMIT
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
