import { createApp } from 'vue'
import App from './Popup.vue'
import { Button } from 'ant-design-vue'

const app = createApp(App)
app.use(Button).mount('#app')
