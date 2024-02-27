# Beispiel: Wechseln zu einer neueren Node.js-Basisimage-Version
FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]
