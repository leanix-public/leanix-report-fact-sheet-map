const plugin = store => {
  const { commit, dispatch } = store

  // eslint-disable-next-line
  const unwatch = store.watch(
    state => state.nodes,
    (oldNodes, newNodes) => {
      const refreshTimer = setInterval(() => dispatch('fetchDataset', { silent: true }), 5000)
      commit('setRefreshTimer', refreshTimer)
    }
  )
}

export default plugin
