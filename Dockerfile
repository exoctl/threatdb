FROM node:20-alpine

RUN apk add --no-cache python3 make g++ git

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps && npm install --save-dev electron-to-chromium

COPY . .

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview"]