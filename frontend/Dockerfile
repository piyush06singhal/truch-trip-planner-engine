# Use node runtime
FROM node:20-slim

# Set work directory
WORKDIR /app

# Copy package configurations
COPY package.json /app/

# Install packages
RUN npm install

# Copy source codes
COPY . /app/

# Expose Vite dev server port
EXPOSE 5173

# Execute dev command binding to host interface
CMD ["npm", "run", "dev"]
