import Vue from 'vue'
import Vuex from 'vuex'
import * as getters from './getters'
import * as actions from './actions'
import * as mutations from './mutations'

Vue.use(Vuex)

const state = {
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
  hoverID: ''
}

const store = new Vuex.Store({
  state,
  getters,
  actions,
  mutations
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
