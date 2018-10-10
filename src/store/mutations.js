export const setRefreshTimer = (state, timer) => {
  if (state.refreshTimer !== undefined) {
    clearTimeout(state.refreshTimer)
    delete state.refreshTimer
  }
  state.refreshTimer = timer
}

export const setReportSetup = (state, setup) => {
  state.reportSetup = setup
  const { config, reportId, savedState, settings } = setup
  const { translations } = settings
  state.reportConfig = config
  state.reportId = reportId
  state.reportSavedState = savedState
  state.reportSettings = settings
  state.factsheetTypes = settings.viewModel.factSheets.reduce((accumulator, factsheet) => {
    const {type, bgColor, color} = factsheet
    const t = Object.entries(translations.factSheetTypes)
      .filter(([key, value]) => key.includes(type))
      .map(([key, value]) => { const mapped = {}; mapped[key.replace(`${type}.`, ``)] = value; return mapped })
      .reduce((accumulator, translation) => {
        accumulator = { ...accumulator, ...translation }
        return accumulator
      }, {})
    accumulator[type] = {type, bgColor, color, ...t}
    return accumulator
  }, {})
}

export const setFactsheetType = (state, factsheetType) => {
  state.factsheetType = factsheetType
}

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

export const setNode = (state, { node }) => {
  const child = JSON.parse(JSON.stringify(node))
  if (!node.parent) {
    state.nodes.push(node)
  } else {
    const parentID = node.parent.id
    const nodes = state.nodes
    let found = false

    const checkChildren = (node, idx, parentID, found) => {
      if (node.id === parentID) {
        if (!Array.isArray(node.children)) node.children = []
        node.children.push(child)
        found = true
        return found
      }
      if (node.children) node.children.some((child, idx) => checkChildren(child, idx, parentID, found))
      return found
    }
    nodes.some((child, idx) => checkChildren(child, idx, parentID, found))
  }
}

export const removeNode = (state, { node }) => {
  const child = JSON.parse(JSON.stringify(node))
  if (!node.parent) {
    state.nodes = state.nodes.filter(node => node.id !== child.id)
  } else {
    const parentID = node.parent.id
    const nodes = state.nodes
    let found = false

    const checkChildren = (node, idx, parentID, found) => {
      if (node.id === parentID) {
        node.children = Array.isArray(node.children) ? node.children.filter(_child => _child.id !== child.id) : []
        found = true
        return found
      }
      if (node.children) node.children.some((child, idx) => checkChildren(child, idx, parentID, found))
      return found
    }

    nodes.some((child, idx) => checkChildren(child, idx, parentID, found))
  }
}

export const setFilter = (state, filter) => {
  state.filter = filter
}
