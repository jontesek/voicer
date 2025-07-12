import wav from 'wav';
import { Writable } from 'stream';


const WAV_CONFIG = {
  channels: 1,
  sampleRate: 24000,
  bitDepth: 16 // sampleWidth 2 -> 2*8
}


export function getWavBuffer(pcmBuffer) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    // Create a writable stream to collect WAV data
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });

    // Create WAV writer with desired format
    const writer = new wav.Writer(WAV_CONFIG);

    writer.pipe(writable);
    writer.end(pcmBuffer); // Write PCM data and finalize WAV

    writable.on('finish', () => {
      resolve(Buffer.concat(chunks));
    });

    writable.on('error', reject);
  });
}


export function getWavDuration(wavBuffer) {
  const bytesPerSample = WAV_CONFIG.bitDepth / 8;
  const totalSamples = wavBuffer.length - 44; // subtract header size
  const duration = totalSamples / (WAV_CONFIG.sampleRate * WAV_CONFIG.channels * bytesPerSample);
  return duration;
}