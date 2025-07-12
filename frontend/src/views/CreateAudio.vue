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
                <p class="mb-1" :class="{ 'text-danger': isTokenCountOverLimit() }">Input tokens: {{getInputTokenCount()}} / {{ maxTokenCount }}</p>
                <p>Output tokens: {{ getOutputTokenCount(getInputTokenCount()) }} (estimate)</p>
            </div>
            <div class="mb-3">
                <label for="audioTitle" class="form-label"><strong>Title</strong> (optional):</label>
                <input type="text" class="form-control" id="audioTitle" v-model="audioForm.title">
            </div>
            <div>
                <button type="submit" class="btn btn-primary" :disabled="isTokenCountOverLimit() || genBtnDisabled">Generate</button>
                <span class="text-danger ms-2" v-if="isTokenCountOverLimit()">Too many tokens</span>
            </div>
            <div v-if="showGenInfo">
                <div>{{ genInfo }}</div>
                <div>
                    <audio v-if="generatedWav" :src="audioPrefix + generatedWav" controls />
                    <a v-if="generatedWav" :href="audioPrefix + generatedWav" :download="downloadFilename">Download WAV</a>
                </div>
                <div>
                    <button v-if="generatedWav" @click="saveToStorage" class="btn btn-success" type="button">Save to storage</button>
                    <span v-if="saveToStorageResult">{{ saveToStorageResult }}</span>
                </div>
            </div>
        </form>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, toRaw } from 'vue';
import { Tiktoken } from 'js-tiktoken/lite';
import voiceData from '@/data/voices.json';

// Preparation
let tiktokenEncoder;

onMounted(async () => {
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
const downloadFilename = ref(null);
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
    // Show result
    genBtnDisabled.value = false;
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
    downloadFilename.value = createFilename(audioForm.title, audioForm.text);
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
        return text.slice(0,10);
    }
} 

// Saving
const saveToStorage = async() => {
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
        saveToStorageResult.value=`Error while saving to storage: ${responseJson.error}`;
    }
    else {
        saveToStorageResult.value=`Saved to storage with ID ${responseJson.audioId}`;
    }
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