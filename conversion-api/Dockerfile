FROM node:22

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

COPY . .
EXPOSE 3001
