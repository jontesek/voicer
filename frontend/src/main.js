import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap icons
import 'bootstrap-icons/font/bootstrap-icons.css';

// Import custom CSS after Bootstrap
import './assets/main.css';

// Setup Vue
const app = createApp(App);
app.use(router);
app.mount('#app');

// Import Bootstrap JavaScript bundle (includes Popper.js)
// Do it now so it's loaded in app
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Select box search
import 'choices.js/public/assets/styles/choices.css';
