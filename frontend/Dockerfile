FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .
RUN yarn install --ignore-optional

COPY . .

EXPOSE 3000

CMD ["yarn", "start"]
