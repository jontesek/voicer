<template>
    <div class="create-audio-page">
        <h2 class="mb-4">Audio detail n. {{ audioId }}</h2>

        <div v-if="idNotFound" class="bg-danger text-white p-3">Cannot find audio with ID {{ audioId }}.</div>

        <div v-else>

            <p>Created at: {{ formatDatetime(audioForm.createdAt) }}<br>
                Updated at: {{ formatDatetime(audioForm.createdAt) }}</p>

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
                    <input type="range" class="form-range w-25 ms-2 me-2 pt-3" id="audioTemp" min="0" max="2"
                        step="0.05" value="1" v-model="audioForm.temperature">
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
            </form>
                <div class="mb-3">
                    <h4>Metadata</h4>
                    <ul>
                        <li>Input tokens: {{ audioForm.inputTokenCount }}</li>
                        <li>Output tokens: {{ audioForm.outputTokenCount }}</li>
                        <li>Audio duration: {{ formatDuration(audioForm.audioDuration) }}</li>
                        <li>Generated in: {{ formatDuration(audioForm.generationDuration) }}</li>
                    </ul>
                </div>
                <div v-if="audioFileTmpUrl" class="mb-3">
                    <h4>Audio file</h4>
                    <div class="audio-file">
                        <audio controls>
                            <source :src="audioFileTmpUrl" type="audio/ogg">
                        </audio>
                        <ul class="download-links">
                            <li><a :href="audioFileTmpUrl" :download="downloadFileName">Download Ogg</a></li>
                            <li><a href="#" :download="downloadFileName" @click.prevent="downloadSound('mp3')">Download
                                    MP3</a></li>
                            <li><a href="#" :download="downloadFileName" @click.prevent="downloadSound('wav')">Download
                                    WAV</a></li>
                        </ul>
                    </div>
                </div>
                <div class="mt-4">
                    <button @click="deleteAudio" type="button" class="btn btn-danger">Delete audio</button>
                </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router'

import { createFilename } from '@/utils/createFilename';
import { formatDatetime } from '@/utils/formatDatetime';
import { formatDuration } from '@/utils/formatDuration';

import voiceList from '@/data/voices.json';

// Referenced variables
const idNotFound = ref(false);
const voices = ref(voiceList);
const audioForm = ref({});
const audioFileTmpUrl = ref(undefined);
const downloadFilePaths = reactive({ wav: '', mp3: '', ogg: '' })
const downloadFileName = ref('');

// Load data
const route = useRoute();
const router = useRouter();
const audioId = route.params.id;

onMounted(async () => {
    fetchAudio(audioId);
})

const fetchAudio = async (id) => {
    // Get data
    const response = await fetch(`/api/get/${id}`);
    const response_json = await response.json();
    if (!response.ok) {
        console.error(response_json.error);
        idNotFound.value = true;
        return;
    }
    // Put data into form
    audioForm.value = { ...response_json };
    console.log(response_json);
    // Get sound for playback
    audioFileTmpUrl.value = await fetchSound(response_json.oggFilePath);
    // Save file paths for download
    downloadFilePaths.ogg = response_json.oggFilePath;
    downloadFilePaths.mp3 = response_json.mp3FilePath;
    downloadFilePaths.wav = response_json.wavFilePath;
    // Set file name - extension based on Content-Type in Object URL
    downloadFileName.value = createFilename(audioForm.value.title, audioForm.value.text, audioId, audioForm.value.createdAt);
}

const fetchSound = async (soundFilePath) => {
    // Get file from API
    const encodedPath = encodeURIComponent(soundFilePath);
    const response = await fetch(`/api/getSound?filePath=${encodedPath}`);
    if (!response.ok) {
        console.error(await response.text());
        return;
    }
    const soundData = await response.blob();
    // Save to tmp storage for later playback
    return URL.createObjectURL(soundData);
}

async function downloadSound(fileFormat) {
    // Get file from storage
    const url = await fetchSound(downloadFilePaths[fileFormat]);
    // Make another link for download
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = downloadFileName.value;
    tempLink.click();   // trigger download
    // Cleanup
    setTimeout(() => {
        URL.revokeObjectURL(url);
        console.log('Object URL revoked after delay.');
    }, 500);
}

async function deleteAudio() {
    const confirmMsg = `Do you really want to delete audio with ID ${audioId}?`;
    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) {
        return;
    }
    const response = await fetch(`/api/delete/${audioId}`, { method: 'DELETE' });
    if (response.ok) {
        router.push({ name: 'AudioList', query: { deletedAudioId: audioId } })
    }
    else {
        console.error(await response.text());
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