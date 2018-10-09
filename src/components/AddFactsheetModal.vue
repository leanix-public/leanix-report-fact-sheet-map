<template>
  <modal v-if="showModal" @close="closeModal">
    <div slot="header" class="mod-header">
      <h4 style="display: inline-block">{{titleMessage}}</h4>
      <span class="close" @click.stop="showModal = false">
        <font-awesome-icon icon="times"/>
      </span>
    </div>
    <div slot="body" ref="nameInput">
      <label>Name</label>
      <input type="text" v-model="factsheetName" @keyup.stop="">
    </div>
    <div slot="footer">
      <div class="btn-group">
        <button class="btn" @click.stop="closeModal">Cancel</button>
        <button class="btn btn-success" @click.stop="addFactsheet">Add</button>
      </div>
    </div>
  </modal>
</template>

<script>
import Modal from './Modal'
import { mapActions } from 'vuex'

export default {
  name: 'AddFactsheetModal',
  components: { Modal },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    node: {
      type: Object,
      required: false
    }
  },
  data () {
    return {
      factsheetName: ''
    }
  },
  computed: {
    showModal: {
      get () {
        return this.show
      },
      set (val) {
        this.$emit('close', true)
      }
    },
    titleMessage () {
      return this.node
        ? `Add to ${this.node.displayName}`
        : `Add factsheet`
    }
  },
  methods: {
    ...mapActions(['createFactsheet']),
    addFactsheet () {
      this.createFactsheet({ name: this.factsheetName, parent: this.node })
        .catch(() => { })
      this.closeModal()
    },
    closeModal () {
      this.factsheetName = ''
      this.showModal = false
    }
  }
}
</script>
