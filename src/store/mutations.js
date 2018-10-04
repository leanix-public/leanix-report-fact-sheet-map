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
