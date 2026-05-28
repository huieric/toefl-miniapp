import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(ElementPlus, { locale: { el: { /* simplified Chinese defaults */ } } });
app.use(router);
app.mount('#app');