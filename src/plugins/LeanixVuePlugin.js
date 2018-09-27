/* global lx */
import '@leanix/reporting'

const LeanixVuePlugin = {
  install (Vue, options) {
    Vue.prototype.$lx = lx
  }
}

export default LeanixVuePlugin
