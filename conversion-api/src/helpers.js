import wav from 'wav';
import { spawn } from 'child_process';


export async function isValidWav(requestBody) {
  return new Promise((resolve) => {

    if (!requestBody) {
      resolve(false);
    }

    const reader = new wav.Reader();

    reader.on('format', (format) => {
      console.debug('WAV format:', format);
      resolve(true);
    });

    reader.on('error', (err) => {
      console.error('Invalid WAV:', err.message);
      resolve(false);
    });

    reader.end(requestBody)
  })
}


export async function checkFFmpegInstalled() {
  return new Promise((resolve) => {
    const cmd = spawn('which', ['ffmpeg']);
    let result = '';
    // Read output
    cmd.stdout.on('data', (data) => {
      result += data.toString();
    });
    // Check if there was any output
    cmd.on('close', () => {
      resolve(result.trim().length > 0);
    });
  });
}
