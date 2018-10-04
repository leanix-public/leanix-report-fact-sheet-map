export const setLevel = (state, level) => {
  state.level = level
}

export const setEditing = (state, editing) => {
  state.editing = editing
}

export const setZoom = (state, zoom) => {
  state.zoom = zoom
}

export const setHoverID = (state, id) => {
  state.hoverID = id
}

export const setLegendItems = (state, legendItems) => {
  state.legendItems = legendItems
}

export const setViewMapping = (state, viewMapping) => {
  state.viewMapping = viewMapping
}

export const setLoading = (state, loading) => {
  state.loading = loading
}

export const setDataset = (state, dataset) => {
  state.dataset = dataset
}

export const setNodes = (state, nodes) => {
  state.nodes = nodes
}

export const setFilter = (state, filter) => {
  state.filter = filter
}

export const increment = state => {
  state.count++
  state.history.push('increment')
}

export const decrement = state => {
  state.count--
  state.history.push('decrement')
}
