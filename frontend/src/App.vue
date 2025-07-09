<template>
  <div id="app-layout" class="d-flex flex-column min-vh-100">
    <AppHeader />
    <AppMenu />
    <main class="flex-grow-1 py-4">
      <div class="container">
        <router-view></router-view>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script>
import AppHeader from './components/AppHeader.vue';
import AppMenu from './components/AppMenu.vue';
import AppFooter from './components/AppFooter.vue';

export default {
  name: 'App',
  components: {
    AppHeader,
    AppMenu,
    AppFooter
  }
}
</script>

<style>
/* Global styles are in assets folder. */
</style>