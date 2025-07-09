<template>
  <div class="audio-list-page">
    <h2 class="mb-4">Your Audio List</h2>

    <div v-if="audios.length === 0" class="alert alert-info" role="alert">
      No audio files found. Go to "Create Audio" to add some!
    </div>

    <div v-else class="table-responsive mb-5">
      <table class="table table-striped table-hover align-middle">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Title</th>
            <th scope="col">Description</th>
            <th scope="col">File Name</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(audio, index) in audios" :key="index">
            <th scope="row">{{ index + 1 }}</th>
            <td>{{ audio.title }}</td>
            <td>{{ audio.description || 'N/A' }}</td>
            <td>{{ audio.fileName }}</td>
            <td>
              <button class="btn btn-info btn-sm me-2">View</button>
              <button class="btn btn-danger btn-sm" @click="deleteAudio(index)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="mt-5 mb-3">Audio List (Card View)</h3>
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      <div class="col" v-for="(audio, index) in audios" :key="`card-${index}`">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">{{ audio.title }}</h5>
            <p class="card-text">{{ audio.description || 'No description provided.' }}</p>
            <p class="card-text"><small class="text-muted">File: {{ audio.fileName }}</small></p>
            <button class="btn btn-info btn-sm me-2">Play</button>
            <button class="btn btn-outline-danger btn-sm" @click="deleteAudio(index)">Remove</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Reactive state for the list of audios
const audios = ref([
  // Dummy data for demonstration
  { title: 'Morning Meditation', description: 'Relaxing sounds for a peaceful start.', fileName: 'meditation.mp3' },
  { title: 'Workout Mix', description: 'Upbeat tracks for your exercise routine.', fileName: 'workout.wav' },
  { title: 'Podcast Episode 1', description: 'Introduction to Vue.js development.', fileName: 'podcast_ep1.ogg' }
]);

</script>

<style scoped>
/* Page-specific styles */
.audio-list-page {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}
</style>