import { spawn } from 'child_process';


export async function wavToMp3(wavBuffer) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        const cmd = spawn('ffmpeg', [
            '-f', 'wav',           // Input format
            '-i', 'pipe:0',        // Read from stdin
            '-c:a', 'libmp3lame',  // Use MP3 codec
            '-q:a', '4',           // Quality level
            '-f', 'mp3',           // Output format
            'pipe:1'               // Write to stdout
        ]);

        // Handle data stream
        cmd.stdout.on('data', (chunk) => chunks.push(chunk));
        cmd.stderr.on('data', (err) => console.error('ffmpeg error:', err.toString()));

        cmd.on('close', (code) => {
            if (code === 0) {
                resolve(Buffer.concat(chunks));
            } else {
                reject(new Error(`ffmpeg exited with code ${code}`));
            }
        });

        // Write input WAV buffer
        cmd.stdin.write(wavBuffer);
        cmd.stdin.end();
    });
}