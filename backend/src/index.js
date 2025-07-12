import express from 'express';

import { AudioSaver } from './saver.js';
import { TtsApi } from './tts_api.js';
import { GEMINI_API_KEY } from './settings.js';
import {readJsonFile, sleep} from './helpers.js'

// API basics
const app = express();
const port = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));

// Custom objects
const ttsApi = new TtsApi(GEMINI_API_KEY);
const audioSaver = new AudioSaver();

// Endpoints
app.get('/api/ping', (req, res) => {
  res.send('pong');
});

app.post('/api/generate', async (req, res) => {
  const reqData = req.body;
  const _args = { model: reqData.model, voiceName: reqData.voiceName, temperature: reqData.temperature, style: reqData.style, text: reqData.text };
  // const result = await ttsApi.getSpeech(_args);
  // const result = {error: {code: 403, status: "V_PICI", message: "Je to v pici kamo."}};
  const result = readJsonFile('../files/tts_resp.json');
  // Handle problems
  if ('error' in result) {
    const code = result.error.code;
    res.status(code).json({error: result.error.status});
    return;
  }
  // await sleep(2000);
  // All good
  res.json(result);
});

app.post('/api/save', async (req, res) => {
  const reqData = req.body;
  const result = await audioSaver.saveAudio(reqData.generationInputs, reqData.generatedWav, reqData.generatedMetadata);
  // Handle problems
  if ('error' in result) {
    const code = result.error.code;
    res.status(code).json({error: result.error.status});
    return;
  }
  // All good
  res.json(result);
});

// Run API
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
