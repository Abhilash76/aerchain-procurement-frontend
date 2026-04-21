# Stage 1: Build
FROM node:20-bookworm-slim AS build_stage
WORKDIR /app

# Install build essentials for native bindings
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files from the current directory (src/)
COPY package.json package-lock.json* ./

# Clean install
RUN npm ci || npm install

# Copy everything from the src/ folder into /app
COPY . .

# IMPORTANT: If your files are nested like src/src/main.tsx, 
# we move them up so index.html can find them easily.
RUN if [ -d "src" ]; then mv src/* . && rm -rf src; fi

# Run build
RUN npm run build

# Stage 2: Production Server
FROM nginx:stable-alpine
COPY --from=build_stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]