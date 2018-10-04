// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Notifications from 'vue-notification'
import VueDragDrop from 'vue-drag-drop'
import App from './App'
import LeanixVuePlugin from './plugins/LeanixVuePlugin'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPen, faPlus, faMinus, faArrowsAlt, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import store from './store'

const icons = [faPen, faPlus, faMinus, faArrowsAlt, faTimes]
icons.forEach(icon => library.add(icon))

Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.use(VueDragDrop)

Vue.use(LeanixVuePlugin)
Vue.use(Notifications)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  components: { App },
  template: '<App/>'
})
