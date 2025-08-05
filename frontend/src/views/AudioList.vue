<template>
  <div class="audio-list-page">
    <h2 class="mb-4">Your Audio List</h2>

    <div v-if="deleteSuccessMsg" class="alert alert-info">{{ deleteSuccessMsg }}</div>

    <div v-if="showNoAudioMsg" class="alert alert-info" role="alert">
      No audio files found. Go to "Create Audio" to add some!
    </div>

    <div v-if="audios.length > 0" class="table-responsive mb-5" style="overflow: visible">
      <table class="table table-striped table-hover align-middle">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Title</th>
            <th scope="col">Style</th>
            <th scope="col">Text</th>
            <th scope="col">Length</th>
            <th scope="col" class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="audio in audios" :key="audio.id">
            <th scope="row">{{ audio.id }}</th>
            <td><span :title="audio.title.length > MAX_TITLE_LENGTH ? audio.title : ''">{{ trimText(audio.title || '',
              MAX_TITLE_LENGTH) }}</span>
            </td>
            <td><span :title="audio.style.length > MAX_STYLE_LENGTH ? audio.style : ''">{{ trimText(audio.style || '',
              MAX_STYLE_LENGTH) }}</span>
            </td>
            <td><span :title="audio.text.length > MAX_TEXT_LENGTH ? audio.text : ''">{{ trimText(audio.text,
              MAX_TEXT_LENGTH) }}</span></td>
            <td>{{ formatDuration(audio.audioDuration) }}</td>
            <td class="actions-column">

              <button class="play-btn" aria-label="Play" @mouseover="fetchSound(audio.oggFilePath, audio.id, true)"
                @click="handlePlayClick(audio.id, $event)"><i class="bi bi-play-fill play-icon"></i></button>

              <div class="download-container">
                <button class="play-btn" aria-label="Download" @click="showDownloadFormatMenu(audio.id, $event)"
                  aria-expanded="false"><i class="bi bi-download"></i></button>
                <div v-if="activeDownloadMenuId === audio.id" class="download-format-menu">
                  <button @click="downloadAudio(audio.wavFilePath, audio)">WAV</button>
                  <button @click="downloadAudio(audio.mp3FilePath, audio)">MP3</button>
                  <button @click="downloadAudio(audio.oggFilePath, audio)">OGG</button>
                </div>
              </div>

              <router-link :to="{ name: 'audio-detail', params: { id: audio.id } }" class="btn btn-info btn-sm">
                Detail
              </router-link>

              <button class="btn btn-danger btn-sm" @click="deleteAudio(audio.id)" aria-label="Delete"><i
                  class="bi bi-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Constants
const MAX_TITLE_LENGTH = 20;
const MAX_STYLE_LENGTH = 30;
const MAX_TEXT_LENGTH = 70;
const DEFAULT_FETCH_FORMAT = 'ogg';
const FILE_NAME_TEXT_LENGTH = 10;

// For audio list
const audios = ref([]);
const deleteSuccessMsg = ref(null);
const showNoAudioMsg = ref(false);
const activeDownloadMenuId = ref(null);

// For playback
const audioPlayers = new Map();
const soundPlaying = ref(false);
const playIconClass = 'bi bi-play-fill play-icon';
const pauseIconClass = 'bi bi-pause-fill play-icon';

// Lifecycle
onMounted(() => {
  fetchAudios();
})

// API
const fetchAudios = async () => {
  try {
    const response = await fetch('/api/getAll');
    const data = await response.json();
    audios.value = data;
    if (data.length === 0) {
      showNoAudioMsg.value = true;
    }
  } catch (error) {
    console.error(`Fetch error: ${error}`)
  }
}

const deleteAudio = async (id) => {
  const confirmMsg = `Do you really want to delete audio with ID ${id}?`;
  const confirmed = window.confirm(confirmMsg);
  if (!confirmed) {
    return;
  }
  try {
    const response = await fetch(`/api/delete/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      deleteSuccessMsg.value = `Audio with id ${id} was deleted.`
      audios.value = audios.value.filter(audio => audio.id !== id)
    }
    else {
      console.error(await response.text());
    }

  } catch (error) {
    console.error(`Fetch error: ${error}`)
  }
}

const fetchSound = async (soundFilePath, audioId, updateCache) => {
  // Check if audio already cached
  const _player = audioPlayers.get(audioId);
  if (_player && soundFilePath.endsWith(DEFAULT_FETCH_FORMAT)) {
    console.log(`Sound for audio ${audioId} already in cache.`);
    return _player.src; // for download 
  }
  // If not, get it from API
  const encodedPath = encodeURIComponent(soundFilePath);
  const response = await fetch(`/api/getSound?filePath=${encodedPath}`);
  if (!response.ok) {
    console.error(await response.text());
    return;
  }
  const soundData = await response.blob();
  // Save to tmp storage for later playback
  const url = URL.createObjectURL(soundData);
  const player = new Audio(url);
  // In playback mode
  if (updateCache) {
    audioPlayers.set(audioId, player);
  }
  return url;
}

/* Interaction */
const handlePlayClick = async (audioId, event) => {
  const audioPlayer = audioPlayers.get(audioId);
  const playBtn = event.currentTarget;
  // Handle pause
  if (soundPlaying.value) {
    soundPlaying.value = false;
    audioPlayer.pause();
    playBtn.setAttribute('aria-label', 'Play');
    playBtn.querySelector('i').className = playIconClass;
    return;
  }
  // Handle play
  if (!audioPlayer) {
    console.log('Sound not yet loaded');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Sound loaded after sleep');
  }
  // Set back to play icon when finished
  audioPlayer.addEventListener('ended', () => {
    soundPlaying.value = false;
    playBtn.setAttribute('aria-label', 'Play');
    playBtn.querySelector('i').className = playIconClass;
  });
  // Play sound
  audioPlayer.play();
  soundPlaying.value = true;
  playBtn.setAttribute('aria-label', 'Pause');
  playBtn.querySelector('i').className = pauseIconClass;
}

async function downloadAudio(audioFilePath, audio) {
  const blobUrl = await fetchSound(audioFilePath, audio.id, false);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = createFilename(audio.id, audio.title, audio.text);
  anchor.click();
  setTimeout(() => { URL.revokeObjectURL(blobUrl); }, 500);
}

function showDownloadFormatMenu(audioId, event) {
  activeDownloadMenuId.value = audioId;
  document.addEventListener('click', closeDownloadFormatMenu);
  event.stopPropagation();
}

function closeDownloadFormatMenu() {
  activeDownloadMenuId.value = null;
  document.removeEventListener('click', closeDownloadFormatMenu);
}

// Helpers
function createFilename(audioId, title, text) {
  let name = audioId + "_";
  if (title.length > 0) {
    return name + title;
  }
  else {
    return name + text.slice(0, FILE_NAME_TEXT_LENGTH);
  }
}

function trimText(text, maxLength) {
  return text.length > maxLength
    ? text.substring(0, maxLength - 3) + '...'
    : text;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

</script>

<style scoped>
.audio-list-page {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.play-btn {
  background: none;
  border: none;
  padding: 0;
}

.play-icon {
  width: 1em;
  font-size: 2em;
}

.actions-column {
  display: flex;
  align-items: center;
  gap: 1.2em;
  /* Spacing between buttons */
}

/* Download file - choose format */
.download-container {
  display: inline-block;
  position: relative;
  cursor: pointer;
}

.download-format-menu {
  position: absolute;
  top: -110%;
  left: -20px;
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.download-format-menu button {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: none;
  cursor: pointer;
}

.download-format-menu button:hover {
  background-color: #f0f0f0;
}
</style>