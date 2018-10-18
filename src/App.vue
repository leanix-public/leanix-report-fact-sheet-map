<template>
  <div id="app">
    <notifications group="report" position="bottom right"/>
    <add-factsheet-modal :show="showAddFactsheetModal" @close="showAddFactsheetModal = false" />
    <modal v-if="showConfigurationModal" @close="showConfigurationModal = false">
      <div slot="header" class="mod-header">
        <h4 style="display: inline-block">Configure</h4>
        <span class="close" @click.stop="showConfigurationModal = false">
          <font-awesome-icon icon="times"/>
        </span>
      </div>
      <div slot="body">
        <label>Factsheet Type</label>
        <select v-model="selectedFactsheetType">
          <option v-for="factsheet in allowedFactsheetTypes" :key="factsheet.id" :value="factsheet.id">
            {{ factsheet.name }}
          </option>
        </select>
      </div>
      <div slot="footer">
        <div class="btn-group">
          <button class="btn" @click.stop="showConfigurationModal = false">Cancel</button>
          <button class="btn btn-success" @click.stop="applyConfiguration">Apply</button>
        </div>
      </div>
    </modal>
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
    <div
      class="row cards-container"
      :style="`font-size: ${fontSize}px; margin-top: ${isIE ? '4' : '2'}rem`"
      :editing="editing"
      @click.stop="addCard"
      ref="cardContainer">
      <card v-for="node in nodes" :key="node.id" :node="node" :factsheetType="factsheetType"/>
    </div>

  </div>
</template>

<script>
import Card from './components/Card'
import AddFactsheetModal from './components/AddFactsheetModal'
import Modal from './components/Modal'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'App',
  components: { Card, Modal, AddFactsheetModal },
  data () {
    return {
      showConfigurationModal: false,
      showAddFactsheetModal: false,
      selected: '',
      allowedFactsheetTypes: []
    }
  },
  methods: {
    ...mapActions(['fetchDataset', 'setFilter', 'setLevel', 'setLegendItems', 'setViewMapping', 'setEditing', 'setZoom', 'setReportSetup', 'setFactsheetType', 'setSelectedID']),
    applyConfiguration () {
      const reportConfig = this.getReportConfig(this.reportSetup)
      this.$lx.updateConfiguration(reportConfig)
      this.showConfigurationModal = false
    },
    factsheetTypeSelectionHandler (currentEntry) {
      if (currentEntry === undefined) return
      if (currentEntry.id !== this.selectedFactsheetType) {
        this.selectedFactsheetType = currentEntry.id
        const setup = this.reportSetup
        const config = this.getReportConfig(setup)
        // this.$lx.updateConfiguration(config)
        this.$lx.ready(config)
      }
    },
    getReportConfig (setupConfig) {
      const factsheetViewModel = setupConfig &&
        setupConfig.settings &&
        setupConfig.settings.viewModel &&
        Array.isArray(setupConfig.settings.viewModel.factSheets)
        ? setupConfig.settings.viewModel.factSheets.reduce((accumulator, factsheet) => { accumulator[factsheet.type] = factsheet; return accumulator }, {})
        : {}
      const validFactsheetTypes = Object.keys(factsheetViewModel)

      const factsheetTranslations = setupConfig &&
        setupConfig.settings &&
        setupConfig.settings.translations &&
        setupConfig.settings.translations.factSheetTypes
        ? setupConfig.settings.translations.factSheetTypes : {}

      const { config } = setupConfig
      let allowedFactsheetTypes = ['BusinessCapability', 'UserGroup', 'DataObject']
      if (Array.isArray(config.allowedFactsheetTypes)) {
        const invalidTypes = config.allowedFactsheetTypes.filter(factsheetType => validFactsheetTypes.indexOf(factsheetType) < 0)
        if (invalidTypes.length) {
          console.error(`invalid factsheet types passed in the configuration object: ${JSON.stringify(invalidTypes)}`)
          this.$notify({
            group: 'report',
            type: 'error',
            title: 'Invalid factsheet types in report configuration',
            text: `Check console for more details`
          })
        }
        allowedFactsheetTypes = config.allowedFactsheetTypes.filter(factsheetType => validFactsheetTypes.indexOf(factsheetType) > -1)
      }
      const entries = allowedFactsheetTypes
        .map(type => {
          return {
            id: type,
            name: factsheetTranslations[type] ? factsheetTranslations[type] : type,
            callback: this.factsheetTypeSelectionHandler
          }
        })
      this.allowedFactsheetTypes = entries
      return {
        allowEditing: true,
        allowTableView: true,
        export: {
          exportElementSelector: '.export-container'
        },
        menuActions: {
          showConfigure: true,
          configureCallback: () => { this.showConfigurationModal = true }
          /*
          customDropdowns: [
            {
              id: 'factsheets',
              name: 'Factsheet Type',
              entries,
              initialSelectionId: this.selectedFactsheetType
            }
          ]
          */
        },
        facets: [
          {
            key: this.selectedFactsheetType,
            label: lx.translateFactSheetType(this.selectedFactsheetType, 'plural'),
            fixedFactSheetType: this.selectedFactsheetType,
            attributes: ['type', 'displayName'], // how to get relations here...
            callback: facetData => {
              // console.log('facetData', facetData)
            },
            facetFiltersChangedCallback: filter => {
              this.setFilter(filter)
            }
          }
        ],
        reportViewFactSheetType: this.selectedFactsheetType,
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
    },
    addCard (evt) {
      if (this.editing && evt.target === this.$refs.cardContainer) this.showAddFactsheetModal = true
    },
    detectEscKeyPress (evt) {
      if (evt.key === 'Escape') {
        this.setSelectedID('')
      }
    }
  },
  computed: {
    ...mapGetters([
      'dataset',
      'filter',
      'level',
      'nodes',
      'legendItems',
      'editing',
      'maxLevel',
      'factsheetType',
      'zoom',
      'maxZoom',
      'hoverID',
      'factsheetTypes',
      'reportSetup',
      'reportConfig',
      'isIE'
    ]),
    selectedFactsheetType: {
      get () {
        return this.factsheetType
      },
      set (factsheetType) {
        if (factsheetType !== this.factsheetType) {
          this.setFactsheetType(factsheetType)
          const setup = this.reportSetup
          const config = this.getReportConfig(setup)
          // this.$lx.updateConfiguration(config)
          this.$lx.ready(config)
          this.showConfigurationModal = false
        }
      }
    },
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
        this.setReportSetup(setup)
        const reportConfig = this.getReportConfig(setup)
        this.$lx.showEditToggle()
        this.$lx.ready(reportConfig)
      })
  },
  mounted () {
    document.addEventListener('keydown', this.detectEscKeyPress)
  },
  beforeDestroy () {
    document.removeEventListener('keydown', this.detectEscKeyPress)
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
    background white
    align-items flex-start
    position fixed
    top 0
    left 0
    right 0
    padding-bottom 0.5em
    align-self flex-end
    justify-content flex-end
    z-index 10
    & > .control
      font-size 11px
      display flex
      align-items center
      padding-right 1em
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

.cards-container
  &[editing]
    cursor copy

@media print
  .no-print, .no-print *
    display none !important

@keyframes spin
    0%
      transform rotate(0deg)
    100%
      transform rotate(360deg)
</style>
