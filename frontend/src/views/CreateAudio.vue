<template>
    <div class="create-audio-page">
        <h2 class="mb-4">Create New Audio</h2>
        <form @submit.prevent="generateAudio">
            <div class="mb-3">
                <label for="audioTitle" class="form-label"><strong>Title</strong> (optional):</label>
                <input type="text" class="form-control" id="audioTitle" v-model="audioForm.title">
            </div>
            <div class="mb-3">
                <p class="mb-1 fw-bold">Speech model:</p>
                <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="audioForm.model" id="speechBasicOption"
                        value="basic">
                    <label class="form-check-label" for="aqBasicOption" checked>Basic</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" v-model="audioForm.model" id="speechAdvancedOption"
                        value="advanced" disabled>
                    <label class="form-check-label" for="aqAdvancedOption">Advanced</label>
                </div>
            </div>
            <div class="mb-3">
                <label for="voiceSelect" class="me-1 fw-bold">Voice name:</label>
                <select id="voiceSelect" class="form-select" v-model="audioForm.voiceName">
                    <option v-for="voice in voices" :key="voice.name" :value="voice.name">
                        {{ voice.name }} - {{ voice.gender}}, {{ voice.mood }}, {{ voice.pitch }} pitch
                    </option>
                </select>
            </div>
            <div class="mb-3">
                <label for="audioTemp" class="form-label"><strong>Temperature</strong> (expressivity):</label>
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
                    {{ getInputTokenCount() }} / {{ MAX_TOKEN_COUNT }}</p>
                <p>Output tokens: {{ getOutputTokenCount(getInputTokenCount()) }} (estimate)</p>
            </div>
            <div class="generate-btn-section">
                <button type="submit" class="btn btn-primary me-3"
                    :disabled="isTokenCountOverLimit() || genBtnDisabled">Generate</button>
                <span class="text-danger" v-if="isTokenCountOverLimit()">Too many tokens</span>
                <span v-if="showGenInfo">
                    <span v-if="genInfoType === GEN_INFO_PROCESSING">Processing... </span> 
                    <button v-if="genInfoType === GEN_INFO_PROCESSING" class="cancel-btn" aria-label="Cancel" title="Cancel"
                        @click="handleCancel()"><i class="bi bi-x-circle cancel-icon align-middle"></i></button>
                    <span v-if="genInfoType === GEN_INFO_ERROR" class="text-danger">
                        Error: {{ genInfo }}
                    </span>
                </span>
            </div>
        </form>
        <div v-if="generatedWav" class="mt-3">
            <h4>Processing details</h4>
            Real input tokens: {{ generatedMetadata.inputTokenCount }}, Real output
            tokens: {{ generatedMetadata.outputTokenCount }}, Audio duration: {{ formatDuration(generatedMetadata.audioDuration) }},
            Generated in: {{ formatDuration(generatedMetadata.generationDuration) }}
            <h4 class="mt-3">Audio file</h4>
            <div class="audio-file mb-4">
                <audio :src="audioPrefix + generatedWav" controls />
                <ul>
                    <li><a href="#" @click.prevent="downloadWav()">Download WAV</a></li>
                    <li><a class="convert-tooltip" @click.prevent="downloadLossy('mp3')" href="#"
                            data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="takes some time">Download
                            MP3</a>
                    </li>
                    <li><a class="convert-tooltip" @click.prevent="downloadLossy('ogg')" href="#"
                            data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="takes some time">Download
                            Ogg</a>
                    </li>
                </ul>
            </div>
            <div>
                <button @click="saveToStorage" class="btn btn-success me-3" type="button">Save to storage</button>
                <span v-if="saveToStorageInProcess">Saving...</span>
                <span v-if="saveToStorageSuccessId">Saved to storage with ID {{ saveToStorageSuccessId }}: <router-link :to="{ name: 'AudioDetail', params: { id: saveToStorageSuccessId } }">see detail</router-link></span>
                <span v-if="saveToStorageError" class="text-danger">Error while saving to storage: {{ saveToStorageError }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, toRaw, nextTick } from 'vue';
import { Tooltip } from 'bootstrap';
import { Tiktoken } from 'js-tiktoken/lite';
import Choices from 'choices.js'

import { createFilename } from '@/utils/createFilename';
import { formatDuration } from '@/utils/formatDuration';
import { revokeAfterDelay } from '@/utils/revokeAfterDelay';

import voiceData from '@/data/voices.json';

// Preparation
let tiktokenEncoder;

const choiceOptions = {
    searchResultLimit: -1,
    shouldSort: false,
    fuseOptions: {
      includeScore: true,
      threshold: 0.5,
      //ignoreLocation: false
    }
}

// Lifecycle
onMounted(async () => {
    // Prepare tokenizer
    const res = await fetch('https://tiktoken.pages.dev/js/o200k_base.json');
    const encoding = await res.json();
    tiktokenEncoder = new Tiktoken(encoding);
    // Prepare voice select
    const element = document.getElementById('voiceSelect');
    new Choices(element, choiceOptions);
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

// Load data for Voice select
const voices = ref(voiceData);

// UI variables
const generatedWav = ref(null);
const showGenInfo = ref(false);
const genInfo = ref(null);
const genInfoType = ref(null);
const genBtnDisabled = ref(false);
const audioPrefix = 'data:audio/wav;base64,';
const generatedMetadata = ref(null);
const cancelGenerate = ref(false);
const saveToStorageSuccessId = ref(null);
const saveToStorageError = ref(null);
const saveToStorageInProcess = ref(false);

// Defaults
audioForm.voiceName = voices.value[1].name;
audioForm.temperature = 1;
audioForm.model = 'basic';

// Constants
const MAX_TOKEN_COUNT = 1100;
const GEN_INFO_PROCESSING = 'processing';
const GEN_INFO_ERROR = 'error';

// Main
const generateAudio = async () => {
    // Show temp info
    genBtnDisabled.value = true;
    showGenInfo.value = true;
    genInfoType.value = GEN_INFO_PROCESSING;
    // Contact API
    const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify(audioForm),
        headers: { 'Content-Type': 'application/json' }
    });
    // End if generation was cancelled by user
    if (cancelGenerate.value === true) {
        cancelGenerate.value = false;
        return;
    }
    // Reset generating
    genBtnDisabled.value = false;
    genInfoType.value = null;
    // Backend failure
    if (response.status >= 500) {
        genInfo.value = "Problem with backend.";
        genInfoType.value = GEN_INFO_ERROR;
        return;
    }
    const responseData = await response.json();
    // Problem arised
    if ('error' in responseData) {
        genInfo.value = responseData.error;
        genInfoType.value = GEN_INFO_ERROR;
        return;
    }
    // All good
    generatedWav.value = responseData.wavData;
    generatedMetadata.value = responseData.metadata;
    // Prepare tooltip - wait for DOM refresh
    nextTick(() => {
        const tooltips = document.getElementsByClassName('convert-tooltip');
        for (const elm of tooltips) {
            new Tooltip(elm);
        }
    });
};

function handleCancel() {
    showGenInfo.value = false;
    genBtnDisabled.value = false;
    cancelGenerate.value = true;
}

const saveToStorage = async () => {
    // Reset all
    saveToStorageInProcess.value = true;
    saveToStorageError.value = undefined;
    saveToStorageSuccessId.value = undefined;
    // Setup request
    const reqData = {
        generationInputs: toRaw(audioForm),
        generatedWav: generatedWav.value,
        generatedMetadata: generatedMetadata.value
    }
    console.log(reqData);
    // Send request
    const response = await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(reqData),
        headers: { 'Content-Type': 'application/json' }
    });
    // Show result
    const responseJson = await response.json();
    saveToStorageInProcess.value = false;
    if ('error' in responseJson) {
        saveToStorageError.value = responseJson.error;
    }
    else {
        saveToStorageSuccessId.value = responseJson.audioId;
    }
}

// Downloading
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

async function downloadLossy(format) {
    console.log(`Downloading ${format} - converting from WAV`);

    // From base64 to binary
    const wavbuffer = base64ToArrayBuffer(generatedWav.value);

    // Request conversion
    const response = await fetch(`/api/convert/${format}`, {
        method: 'POST',
        body: wavbuffer,
        headers: { 'Content-Type': 'audio/wav' }
    });
    const lossyBlob = await response.blob();

    // Download file
    const blobUrl = URL.createObjectURL(lossyBlob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = createFilename(audioForm.title, audioForm.text);
    anchor.click()

    // Cleanup
    revokeAfterDelay(blobUrl);
}

async function downloadWav() {
    console.log('Downloading WAV - converting from base64');

    // From base64 to binary
    const wavbuffer = base64ToArrayBuffer(generatedWav.value);
    const wavBlob = new Blob([wavbuffer], { type: 'audio/wav' });

    // Download file
    const blobUrl = URL.createObjectURL(wavBlob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = createFilename(audioForm.title, audioForm.text);
    anchor.click()

    // Cleanup
    revokeAfterDelay(blobUrl);
}

// Token count
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
    const margin = Math.ceil(MAX_TOKEN_COUNT * 0.01);
    const count = getInputTokenCount() + margin;
    return count > MAX_TOKEN_COUNT;
}

function getOutputTokenCount(inputCount) {
    return inputCount * 5;
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

.cancel-btn {
  background: none;
  border: none;
  padding: 0;
}

.cancel-icon {
    font-size: 1.5em;
}

.generate-btn-section {
    display: flex;
    align-items: center;
}

.audio-file {
    display: flex;
    align-items: center;
}

.audio-file ul {
    display: inline;
    margin: 0 0 0 20px;
    padding: 0;
}

.audio-file li {
    display: inline;
    margin-right: 20px;
}
</style>