FROM node:22.23.3-alpine

# Alpine security fixes land between base image releases; CI's Trivy gate
# fails on fixable HIGH and CRITICAL findings.
RUN apk upgrade --no-cache

WORKDIR /app
COPY package.json package-lock.json ./
# npm, npx, corepack and yarn leave after installing: they ship their own
# dependency trees (which Trivy flags) and the running API installs nothing.
RUN npm ci --omit=dev \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn* \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /root/.npm
COPY src/ ./src/

ARG COMMIT=unknown
ENV NODE_ENV=production COMMIT=$COMMIT
USER node
EXPOSE 3001
# The health route is static: it proves the process serves, without CouchDB.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health >/dev/null || exit 1
CMD ["node", "src/index.js"]
