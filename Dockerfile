# Use Node.js with Alpine for a small image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy only package files for caching dependencies layer
COPY package*.json .

# Install dependencies
RUN npm install

# Copy the entire app after installing dependencies
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose port via build arg
ARG PORT=6000
ENV PORT=${PORT}

EXPOSE ${PORT}

# Start the app
CMD ["npm", "run", "start"]
