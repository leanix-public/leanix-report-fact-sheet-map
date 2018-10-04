<template>
  <div id="app">
    <notifications group="report" position="bottom right"/>
    <div class="row controls no-print">
      <div class="control levels">
        <span>Levels</span>
        <input type="range" min="1" :max="maxLevel" step="1" v-model="currentLevel">
        <span>{{level}}</span>
      </div>
      <div class="control zoom">
        <span>Zoom</span>
        <input type="range" min="0" :max="maxZoom" step="1" v-model="currentZoom" @dblclick="currentZoom = 100">
        <span style="width: 20px">{{currentZoom}}%</span>
      </div>
    </div>
    <div class="row" :style="`font-size: ${fontSize}px`" style="margin-top: 2rem">
      <card v-for="node in nodes" :key="node.id" :node="node" :factsheetType="factsheetType"/>
    </div>

  </div>
</template>

<script>
import Card from './components/Card'
import Modal from './components/Modal'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'App',
  components: { Card, Modal },
  data () {
    return {
      showConfigurationModal: false
    }
  },
  methods: {
    ...mapActions(['fetchDataset', 'setFilter', 'setLevel', 'setLegendItems', 'setViewMapping', 'setEditing', 'setZoom', 'setSelected']),
    getReportConfig (setupConfig) {
      const config = {
        allowEditing: true,
        allowTableView: true,
        menuActions: {
          showConfigure: false,
          configureCallback: () => {
            console.log('configuring')
          }
        },
        facets: [
          {
            key: this.factsheetType,
            label: lx.translateFactSheetType(this.factsheetType, 'plural'),
            fixedFactSheetType: this.factsheetType,
            attributes: ['type', 'displayName'], // how to get relations here...
            callback: facetData => {
              // console.log('facetData', facetData)
            },
            facetFiltersChangedCallback: filter => this.setFilter(filter)
          }
        ],
        reportViewFactSheetType: this.factsheetType,
        reportViewCallback: data => {
          const {legendItems, mapping} = data
          this.setLegendItems(legendItems)
          this.setViewMapping(mapping)
        },
        toggleEditingCallback: editing => this.setEditing(editing),
        tableConfigCallback: () => {
          return {
            factSheetType: this.factsheetType,
            attributes: ['id', 'displayName']
          }
        }
      }
      return config
    }
  },
  computed: {
    ...mapGetters(['dataset', 'filter', 'level', 'nodes', 'legendItems', 'editing', 'maxLevel', 'factsheetType', 'zoom', 'maxZoom', 'selected', 'hoverID']),
    currentLevel: {
      set (val) {
        this.setLevel(val)
      },
      get () {
        return this.level
      }
    },
    currentZoom: {
      set (val) {
        this.setZoom(val)
      },
      get () {
        return this.zoom
      }
    },
    fontSize () {
      return 0.06429 * this.zoom + 4.643
    }
  },
  watch: {
    filter (val) {
      this.fetchDataset({ filter: this.filter }) // triggers the first report API fetch
    }
  },
  created () {
    this.$lx.init()
      .then(setup => {
        const reportConfig = this.getReportConfig(setup)
        this.$lx.showEditToggle()
        this.$lx.ready(reportConfig)
      })
  }
}
</script>

<style lang="stylus" scoped>
@import './stylus/main'

#app
  display flex
  flex-flow column
  align-items flex-start
  font-size 12px

  & > .row > div.card
    flex 1 0 auto
    margin-right 0.5rem

.row
  display flex
  flex-flow row
  align-items flex-start
  &.controls
    align-items flex-start
    position fixed
    right 1em
    align-self flex-end
    & > .control
      font-size 11px
      display flex
      align-items center
    & > .levels
      margin-right 20px
      & > input
        width 60px
    & > .zoom
      & > input
        width 120px
    & > .btn
      align-self center
      margin-left 20px
      cursor pointer
      &.editing
        margin-right 20px
        color #999
        &[editing]
          color black
        & > svg
          margin-right 5px
      &.sync > svg
        padding 0 0.5em
        font-size 14px
        & > i[loading]
            animation spin 2s linear infinite

@media print
  .no-print, .no-print *
    display none !important

@keyframes spin
    0%
      transform rotate(0deg)
    100%
      transform rotate(360deg)
</style>
