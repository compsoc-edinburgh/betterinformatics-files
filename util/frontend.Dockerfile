FROM node:20-alpine

WORKDIR /app

COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN yarn install --ignore-engines

COPY frontend /app

EXPOSE 3000

CMD ["yarn", "start"]
