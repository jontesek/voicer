// Converting to MP3
import * as lamejs from '@breezystack/lamejs';

function base64ToArrayBuffer(base64String) {
    // Remove the data URI prefix if present
    const base64 = base64String.split(',')[1] || base64String;

    // Decode Base64 to a binary string
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    // Convert binary string to Uint8Array
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
}

/**
 * Converts WAV audio data from an ArrayBuffer to an MP3 Blob.
 *
 * @param {ArrayBuffer} wavArrayBuffer The ArrayBuffer containing the WAV audio data.
 * @param {number} [bitrate=128] The desired MP3 bitrate in kbps (e.g., 128, 192, 320).
 * @returns {Promise<Blob>} A Promise that resolves with the MP3 Blob.
 */
async function convertWavToMp3(wavArrayBuffer, bitrate = 128) {
    return new Promise((resolve, reject) => {
        try {
            // 1. Read WAV header from the ArrayBuffer
            // We need a DataView to read the header as it contains multi-byte values
            const wavDecoder = lamejs.WavHeader.readHeader(new DataView(wavArrayBuffer));

            // 2. Get WAV audio data as an array of samples (Int16Array is common for PCM)
            // The dataOffset tells us where the actual audio data begins in the ArrayBuffer
            // dataLen is the length of the audio data in bytes. Since Int16Array uses 2 bytes per sample,
            // we divide dataLen by 2 to get the number of samples.
            const wavSamples = new Int16Array(wavArrayBuffer, wavDecoder.dataOffset, wavDecoder.dataLen / 2);

            // 3. Create an MP3 encoder
            const mp3Encoder = new lamejs.Mp3Encoder(wavDecoder.channels, wavDecoder.sampleRate, bitrate);

            const mp3Data = [];
            const sampleBlockSize = 1152; // A common block size for LAME for optimal performance

            // 4. Encode WAV samples in chunks
            // This loop processes the WAV data in blocks, encoding each block to MP3 data.
            for (let i = 0; i < wavSamples.length; i += sampleBlockSize) {
                const sampleChunk = wavSamples.subarray(i, i + sampleBlockSize);
                // encodeBuffer returns a Uint8Array of MP3 data
                const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }

            // 5. Flush any remaining data from the encoder
            // After all samples are processed, call flush() to get any final bits.
            const end = mp3Encoder.flush();
            if (end.length > 0) {
                mp3Data.push(end);
            }

            // 6. Combine all MP3 data (Uint8Arrays) into a single Blob
            const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
            resolve(mp3Blob);
        } catch (error) {
            reject(error); // Reject the promise if any error occurs during the process
        }
    });
}

async function downloadMp3() {
    console.log("Downloading MP3 - converting from WAV");
    const wavArrayBuffer = base64ToArrayBuffer(generatedWav.value);
    const mp3Blob = await convertWavToMp3(wavArrayBuffer);

    const url = URL.createObjectURL(mp3Blob);
    const linkElm = document.getElementById('downloadMp3Btn');
    linkElm.href = url;
    linkElm.download = createFilename(audioForm.title, audioForm.text);

    setTimeout(() => {
        URL.revokeObjectURL(url);
        console.log('Object URL revoked after delay.');
    }, 200);
}