# Dockerfile para Frontend React
FROM node:18-alpine

# Configurar directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 5173

# Comando por defecto para desarrollo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
