import Vue from 'vue'
import Vuex from 'vuex'
import * as getters from './getters'
import * as actions from './actions'
import * as mutations from './mutations'
import plugin from './plugin'

Vue.use(Vuex)

const state = {
  refreshTimer: undefined,
  reportSetup: {},
  reportConfig: {},
  reportId: '',
  reportSavedState: {},
  reportSettings: {},
  factsheetTypes: {},
  factsheetType: 'BusinessCapability',
  loading: false,
  editing: false,
  level: 4,
  maxLevel: 4,
  dataset: [],
  nodes: [],
  filter: {},
  legendItems: {},
  viewMapping: {},
  zoom: 100,
  maxZoom: 150,
  hoverID: '',
  selectedID: '',
  selectedNode: undefined,
  isIE: navigator && navigator.userAgent ? navigator.userAgent.indexOf('Trident') > -1 : false
}

const store = new Vuex.Store({
  state,
  getters,
  actions,
  mutations,
  plugins: [plugin]
})

if (module.hot) {
  module.hot.accept([
    './getters',
    './actions',
    './mutations'
  ], () => {
    store.hotUpdate({
      getters: require('./getters'),
      actions: require('./actions'),
      mutations: require('./mutations')
    })
  })
}

export default store
