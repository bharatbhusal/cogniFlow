FROM node:20-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# Serve built files using Vite preview (production-like server)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
