# Use a Node base image
FROM node:22

# Create app directory
WORKDIR /app

# Install python3, pip, and build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    pkg-config \
    libssl-dev \
&& rm -rf /var/lib/apt/lists/*

# Copy package.json and install deps
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Give execute permissions to entrypoint script
RUN chmod +x ./docker-entrypoint.sh

# Build if you're using TypeScript
RUN yarn build

# Expose a port (if not using dynamic port via env)
# EXPOSE 5000

# Start your Node.js app
CMD ["yarn", "start"]