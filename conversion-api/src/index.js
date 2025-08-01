import express from 'express';

import { isValidWav, checkFFmpegInstalled } from './helpers.js';
import { Converter } from './converter.js';

// API basics
const app = express();
const port = 3001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'audio/wav', limit: '50mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Definitions
const SUPPORTED_FORMATS = { 'mp3': 'audio/mpeg', 'ogg': 'audio/ogg' }

// Endpoints
app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/convert/:format', async (req, res) => {
  const targetFormat = req.params.format;
  // Check target
  if (!targetFormat || !Object.keys(SUPPORTED_FORMATS).includes(targetFormat)) {
    const msg = `You must provide supported target format: ${SUPPORTED_FORMATS}`
    res.status(422).json({ error: msg })
    return;
  }
  // Check input
  const wavData = req.body;
  const isValid = await isValidWav(wavData);
  if (!isValid) {
    const msg = "The file you provided is not valid WAV.";
    res.status(422).json({ error: msg });
    return;
  }
  // Check ffmpeg
  const isInstalled = await checkFFmpegInstalled();
  if (!isInstalled) {
    const msg = "FFmpeg isn't installed on server.";
    res.status(500).json({ error: msg });
    return;
  }
  // All good, convert WAV to lossy format
  const converter = new Converter();
  let lossyBuffer;
  try {
    if (targetFormat === 'mp3') {
      lossyBuffer = await converter.wavToMp3(wavData);
    }
    else if (targetFormat === 'ogg') {
      lossyBuffer = await converter.wavToOgg(wavData);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Conversion failed');
    return;
  }
  // Send result
  res.setHeader('Content-Type', SUPPORTED_FORMATS[targetFormat]);
  res.send(lossyBuffer);
});

// Run API
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
