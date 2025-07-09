import { createRouter, createWebHistory } from 'vue-router'
import CreateAudio from '../views/CreateAudio.vue';
import AudioList from '../views/AudioList.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/create-audio',
      name: 'create-audio',
      component: CreateAudio
    },
    {
      path: '/audio-list',
      name: 'audio-list',
      component: AudioList
    }
  ],
})

export default router
