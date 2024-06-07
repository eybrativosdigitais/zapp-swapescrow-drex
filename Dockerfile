FROM node:18.20.3-alpine

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm i
COPY circuits ./circuits
COPY config ./config
COPY build/contracts ./build/contracts
COPY orchestration ./orchestration
COPY orchestration/public ./orchestration/public
COPY proving-files ./proving-files

EXPOSE 3000

CMD ["node", "orchestration/api.mjs"]
