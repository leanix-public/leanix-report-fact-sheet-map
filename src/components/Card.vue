<template>
  <div class="card" :collapsed="collapsed">
    <template v-if="collapsed">
      <div class="collapsed" @click="collapsed = !collapsed">
        <div>
          This is my long title being collapsed
        </div>
      </div>
    </template>
    <template v-else>
      <div class="header" @click="collapsed = !collapsed">
        header
      </div>
      <div class="body">
        <slot name="body"/>
      </div>
    </template>
  </div>
</template>

<script>

export default {
  data () {
    return {
      collapsed: true
    }
  }
}
</script>
<style lang="stylus" scoped>
.card
  border 2px solid #C5C5C5
  border-radius 6px
  background white
  box-sizing border-box
  .collapsed
    box-sizing border-box
    max-width 90px
    min-height 60px
    display flex
    flex-flow row
    align-items center
    justify-content center
    & > div
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
  .header
    padding 8px
    border-radius 4px 4px 0px 0px
    background-color #354567
    color white
  .body
    display flex
    flex-flow row wrap
    align-items flex-start
    background-color #F3F3F3
    padding-left 4px
    padding-top 4px
    max-width 300px
    & > .card
      width calc(100% - 4px)
      margin-bottom: 4px
      &[collapsed]
        background yellow
        width: calc(100% * (1/3) - 4px)
        margin-right 4px

</style>
