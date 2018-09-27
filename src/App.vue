<template>
  <div id="app">
    <card>
      <template slot="body">
        <card/>
        <card/>
        <card/>
        <card/>
        <card>
          <template slot="body">
            <card/>
            <card/>
            <card/>
            <card>
              <template slot="body">
                <card/>
                <card/>
                <card/>
                <card>
                  <template slot="body">
                  <card/>
                  <card/>
                  <card/>
                  <card>
                    <template slot="body">
                      <card/>
                      <card/>
                      <card/>
                      <card>
                      </card>
                    </template>
                    </card>
                </template>
                </card>
              </template>
            </card>
          </template>
        </card>
      </template>
    </card>
    <card>
      <template slot="body">
        <card/>
        <card/>
        <card/>
        <card/>
        <card>
          <template slot="body">
            <card/>
            <card/>
            <card/>
            <card>
              <template slot="body">
                <card/>
                <card/>
                <card/>
                <card>
                  <template slot="body">
                  <card/>
                  <card/>
                  <card/>
                  <card>
                    <template slot="body">
                      <card/>
                      <card/>
                      <card/>
                      <card>
                      </card>
                    </template>
                    </card>
                </template>
                </card>
              </template>
            </card>
          </template>
        </card>
      </template>
    </card>
  </div>
</template>

<script>

import Card from './components/Card'
export default {
  name: 'App',
  components: { Card },
  data () {
    return {
      dataset: [
        {
          name: 'Corporate Services',
          children: [
            {
              name: 'Fleet Management',
              children: [
                { name: 'FMS' },
                { name: 'Ultimo' }
              ]
            },
            {
              name: 'Legal',
              children: [
                { name: 'AttorneyNet' },
                { name: 'Law+' },
                { name: 'Lex Actual' }
              ]
            }
          ]
        },
        {
          name: 'Customer Relationship',
          children: [
            {
              name: 'After Sales Service',
              children: [
                { name: 'Call Center Management' },
                { name: 'Mailsnake' }
              ]
            },
            {
              name: 'Customer Service',
              children: [
                { name: 'CustEchoe Americas' },
                { name: 'IssueTrack' }
              ]
            }
          ]
        }
      ]
    }
  },
  mounted () {
    this.$lx.init()
      .then(setup => {
        this.$lx.ready({})
      })
  }
}
</script>

<style lang="stylus" scoped>
  @import './stylus/main'

  #app
    display flex
    flex-flow row
    justify-content center
    align-items flex-start
    & > div.card
      margin 0.5rem
</style>
