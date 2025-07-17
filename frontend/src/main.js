import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap JavaScript bundle (includes Popper.js)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// Import Bootstrap icons
import 'bootstrap-icons/font/bootstrap-icons.css';

// Import custom CSS after Bootstrap
import './assets/main.css'


const app = createApp(App)

app.use(router)

app.mount('#app')
