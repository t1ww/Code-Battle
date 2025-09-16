// frontend\code-battle\src\main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Auth
import { isAuthenticated, getPlayerData } from '@/stores/auth'

const app = createApp(App)

// Provide functions
app.provide('isAuthenticated', isAuthenticated)
app.provide('getPlayerData', getPlayerData)
app.provide('DEV', true)

app.use(createPinia())
    .use(router)
    .provide('axios', axios)
    .mount('#app')
