import { readFileSync } from 'fs';

export function readJsonFile(path) {
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}