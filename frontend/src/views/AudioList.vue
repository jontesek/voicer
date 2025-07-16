<template>
  <div class="audio-list-page">
    <h2 class="mb-4">Your Audio List</h2>

    <div v-if="deleteSuccessMsg" class="alert alert-info">{{ deleteSuccessMsg }}</div>

    <div v-if="showNoAudioMsg" class="alert alert-info" role="alert">
      No audio files found. Go to "Create Audio" to add some!
    </div>

    <div v-if="audios.length > 0" class="table-responsive mb-5">
      <table class="table table-striped table-hover align-middle">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Title</th>
            <th scope="col">Style</th>
            <th scope="col">Text</th>
            <th scope="col">Duration</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="audio in audios" :key="audio.id">
            <th scope="row">{{ audio.id }}</th>
            <td>{{ trimText(audio.title || '', 20)}}</td>
            <td>{{ trimText(audio.style || '', 30) }}</td>
            <td>{{ trimText(audio.text, 70) }}</td>
            <td>{{ formatDuration(audio.audioDuration) }}</td>
            <td>
              <button class="btn btn-info btn-sm me-2">Play</button>
              <button class="btn btn-info btn-sm me-2">Detail</button>
              <button class="btn btn-danger btn-sm" @click="deleteAudio(audio.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Reactive variables
const audios = ref([]);
const deleteSuccessMsg = ref(null);
const showNoAudioMsg = ref(null);

// Lifecycle methods
onMounted(() => {
  fetchAudios();
})

// Data methods
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

// Helper methods
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
/* Page-specific styles */
.audio-list-page {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}
</style>