<template>
  <div class="card" :collapsed="!childCount" @mouseover.stop="setHoverID(node.id)" @mouseleave.stop="setHoverID('')" :over="over">
    <modal v-if="showAddFactsheetModal" @close="showAddFactsheetModal = false">
      <div slot="header" class="mod-header">
        <h4 style="display: inline-block">Add to {{node.displayName}}</h4>
        <span class="close" @click.stop="showAddFactsheetModal = false">
          <font-awesome-icon icon="times"/>
        </span>
      </div>
      <div slot="body">
        <label>Name</label>
        <input type="text" v-model="newFactsheetName">
      </div>
      <div slot="footer">
        <div class="btn-group">
          <button class="btn" @click.stop="showAddFactsheetModal = false">Cancel</button>
          <button class="btn btn-success" @click.stop="addFactsheet">Add</button>
        </div>
      </div>
    </modal>
    <modal v-if="showDeleteFactsheetModal" @close="showDeleteFactsheetModal = false">
      <h4 slot="header">Confirm {{factsheetType}} deletion</h4>
      <template slot="body">
        <div style="font-size: 1.2em">Delete {{node.displayName}}?</div>
      </template>
      <div slot="footer">
        <button class="btn btn-success" @click.stop="removeFactsheet">OK</button>
        <button class="btn" @click.stop="showDeleteFactsheetModal = false">Cancel</button>
      </div>
    </modal>
    <drag class="drag-container" :transfer-data="node" @dragstart="handleChildDragstart" :over="over">
      <drop
        class="collapsed section"
        v-if="!childCount"
        :style="style"
        :editing="editing"
        :hovered="isHovered"
        :over="over"
        @drop="handleDrop" @dragenter.native.stop="handleDragEnter" @dragover.native.stop="handleDragOver" @dragleave.native.stop="handleDragLeave">
        {{name}}
        <div class="actions" v-if="isHovered && editing">
            <span class="btn flat" v-if="node.level < maxLevel" @click.stop="showAddFactsheetModal = true">
            <font-awesome-icon icon="plus"/>
          </span>
          <span class="btn flat" @click.stop="showDeleteFactsheetModal = true">
            <font-awesome-icon icon="minus"/>
          </span>
        </div>
      </drop>
      <div v-else class="section" :editing="editing" :hovered="isHovered">
        <div class="header" :style="style" :over="over">
          <div>
            {{name}}
          </div>
          <div class="actions" v-if="editing">
            <span class="btn flat" @click.stop="showAddFactsheetModal = true">
              <font-awesome-icon icon="plus"/>
            </span>
          </div>
        </div>
        <drop class="body" @drop="handleDrop" @dragenter.native.stop="handleDragEnter" @dragover.native.stop="handleDragOver" @dragleave.native.stop="handleDragLeave" :over="over">
          <slot name="body">
            <card v-for="child in node.children" :key="child.id" :node="child"/>
          </slot>
        </drop>
      </div>
    </drag>

  </div>
</template>

<script>
import Modal from './Modal'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Card',
  components: { Modal },
  props: {
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
    ...mapGetters(['legendItems', 'viewMapping', 'editing', 'factsheetType', 'maxLevel', 'hoverID']),
    children: {
      get () {
        return this.node.children
      },
      set (val) {
        console.log('setting children', val)
      }
    },
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
    }
  },
  methods: {
    ...mapActions(['createFactsheet', 'archiveFactsheet', 'setHoverID', 'updateFactsheetParent']),
    addFactsheet () {
      this.createFactsheet({ name: this.newFactsheetName, parentID: this.node.id })
        .catch(() => { })
      this.newFactsheetName = ''
      this.showAddFactsheetModal = false
    },
    removeFactsheet () {
      this.archiveFactsheet(this.node.id)
        .catch(() => { })
      this.showDeleteFactsheetModal = false
    },
    handleChildDragstart (data, event) {
      event.stopPropagation()
    },
    handleDragEnter (transferData, nativeElement) {
      console.log('drag enter', transferData, nativeElement)
      this.over = true
    },
    handleDragOver (transferData, nativeElement) {
      // console.log('drag over', transferData, nativeElement)
      this.over = true
    },
    handleDragLeave (transferData, nativeElement) {
      console.log('drag leave', transferData, nativeElement)
      this.over = false
    },
    handleDrop (data, event) {
      if (this.over) {
        // const sourceName = data.displayName
        // const targetName = this.node.displayName
        // console.log(`${sourceName} => ${targetName}`)
        this.updateFactsheetParent({ source: data, target: this.node })
        this.over = false
      }
    }
  },
  watch: {
    over (val) {
      console.log('overing', val, this.node.id)
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
$card-body-padding = 8px
$body-background-color = #F3F3F3
$header-background-color = #354567

.drag-container
  border-radius $border-radius
  &[over]
    z-depth-4dp()
    z-depth-transition()

.card
  background-color $body-background-color
  box-sizing border-box
  max-width $card-max-width
  width $card-max-width
  transition background-color 0.3s ease
  cursor default
  border-radius $border-radius

  .section
    // z-depth-2dp() // Uncomment for material layout
    border 1px solid #C5C5C5
    border-radius $border-radius
    &[over]
      background-color clr-grey-800 !important
      color white !important
      border none
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
    border-radius 4px 4px 0px 0px
    border-bottom 1px solid #C5C5C5
    color white
    white-space nowrap
    overflow hidden
    text-overflow ellipsis
    align-items center
    justify-content center
    transition background-color 0.3s ease
    &[over]
      background-color clr-grey-800 !important
      color white !important
    &[selected]
      cursor pointer !important
    text-align center
    position relative
    & > .actions
      position absolute
      right 0
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

label
  display inline-block
  max-width 100%
  margin-bottom 5px
  font-weight 700

input[type=text], select
  width 100%
  border 1px solid #aaa
  border-radius 3px
  box-sizing border-box
  padding 4px

.btn-group
  & > .btn
    margin-right 0.4em

.btn
  display inline-block
  margin-bottom 0
  font-weight 400
  -ms-touch-action manipulation
  touch-action manipulation
  cursor pointer
  background-image none
  border 1px solid transparent
  white-space nowrap
  padding 6px 12px
  font-size 12px
  line-height 1.428571429
  border-radius 3px
  border-color #ccc
  -webkit-user-select none
  -moz-user-select none
  -ms-user-select none
  user-select none
  background-image linear-gradient(to bottom,#fff 0,#e0e0e0 100%)
  text-shadow 0 1px 0 #fff
  box-shadow inset 0 1px 0 rgba(255,255,255,.15), 0 1px 1px rgba(0,0,0,.075)
  &.flat
    background transparent
    border 0
    box-shadow none

.btn-success
  background-image linear-gradient(to bottom,#5cb85c 0,#419641 100%)
  color white
  background-color #5cb85c
  text-shadow 0 -1px 0 rgba(0,0,0,.2)
  border-color #3e8f3e
  &:hover
    background-color darken(#5cb85c, 10%)

.close
  font-weight 700
  font-size 1em
  color #000
  text-shadow 0 1px 0 #fff
  opacity 0.2
  cursor pointer
.mod-header
  display flex
  flex 1
  justify-content space-between
</style>
