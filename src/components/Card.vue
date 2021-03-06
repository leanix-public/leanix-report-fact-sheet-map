<template>
  <div
    class="card"
    :collapsed="!childCount"
    @mouseover.stop="setHoverID(node.id)"
    @mouseleave.stop="setHoverID('')"
    :over="over"
    :selected="isSelected"
    :not-selected="isNotSelected"
    :id="`card-${node.id}`"
    @click.stop="handleClickEvent"
  >
    <add-factsheet-modal :show="showAddFactsheetModal" @close="showAddFactsheetModal = false" :node="node"/>
    <modal v-if="showDeleteFactsheetModal" @close="showDeleteFactsheetModal = false">
      <div slot="header" class="mod-header">
        <h4 style="display: inline-block">Confirm Deletion</h4>
        <span class="close" @click.stop="showDeleteFactsheetModal = false">
          <font-awesome-icon icon="times"/>
        </span>
      </div>
      <template slot="body">
        <div style="font-size: 1.2em">Delete {{node.displayName}}?</div>
      </template>
      <div slot="footer">
        <button class="btn btn-success" @click.stop="removeFactsheet">OK</button>
        <button class="btn" @click.stop="showDeleteFactsheetModal = false">Cancel</button>
      </div>
    </modal>
    <drag class="drag-container" :draggable="editing" :transfer-data="node" @dragstart="handleChildDragstart" :over="over" :selected="isSelected">
      <drop
        class="collapsed section"
        v-if="!childCount"
        :style="style"
        :editing="editing"
        :hovered="isHovered"
        :selected="isSelected"
        :not-selected="isNotSelected"
        :over="over"
        @drop="handleDrop" @dragenter.native.stop="handleDragEnter" @dragover.native.stop="handleDragOver" @dragleave.native.stop="handleDragLeave">
        <span @click="navigateToFactsheet" class="factsheet-link">
          {{name}}
        </span>
        <div class="actions" v-if="isHovered && editing">
          <span class="btn flat" v-if="node.level < maxLevel" @click.stop="showAddFactsheetModal = true">
            <font-awesome-icon icon="plus"/>
          </span>
          <span class="btn flat" @click.stop="showDeleteFactsheetModal = true">
            <font-awesome-icon icon="minus"/>
          </span>
          <span v-if="isIE" class="btn flat" @click.stop="toggleFactsheetSelection">
            <font-awesome-icon icon="arrows-alt"/>
          </span>
        </div>
      </drop>
      <div v-else class="section" :editing="editing" :hovered="isHovered" :selected="isSelected" :not-selected="isNotSelected">
        <div class="header" :style="style" :over="over">
          <div @click="navigateToFactsheet" class="factsheet-link">
            {{name}}
          </div>
          <div class="actions" v-if="editing">
            <span class="btn flat" @click.stop="showAddFactsheetModal = true">
              <font-awesome-icon icon="plus"/>
            </span>
            <span v-if="isIE" class="btn flat" @click.stop="toggleFactsheetSelection">
              <font-awesome-icon icon="arrows-alt"/>
            </span>
          </div>
        </div>
        <drop class="body" @drop="handleDrop" @dragenter.native.stop="handleDragEnter" @dragover.native.stop="handleDragOver" @dragleave.native.stop="handleDragLeave" :over="over">
          <slot name="body">
            <card v-for="child in node.children" :key="child.id" :node="child" :parent="node" :factsheetType="factsheetType" :baseUrl="baseUrl"/>
          </slot>
        </drop>
      </div>
    </drag>

  </div>
</template>

<script>
import Modal from './Modal'
import AddFactsheetModal from './AddFactsheetModal'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Card',
  components: { Modal, AddFactsheetModal },
  props: {
    baseUrl: {
      type: String,
      required: false
    },
    parent: {
      type: Object,
      required: false
    },
    node: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      hover: false,
      over: false,
      showAddFactsheetModal: false,
      showDeleteFactsheetModal: false,
      newFactsheetName: ''
    }
  },
  computed: {
    ...mapGetters(['legendItems', 'viewMapping', 'editing', 'factsheetType', 'maxLevel', 'hoverID', 'selectedNode', 'isIE']),
    name () {
      // wrap at 30 characters´
      return this.node.name && this.node.name.length > 37 ? `${this.node.name.substr(0, 37)}...` : this.node.name
    },
    legend () {
      const mapping = this.viewMapping[this.node.id] ? this.viewMapping[this.node.id].legendId : -1
      return this.legendItems[mapping]
    },
    style () {
      const legend = this.legend || {bgColor: '#FFFFFF', color: '#000000', inLegend: true, label: 'n/a', transparency: null, value: '__missing__'}
      return `background-color: ${legend.bgColor}; color: ${legend.color}`
    },
    hasChildren () {
      return Array.isArray(this.node.children) && !!this.node.children.length
    },
    level () {
      return this.node.level
    },
    childCount () {
      return this.node.children && Array.isArray(this.node.children) ? this.node.children.length : 0
    },
    isHovered () {
      return this.node.id === this.hoverID
    },
    isSelected () {
      return this.selectedNode && this.node.id === this.selectedNode.id
    },
    isNotSelected () {
      return this.selectedNode && this.node.id !== this.selectedNode.id
    }
  },
  methods: {
    ...mapActions(['createFactsheet', 'archiveFactsheet', 'setHoverID', 'updateFactsheetParent', 'setSelectedNode']),
    addFactsheet () {
      this.createFactsheet({ name: this.newFactsheetName, parentID: this.node.id })
        .catch(() => { })
      this.newFactsheetName = ''
      this.showAddFactsheetModal = false
    },
    removeFactsheet () {
      this.archiveFactsheet({ node: this.node, parent: this.parent })
        .catch(() => { })
      this.showDeleteFactsheetModal = false
    },
    handleChildDragstart (data, event) {
      event.stopPropagation()
    },
    handleDragEnter (transferData, nativeElement) {
      this.over = true
    },
    handleDragOver (transferData, nativeElement) {
      // console.log('drag over', transferData, nativeElement)
      this.over = true
    },
    handleDragLeave (transferData, nativeElement) {
      // console.log('drag leave', transferData, nativeElement)
      this.over = false
    },
    handleDrop (data, event) {
      if (this.over) {
        this.updateFactsheetParent({ source: data, target: this.node })
        this.over = false
      }
    },
    navigateToFactsheet () {
      this.$lx.openLink(`${this.baseUrl}/factsheet/${this.factsheetType}/${this.node.id}`, '_blank')
    },
    toggleFactsheetSelection () {
      const selectedNode = this.selectedNode && this.selectedNode.id === this.node.id ? undefined : this.node
      this.setSelectedNode(selectedNode)
    },
    handleClickEvent () {
      if (this.isNotSelected && this.selectedNode) {
        this.updateFactsheetParent({ source: this.selectedNode, target: this.node })
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
@import '../stylus/material-color'
@import '../stylus/material-shadows'

$border-radius = 6px
$card-max-width = 25em
$collapsed-height = 5em
$card-body-padding = 10px
$body-background-color = #f3f3f3
$header-background-color = #354567
$section-border = 1px solid #C5C5C5

.card
  background-color $body-background-color
  box-sizing border-box
  max-width $card-max-width
  width $card-max-width
  transition background-color 0.3s ease
  cursor default
  border-radius $border-radius
  &[not-selected=true]
    cursor pointer
    [hovered]
      background-color clr-grey-800 !important
      color white !important
      border $section-border

  .section
    // z-depth-2dp() // Uncomment for material layout
    border $section-border
    border-radius $border-radius
    transition background-color 0.3s ease
    &[over]
      background-color clr-grey-800 !important
      color white !important
      border $section-border
      border-radius $border-radius
    &[selected]
      background-color clr-green-800 !important
      color white !important
      border $section-border
      border-radius $border-radius
  .collapsed
    transition background-color 0.3s ease
    box-sizing border-box
    height $collapsed-height
    padding 4px
    display flex
    flex-flow row wrap
    justify-content center
    align-items center
    white-space normal
    overflow hidden
    text-overflow ellipsis
    text-align center
    word-break break-word
    position relative
    & > .actions
      position absolute
      top 0
      right 0
      display flex
      justify-content center
      align-items center
      background-color rgba(0, 0, 0, 0.6)
      color white
      padding 3px
      & > .btn
        font-size 12px
        color white-700
        margin-right 5px
        cursor pointer
        padding 2px

  .header
    display flex
    flex-flow row
    padding 8px
    border-radius 6px 6px 0px 0px
    border-bottom $section-border
    color white
    white-space nowrap
    overflow hidden
    text-overflow ellipsis
    align-items center
    justify-content center
    transition background-color 0.3s ease
    &[over], &[selected]
      background-color clr-grey-800 !important
      color white !important
    &[selected]
      cursor pointer !important
    text-align center
    position relative
    & > .actions
      position absolute
      right 0
      bottom 0
      top 0
      display flex
      & > .btn
        font-size 12px
        padding 0.5em
        cursor pointer
        color clr-grey-700
  .body
    display flex
    flex-flow row wrap
    padding-left $card-body-padding
    padding-top $card-body-padding
    transition background-color 0.3s ease
    & > .card
      width "calc(100% - %s)" % $card-body-padding
      margin-bottom $card-body-padding
      &[collapsed]
        width "calc(100% * (1/3) - %s)" % $card-body-padding
        margin-right $card-body-padding
        margin-bottom $card-body-padding

.factsheet-link
  cursor pointer
  &:hover
    text-decoration underline
</style>
