import { readFileSync } from 'fs';

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function readJsonFile(path) {
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

export async function binaryStreamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}