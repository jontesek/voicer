import express from 'express';
const Minio = await import('minio'); // minio has no default export

import { AudioSaver } from './saver.js';
import { UsageTracker } from './tracker.js';
import { TtsApi } from './tts_api.js';
import { GEMINI_API_KEY, DB_FILE_PATH, MINIO_HOST, CONVERTER_API_URL } from './settings.js';
import { readJsonFile, sleep } from './helpers.js';
import { getDbConnection, defineAudioModel, defineTtsRequestModel } from './database.js';
import { convertToLossy } from './convert.js';

// API basics
const app = express();
const port = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'audio/wav', limit: '50mb' }));

// Database
const dbConn = getDbConnection(DB_FILE_PATH);
const audioDbModel = defineAudioModel(dbConn);
const ttsRequestDbModel = defineTtsRequestModel(dbConn);
// Update DB
// await dbConn.sync();
// process.exit();

// Working objects
const ttsApi = new TtsApi(GEMINI_API_KEY);
const s3Client = new Minio.Client({
  endPoint: MINIO_HOST,
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin'
});
const audioSaver = new AudioSaver(audioDbModel, s3Client);
const usageTracker = new UsageTracker(ttsRequestDbModel);

// Constants
const AUDIO_CONTENT_TYPES = { wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg' };

// Endpoints
app.get('/api/ping', (req, res) => {
  res.send('pong');
});

app.post('/api/generate', async (req, res) => {
  const reqData = req.body;
  let _args = { model: reqData.model, voiceName: reqData.voiceName, temperature: reqData.temperature, style: reqData.style, text: reqData.text };
  const result = await ttsApi.getSpeech(_args);
  // const result = {error: {code: 403, status: "V_PICI", message: "Je to v pici kamo."}};
  //await sleep(5000);
  //const result = readJsonFile('../files/tts_resp.json');
  // Track usage
  _args = { model: reqData.model, styleLength: reqData.style?.length ?? 0, textLength: reqData.text.length };
  const requestDbObj = await usageTracker.saveRequest(_args);
  // Handle problems
  if ('error' in result) {
    const code = result.error.code;
    res.status(code).json({ error: result.error.status });
    await usageTracker.updateRequest(requestDbObj, false);
    return;
  }
  // await sleep(2000);
  // All good
  await usageTracker.updateRequest(requestDbObj, true);
  res.json(result);
});

app.post('/api/save', async (req, res) => {
  const reqData = req.body;
  const result = await audioSaver.saveNew(reqData.generationInputs, reqData.generatedMetadata, reqData.generatedWav);
  //const result = {audioId: 13};
  res.json(result);
});

app.get('/api/getAll', async (req, res) => {
  const result = await audioSaver.getAll();
  res.json(result);
});

app.delete('/api/delete/:id', async (req, res) => {
  const id = req.params.id;
  const result = await audioSaver.delete(id);
  // Handle problem
  if ('error' in result) {
    const code = result.error.code;
    res.status(code).json({ error: result.error.msg });
    return;
  }
  // Return dummy response
  res.json({ status: 'ok' });
});

app.get('/api/getSound', async (req, res) => {
  const filePath = req.query.filePath;
  const result = await audioSaver.getSound(filePath);
  // Handle problem
  if ('error' in result) {
    const code = result.error.code;
    res.status(code).json({ error: result.error.msg });
    return;
  }
  // Get file type
  const fileFormat = filePath.slice(-3);
  const contentType = AUDIO_CONTENT_TYPES[fileFormat];
  if (!contentType) {
    res.status(415).json({ error: "Unsupported file type" });
    return;
  }
  const soundBuffer = result.soundData;
  // Send in proper format
  res.set({
    'Content-Type': contentType,
    'Content-Disposition': 'inline',
  });
  res.send(soundBuffer);
});

app.get('/api/get/:id', async (req, res) => {
  const id = req.params.id;
  const result = await audioSaver.get(id);
  // Handle problem
  if ('error' in result) {
    const code = result.error.code;
    res.status(code).json({ error: result.error.msg });
    return;
  }
  // Return data
  res.json(result);
});

app.post('/api/convert/:format', async (req, res) => {
  const targetFormat = req.params.format;
  const lossyBuffer = await convertToLossy(CONVERTER_API_URL, req.body, targetFormat);
  res.setHeader('Content-Type', AUDIO_CONTENT_TYPES[targetFormat]);
  res.send(lossyBuffer);
});

app.get('/api/request-count', async (req, res) => {
  // Get date param
  const sinceDtParam = req.query.sinceDt;
  const sinceDtObj = new Date(sinceDtParam);
  // Check format
  if (!sinceDtParam || sinceDtObj == 'Invalid Date') {
    const msg = 'You must provide a valid datetime in ISO format.'
    res.status(422).send({ error: msg })
    return;
  }
  // Get data
  const count = await usageTracker.getRequestCount(sinceDtObj);
  res.send(count);
});

app.patch('/api/audios/:id', async (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  const result = await audioSaver.update(id, title);
  if ('error' in result) {
    res.status(result.error.code).json({ error: result.error.msg });
    return;
  }
  res.send('ok');
});


// Run API
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
