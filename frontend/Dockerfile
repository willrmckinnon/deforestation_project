# Use Node
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY frontend/package*.json ./

# Install dependencies
RUN rm -rf node_modules package-lock.json || true
RUN npm install

# Copy source code
COPY frontend/ .

# Expose Vite port
EXPOSE 5173

# Start dev server
CMD ["npm", "run", "dev", "--", "--host"]