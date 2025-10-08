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
import i18n from './service/i18n';

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
app.use(i18n)

app.component('v-select', vSelect)

import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_API_BASE_URL}`, {
    transports: ['websocket'],
    reconnect: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
});

app.provide('socket', socket);


app.mount('#app');
