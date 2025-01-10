import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import vSelect from 'vue-select'


import 'vue-select/dist/vue-select.css';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.use(pinia);

app.component('v-select', vSelect)

import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_API_BASE_URL}`, {
//   autoConnect: false,
});

app.provide('socket', socket);


app.mount('#app');
