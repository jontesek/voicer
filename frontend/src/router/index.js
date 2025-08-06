import { createRouter, createWebHistory } from 'vue-router'
import CreateAudio from '../views/CreateAudio.vue';
import AudioList from '../views/AudioList.vue';
import AudioDetail from '../views/AudioDetail.vue';
import AccountStats from '../views/AccountStats.vue';

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
    },
    {
      path: '/audio-detail/:id',
      name: 'audio-detail',
      component: AudioDetail
    },
    {
      path: '/account-stats',
      name: 'account-stats',
      component: AccountStats
    }
  ],
})

export default router
