import express from 'express';

import { isValidWav, checkFFmpegInstalled } from './helpers.js';
import { wavToMp3 } from './converter.js';

// API basics
const app = express();
const port = 3001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'audio/wav', limit: '50mb' }));

// Endpoints
app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/convert/:format', async (req, res) => {
  const targetFormat = req.params.format;
  const supportedFormats = ['mp3', 'ogg'];
  // Check target
  if (!targetFormat || !supportedFormats.includes(targetFormat)) {
    const msg = `You must provide supported target format: ${supportedFormats}`
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
  let mp3Buffer;
  try {
    mp3Buffer = await wavToMp3(wavData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Conversion failed');
  }
  // Send result
  res.setHeader('Content-Type', 'audio/mpeg');
  res.send(mp3Buffer);
});

// Run API
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
