import { spawn } from 'child_process';


const MP3_ARGUMENTS = [
    '-f', 'wav',           // Input format
    '-i', 'pipe:0',        // Read from stdin
    '-c:a', 'libmp3lame',  // Use MP3 codec
    '-q:a', '4',           // Quality level
    '-f', 'mp3',           // Output format
    'pipe:1'               // Write to stdout
]

const OGG_ARGUMENTS = [
    '-f', 'wav',           // Input format
    '-i', 'pipe:0',        // Read from stdin
    '-c:a', 'libvorbis',   // Use Ogg Vorbis codec
    '-q:a', '0',           // Quality level
    '-f', 'ogg',           // Output format
    'pipe:1'               // Write to stdout
]


export class Converter {

    async #wavToLossy(wavBuffer, args) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const cmd = spawn('ffmpeg', args)

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

    async wavToMp3(wavBuffer) {
        return this.#wavToLossy(wavBuffer, MP3_ARGUMENTS)
    }

    async wavToOgg(wavBuffer) {
        return this.#wavToLossy(wavBuffer, OGG_ARGUMENTS)
    }

}
