FROM node:18-alpine

WORKDIR /app

# Install bash for seed script
RUN apk add --no-cache bash

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create data directory if not exists
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Run seed and start server
CMD ["sh", "-c", "node src/db/seed.js && node src/index.js"]