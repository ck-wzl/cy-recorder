import { createApp } from 'vue'
import App from './Options.vue'
import { Select } from 'ant-design-vue'

const app = createApp(App)
app.use(Select).mount('#app')
