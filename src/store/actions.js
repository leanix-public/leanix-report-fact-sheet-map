import Vue from 'vue'

export const setReportSetup = ({ commit }, setup) => {
  commit('setReportSetup', setup)
}

export const setFactsheetType = ({ commit }, factsheetType) => {
  commit('setFactsheetType', factsheetType)
}

export const setLevel = ({ commit, dispatch }, level) => {
  commit('setLevel', level)
  dispatch('mapNodes')
}

export const setEditing = ({ commit }, editing) => {
  commit('setEditing', editing)
}

export const setZoom = ({ commit }, zoom) => {
  commit('setZoom', zoom)
}

export const setHoverID = ({ commit }, id) => {
  commit('setHoverID', id)
}

export const setLegendItems = ({ commit }, legendItems) => {
  legendItems = Object.values(legendItems)
    .reduce((accumulator, item) => {
      const id = item.id
      delete item.id
      accumulator[id] = item
      return accumulator
    }, {})
  commit('setLegendItems', legendItems)
}

export const setViewMapping = ({ commit, dispatch }, mapping) => {
  mapping = Object.values(mapping)
    .reduce((accumulator, mapping) => {
      const id = mapping.fsId
      delete mapping.fsId
      accumulator[id] = mapping
      return accumulator
    }, {})
  commit('setViewMapping', mapping)
  dispatch('mapNodes')
}

export const setFilter = ({ commit }, filter) => {
  filter = {
    facetFilters: filter.facets,
    fullTextSearch: filter.fullTextSearchTerm,
    ids: filter.directHits.map(hit => hit.id)
  }
  commit('setFilter', filter)
}

export const fetchFactsheets = async ({ commit, state }, { filter, factsheets } = {}) => {
  const factsheetType = state.factsheetType
  const query = `
    query($filter:FilterInput){
      op:allFactSheets(filter:$filter) {
        edges {
          node {
            id
            name
            displayName
            rev
            level
            ... on ${factsheetType} {
              parent: relToParent {
                edges {
                  node {
                    id
                    factSheet {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `
  const dataset = await lx.executeGraphQL(query, { filter })
    .then(res => {
      const dataset = res.op.edges
        .map(edge => { edge.node.parent = edge.node.parent.edges.map(edge => { return { relID: edge.node.id, id: edge.node.factSheet.id } }).shift(); return edge.node })
        .sort((a, b) => {
          // here we sort the list by hierarchy level
          return a.parent === undefined && b.parent === undefined
            ? 0 // if a and b are top-level factsheets, do nothing
            : a.parent === undefined || a.id === b.parent // else if a is top-level or a is parent of b, bring a to a lower index
              ? -1
              : 1 // else drop a to an higher index
        })
        .reduce((accumulator, node) => {
          let level = 1
          if (node.parent) {
            const parent = accumulator[node.parent.id] || { id: node.parent.id }
            parent.children = parent.children || []
            parent.children.push(node.id)
            accumulator[node.parent.id] = { ...parent }
            level = parent.level ? parent.level + 1 : undefined
          }
          accumulator[node.id] = { ...(accumulator[node.id] || {}), ...node, level }
          return accumulator
        }, factsheets || {})
      return Promise.resolve(dataset)
    })
    .catch(err => {
      Vue.notify({
        group: 'report',
        type: 'error',
        title: 'Error while fetching factsheets',
        text: `Check console for more details`
      })
      commit('setLoading', false)
      console.error(err)
    })
  return dataset
}

export const fetchDataset = async ({ commit, dispatch, state }, { filter, silent } = {}) => {
  if (silent !== true) lx.showSpinner()
  if (filter === undefined) filter = state.filter
  let factsheets = await dispatch('fetchFactsheets', { filter })

  const mapFactsheetChildren = (child, parent) => {
    if (typeof child === 'string') {
      child = factsheets[child]
      if (child.level === undefined) {
        child.level = parent.level ? parent.level + 1 : undefined
      }
    }
    if (Array.isArray(child.children)) {
      child.children = child.children
        .map(_child => mapFactsheetChildren(_child, child))
        .filter(_child => _child.level <= state.maxLevel)
    }
    return child
  }

  let factsheetsToResolve = []
  let iterations = 0
  do {
    factsheetsToResolve = Object.values(factsheets).filter(factsheet => !factsheet.name).map(factsheet => factsheet.id)
    if (factsheetsToResolve.length) {
      iterations++
      factsheets = await dispatch('fetchFactsheets', { filter: { ids: factsheetsToResolve }, factsheets })
    }
  } while (factsheetsToResolve.length && iterations < 10)
  if (factsheetsToResolve.length) {
    Vue.notify({
      group: 'report',
      type: 'warn',
      title: 'Could not resolve some factsheets!',
      text: `Check console for more details`
    })
    console.warn(`Could not resolve the following factsheets`, factsheetsToResolve)
  }

  const mapped = Object.values(factsheets)
    .filter(factsheet => factsheet.level === 1)
    // Sort top level factsheets alphabetically
    .sort((a, b) => {
      if (a.name < b.name) return -1
      if (a.name > b.name) return 1
      return 0
    })
    .map(mapFactsheetChildren)
  commit('setLoading', false)
  commit('setDataset', mapped)
  dispatch('mapNodes')
  if (silent !== true) lx.hideSpinner()
}

// aggregates factsheet children by filtering by level
export const mapNodes = ({ commit, state }) => {
  const dataset = JSON.parse(JSON.stringify(state.dataset))
  const level = state.level

  const sortByChildCountAndName = (a, b) => {
    const childrenA = Array.isArray(a.children) ? a.children.length : 0
    const childrenB = Array.isArray(b.children) ? b.children.length : 0
    if (childrenA < childrenB) return -1
    else if (childrenA > childrenB) return 1
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  }

  const sortByName = (a, b) => { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0 }

  const aggregateChildren = (factsheet, level) => {
    if (Array.isArray(factsheet.children) && level > 1) {
      factsheet.children = factsheet.children.map(child => aggregateChildren(child, level))
    } else {
      factsheet.children = []
    }
    factsheet.children = factsheet.children.filter(factsheet => factsheet.level <= level).sort(sortByChildCountAndName)
    return factsheet
  }
  const mapped = dataset
    .map(factsheet => aggregateChildren(factsheet, level))
    .sort(sortByName)
  commit('setNodes', mapped)
}

// Aggregates factsheet children by bottom nodes after level threshold
export const mapNodesOriginalAggregation = ({ commit, state }) => {
  const dataset = JSON.parse(JSON.stringify(state.dataset))
  const level = state.level

  const reduceChild = (accumulator, factsheet) => {
    if (Array.isArray(factsheet.children) && factsheet.children.length) {
      factsheet.children = factsheet.children.reduce(reduceChild, accumulator)
    } else {
      accumulator.push(factsheet)
    }
    return accumulator
  }

  const sortByChildCountAndName = (a, b) => {
    const childrenA = Array.isArray(a.children) ? a.children.length : 0
    const childrenB = Array.isArray(b.children) ? b.children.length : 0
    if (childrenA < childrenB) return -1
    else if (childrenA > childrenB) return 1
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  }

  const sortByName = (a, b) => { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0 }

  const aggregateChildren = (factsheet, level) => {
    if (Array.isArray(factsheet.children) && level > 1) {
      factsheet.children = factsheet.level >= (level - 1)
        ? factsheet.children.reduce(reduceChild, [])
        : factsheet.children.map(child => aggregateChildren(child, level))
    } else {
      factsheet.children = []
    }
    factsheet.children = factsheet.children.sort(sortByChildCountAndName)
    return factsheet
  }
  const mapped = dataset
    .map(factsheet => aggregateChildren(factsheet, level))
    .sort(sortByName)
  commit('setNodes', mapped)
}

export const createFactsheet = ({commit, dispatch, state}, { name, parent }) => {
  const factsheetType = state.factsheetType
  const parentFragment = `... on ${factsheetType}{parent:relToParent{edges{node{id factSheet{id name}}}}}`
  const factsheetFragment = `factSheet{id name displayName rev level ${parentFragment}}`
  const query = `mutation($input:BaseFactSheetInput!,$patches:[Patch]){op:createFactSheet(input:$input,patches:$patches){${factsheetFragment}}}`
  const variables = {
    input: {
      name,
      type: state.factsheetType
    },
    patches: []
  }
  if (parent) {
    variables.patches.push({ op: 'add', path: `/relToParent/new_${parent.id}`, value: JSON.stringify({ factSheetId: parent.id }) })
  }
  return lx.executeGraphQL(query, variables)
    .then(res => {
      const node = res.op.factSheet
      node.parent = node.parent.edges.map(edge => { return {relID: edge.node.id, id: edge.node.factSheet.id, name: edge.node.factSheet.name} }).shift()

      Vue.notify({
        group: 'report',
        type: 'success',
        title: `Added ${node.name} ${node.parent ? `to ${node.parent.name}` : ''}`
      })

      commit('setNode', { node })
      return Promise.resolve(node)
    })
    .catch(err => {
      console.error(err)
      if (Array.isArray(err.entries)) {
        err.entries.forEach(entry => {
          Vue.notify({
            group: 'report',
            type: 'error',
            text: `${entry.message}`
          })
        })
      } else {
        Vue.notify({
          group: 'report',
          type: 'error',
          title: 'Error while archiving factsheet',
          text: `Check console for more details`
        })
      }
      dispatch('fetchDataset')
    })
}

export const archiveFactsheet = ({commit, dispatch}, { node }) => {
  const query = `mutation($id:ID!,$patches:[Patch]!,$comment:String){updateFactSheet(id:$id,patches:$patches,comment:$comment){factSheet{id}}}`
  const variables = {
    id: node.id,
    patches: [{op: 'add', path: '/status', value: 'ARCHIVED'}],
    comment: 'Factsheet archived'
  }
  return lx.executeGraphQL(query, variables)
    .then(res => {
      Vue.notify({
        group: 'report',
        type: 'success',
        title: `${node.displayName} archived`
      })
      commit('removeNode', { node })
      dispatch('fetchDataset')
    })
    .catch(err => {
      console.error(err)
      if (Array.isArray(err.entries)) {
        err.entries.forEach(entry => {
          Vue.notify({
            group: 'report',
            type: 'error',
            text: `${entry.message}`
          })
        })
      } else {
        Vue.notify({
          group: 'report',
          type: 'error',
          title: 'Error while archiving factsheet',
          text: `Check console for more details`
        })
      }
      dispatch('fetchDataset')
    })
}

export const updateFactsheetParent = ({dispatch, state, commit}, { source, target, validateOnly = false }) => {
  if (target.level >= state.maxLevel) return // should not add node to a level that will not be displayed
  const factsheetType = state.factsheetType
  const parentFragment = `... on ${factsheetType}{parent:relToParent{edges{node{factSheet{id name}}}}}`
  const id = source.id
  const rev = source.rev
  const relToParentID = source.parent.relID
  const newParentID = target.id
  const query = `mutation($id:ID!,$rev:Long,$patches:[Patch]!,$comment:String,$validateOnly:Boolean){op:updateFactSheet(id:$id,rev:$rev,patches:$patches,comment:$comment,validateOnly:$validateOnly){factSheet{id type name displayName ${parentFragment}}}}`
  const variables = {
    id,
    rev,
    patches: [
      { op: 'replace', path: `/relToParent/${relToParentID}`, value: JSON.stringify({ factSheetId: newParentID, description: '' }) }
    ],
    validateOnly
  }
  return lx.executeGraphQL(query, variables)
    .then(res => {
      const node = res.op.factSheet
      node.parent = node.parent.edges.map(edge => { return {relID: edge.node.id, id: edge.node.factSheet.id, name: edge.node.factSheet.name} }).shift()
      Vue.notify({
        group: 'report',
        type: 'success',
        title: `Moved ${node.name} to ${node.parent.name}`
      })
      commit('removeNode', { node: source })
      commit('setNode', { node })
      dispatch('fetchDataset')
    })
    .catch(err => {
      console.error(err)
      if (Array.isArray(err.entries)) {
        err.entries.forEach(entry => {
          Vue.notify({
            group: 'report',
            type: 'error',
            text: `${entry.message}`
          })
        })
      } else {
        Vue.notify({
          group: 'report',
          type: 'error',
          title: 'Error while archiving factsheet',
          text: `Check console for more details`
        })
      }
      dispatch('fetchDataset')
      console.error(err)
    })
}
