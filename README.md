# Voicer

## Description

The app's goal is to perform Text-To-Speech for given input. It can also save the results to local DB. You can choose from several voices and describe the speaking style.

You need to provide your own Gemini API key. Right now, the app supports only `gemini-2.5-flash-preview-tts` model.

The [rate limit](https://ai.google.dev/gemini-api/docs/rate-limits#free-tier) for free account without billing is only 15 queries per day - so use them wisely.

The app saves the resulting WAV file, request details, response details. It also converts the file to MP3 and Ogg formats.

## Installation and usage

1. Go to [Google AI studio](https://aistudio.google.com/generate-speech) and [generate API key](https://aistudio.google.com/apikey) - save it somewhere as you won't see it again!
2. Clone this repository to your local computer.
3. Create `.env` file with line `GEMINI_API_KEY=xxx` (see [template.env](./template.env) for example)
4. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
5. Run `docker-compose up`
6. Go to http://localhost:5000/ to use the app.

## Some tips

1. Page `Account stats` shows number of TTS requests you made in the current quota window and when it resets.

2. Data is saved in folder `/local_data` in the cloned repo. When you delete the folder, you will loose all your data.

3. Speaking style works best if you start with verb like read. Example: `Read gently`.

4. If your Google Cloud account has billing enabled and/or has some money spend accumulated, you can enjoy higher rate limits and use the more advanced model `gemini-2.5-pro-preview-tts` (but you must allow the radio button in code :D).

## Development

The app is rather basic, it could be updated, I have some ideas. Originally I wanted to make it a SaaS offering, but that's even more work, so for now it's only local.

### Database

* [Minio](https://www.min.io/) - object storage for audio files
* SQLite - for audio details

### Structure

1. Backend API - written in Node.js and Express framework
2. Conversion API - uses [ffmpeg](https://ffmpeg.org/) to convert WAV to lossy format
3. Frontend - Vue.js app talking to Backend API, served by Nginx

Each project can be run in development mode by entering the respective folder:

* **Backend**: use `docker-compose up` for both Minio and Backend service to run in Docker. Use `npm run api` to run Backend locally, comment Backend service in the [docker-compose.yml](/backend/docker-compose.yml) to run only Minio. Either way, the backend runs on port 3000.

* **Conversion**: use `docker-compose up` to run the API on port 3001. If you feel adventurous, install ffmpeg locally and run via Node.js.

* **Frontend**: use `npm run dev` to launch the web app via Vite with Vue debugger (on port 5173).

### Tips

Environment variables `MINIO_HOST` and `CONVERSION_HOST` are used in Backend API. They must be set correctly - when run in docker, it's taken care of in `docker-compose.yml`. When you run the API locally, set them to `localhost`.

When you run Backend or Conversion API in development mode, your local source folder is mapped to container folder via volume (`.:/usr/src/app`). This means the changes are visible immediatelly, you don't have to rebuild the image (just restart the service). 

But if you want to test on the production setup (top level docker-compose via nginx), you must rebuilt all changed images. Use `docker-compose build` for that. Then reload the homepage (a few times) for changes to take effect.

### Code style

There are some ESlint rules defined for all projects (in `eslint.config.js`). We use double spaces for indentation.

In Frontend project the [Prettier config](./frontend/src/.prettierrc.json) is present to enforce more rules. You can run it with: `npx prettier . --write`

But for Vue files I prefer using Vue formatter in VSCode via Format document keyboard shortcut.
