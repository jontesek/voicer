<template>
    <div class="create-audio-page">
        <h2 class="mb-4">Create New Audio</h2>
        <form @submit.prevent="generateAudio">
            <div class="mb-3">
                <p class="mb-1 fw-bold">Speech model:</p>
                <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="audioForm.model" id="speechBasicOption"
                        value="basic">
                    <label class="form-check-label" for="aqBasicOption" checked>Basic</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="audioForm.model" id="speechAdvancedOption"
                        value="advanced">
                    <label class="form-check-label" for="aqAdvancedOption">Advanced</label>
                </div>
            </div>
            <div class="mb-3">
                <label for="voiceSelect" class="me-1 fw-bold">Voice name:</label>
                <select id="voiceSelect" class="form-select" v-model="audioForm.voiceName">
                    <option v-for="voice in voices" :key="voice.name" :value="voice.name">
                        {{ voice.name }} - {{ voice.mood }}, {{ voice.pitch }} pitch
                    </option>
                </select>
            </div>
            <div class="mb-3">
                <label for="audioTemp" class="form-label"><strong>Temperature</strong> (expresivity):</label>
                <input type="range" class="form-range w-25 ms-2 me-2 pt-3" id="audioTemp" min="0" max="2" step="0.05"
                    value="1" v-model="audioForm.temperature">
                <span id="audioTempValue">{{ audioForm.temperature }}</span>
            </div>
            <div class="mb-3">
                <label for="audioStyle" class="form-label"><strong>Style instructions</strong> (optional):</label>
                <textarea class="form-control" id="audioStyle" v-model="audioForm.style"></textarea>
            </div>
            <div class="mb-3">
                <label for="audioText" class="form-label fw-bold">Text:</label>
                <textarea class="form-control" id="audioText" v-model="audioForm.text" required></textarea>
            </div>
            <div>
                <p class="mb-1" :class="{ 'text-danger': isTokenCountOverLimit() }">Input tokens:
{{ getInputTokenCount() }} / {{ maxTokenCount }}</p>
                <p>Output tokens: {{ getOutputTokenCount(getInputTokenCount()) }} (estimate)</p>
            </div>
            <div class="mb-3">
                <label for="audioTitle" class="form-label"><strong>Title</strong> (optional):</label>
                <input type="text" class="form-control" id="audioTitle" v-model="audioForm.title">
            </div>
            <div>
                <button type="submit" class="btn btn-primary"
                    :disabled="isTokenCountOverLimit() || genBtnDisabled">Generate</button>
                <span class="text-danger ms-2" v-if="isTokenCountOverLimit()">Too many tokens</span>
            </div>
            <div v-if="showGenInfo">
                <div>{{ genInfo }}</div>
                <div v-if="generatedWav">
                    <audio :src="audioPrefix + generatedWav" controls />
                    <a :href="audioPrefix + generatedWav" :download="createFilename(audioForm.title, audioForm.text)" class="me-2">Download WAV</a>
                    <a id="downloadMp3Btn" @click="downloadMp3" href="#" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="takes some time">Download MP3</a>
                </div>
                <div>
                    <button v-if="generatedWav" @click="saveToStorage" class="btn btn-success" type="button">Save to
                        storage</button>
                    <span v-if="saveToStorageResult">{{ saveToStorageResult }}</span>
                </div>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, toRaw, nextTick } from 'vue';
import { Tooltip } from 'bootstrap';
import { Tiktoken } from 'js-tiktoken/lite';
import voiceData from '@/data/voices.json';

// Preparation
let tiktokenEncoder;

onMounted(async () => {
    // Prepare tokenizer
    const res = await fetch('https://tiktoken.pages.dev/js/o200k_base.json');
    const encoding = await res.json();
    tiktokenEncoder = new Tiktoken(encoding);
});

// Reactive state for the form data
const audioForm = reactive({
    model: '',
    title: '',
    text: '',
    voiceName: '',
    temperature: '',
    style: ''
});

// Data
const voices = ref(voiceData);

// Generating
const generatedWav = ref(null);
const showGenInfo = ref(false);
const genInfo = ref(null);
const genBtnDisabled = ref(false);
const audioPrefix = 'data:audio/wav;base64,';
let generatedMetadata = null;
const saveToStorageResult = ref(null);

// Defaults
audioForm.voiceName = voices.value[1].name;
audioForm.temperature = 1;
audioForm.model = 'basic';

// Limits
const maxTokenCount = 1100;

// Main
const generateAudio = async () => {
    // Remove player
    generatedWav.value = null;
    // Show temp info
    genBtnDisabled.value = true;
    showGenInfo.value = true;
    genInfo.value = 'Processing...';
    // Contact API
    const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify(audioForm),
        headers: { 'Content-Type': 'application/json' }
    });
    // Enable button
    genBtnDisabled.value = false;
    // Backend failure
    if (response.status >= 500) {
        genInfo.value = "Problem with backend.";
        return;
    }
    const responseData = await response.json();
    // Problem arised
    if ('error' in responseData) {
        genInfo.value = JSON.stringify(responseData);
        return;
    }
    // All good
    genInfo.value = JSON.stringify(responseData.metadata);
    generatedMetadata = responseData.metadata;
    generatedWav.value = responseData.wavData;
    // Prepare tooltip - wait for DOM refresh
    nextTick(() => {
        new Tooltip(document.getElementById('downloadMp3Btn'));
    });
};

// Method to count tokens
function getInputTokenCount() {
    const prompt = audioForm.style + "\n\n" + audioForm.text;
    return countTokens(prompt);
}

function countTokens(str) {
    if (!tiktokenEncoder) return 0;
    return tiktokenEncoder.encode(str).length;
}

function isTokenCountOverLimit() {
    // Add some slack to allow for mismatch with Gemini parser
    const margin = Math.ceil(maxTokenCount * 0.01);
    const count = getInputTokenCount() + margin;
    return count > maxTokenCount;
}

function getOutputTokenCount(inputCount) {
    return inputCount * 5;
}

// Other helpers
function createFilename(title, text) {
    if (title.length > 0) {
        return title;
    }
    else {
        return text.slice(0, 10);
    }
}

// Saving
const saveToStorage = async () => {
    console.log('Clicked!');
    const reqData = {
        generationInputs: toRaw(audioForm),
        generatedWav: generatedWav.value,
        generatedMetadata: generatedMetadata
    }
    console.log(reqData);
    const response = await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(reqData),
        headers: { 'Content-Type': 'application/json' }
    });
    const responseJson = await response.json();
    if ('error' in responseJson) {
        saveToStorageResult.value = `Error while saving to storage: ${responseJson.error}`;
    }
    else {
        saveToStorageResult.value = `Saved to storage with ID ${responseJson.audioId}`;
    }
}

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

</script>

<style scoped>
.create-audio-page {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

#audioText {
    height: 200px;
}
</style>