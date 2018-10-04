import Vue from 'vue'

export const setLevel = ({ commit, dispatch }, level) => {
  commit('setLevel', level)
  dispatch('mapNodes')
}

export const setEditing = ({ commit }, editing) => {
  if (!editing) commit('setSelected', '')
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

export const fetchDataset = ({ commit, dispatch, state }) => {
  const filter = state.filter
  const query = `
    query($filter:FilterInput){
      op:allFactSheets(filter:$filter) {
        edges {
          node {
            id
            name
            displayName
            rev
            ... on BusinessCapability {
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
  lx.executeGraphQL(query, { filter })
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
            const parent = accumulator[node.parent.id] || {}
            const children = parent && Array.isArray(parent.children) ? parent.children : []
            children.push(node.id)
            accumulator[node.parent.id] = { ...parent, children }
            level = parent.level ? parent.level + 1 : undefined
          }
          if (node.parent === undefined) node.root = true
          accumulator[node.id] = { ...(accumulator[node.id] || {}), ...node, level }
          return accumulator
        }, {})

      const mapFactsheetChildren = (child, parent) => {
        if (typeof child === 'string') {
          child = dataset[child]
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
      const mapped = Object.values(dataset)
        .filter(factsheet => factsheet.root === true)
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
      return Promise.resolve(mapped)
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

export const createFactsheet = ({commit, dispatch, state}, { name, parentID }) => {
  const parentFragment = `... on BusinessCapability{parent:relToParent{edges{node{factSheet{id}}}}}`
  const query = `mutation($input:BaseFactSheetInput!,$patches:[Patch]){op:createFactSheet(input:$input,patches:$patches){factSheet{id type name displayName ${parentFragment}}}}`
  const variables = {
    input: {
      name,
      type: state.factsheetType
    },
    patches: []
  }
  if (parentID) {
    variables.patches.push({ op: 'add', path: `/relToParent/new_${parentID}`, value: JSON.stringify({ factSheetId: parentID }) })
  }
  return lx.executeGraphQL(query, variables)
    .then(res => {
      console.log('res', res)
      Vue.notify({
        group: 'report',
        type: 'success',
        title: `${name} added`
      })
      dispatch('fetchDataset')
    })
    .catch(err => {
      Vue.notify({
        group: 'report',
        type: 'error',
        title: 'Error while creating factsheet',
        text: `Check console for more details`
      })
      dispatch('fetchDataset')
      console.error(err)
    })
}

export const archiveFactsheet = ({commit, dispatch, state}, id) => {
  const query = `mutation($id:ID!,$patches:[Patch]!,$comment:String){updateFactSheet(id:$id,patches:$patches,comment:$comment){factSheet{id}}}`
  const variables = {
    id,
    patches: [{op: 'add', path: '/status', value: 'ARCHIVED'}],
    comment: 'Factsheet archived'
  }
  return lx.executeGraphQL(query, variables)
    .then(res => {
      console.log('res', res)
      Vue.notify({
        group: 'report',
        type: 'success',
        title: `${id} archived`
      })
      dispatch('fetchDataset')
    })
    .catch(err => {
      Vue.notify({
        group: 'report',
        type: 'error',
        title: 'Error while archiving factsheet',
        text: `Check console for more details`
      })
      dispatch('fetchDataset')
      console.error(err)
    })
}

export const updateFactsheetParent = ({dispatch, state}, { source, target, validateOnly = false }) => {
  if (target.level >= state.maxLevel) return // should not add node to a level that will not be displayed
  const id = source.id
  const rev = source.rev
  const relToParentID = source.parent.relID
  const newParentID = target.id
  const query = `mutation($id:ID!,$rev:Long,$patches:[Patch]!,$comment:String,$validateOnly:Boolean){updateFactSheet(id:$id,rev:$rev,patches:$patches,comment:$comment,validateOnly:$validateOnly){factSheet{id}}}`
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
      console.log('resupdated!', res)
      Vue.notify({
        group: 'report',
        type: 'success',
        title: `${source.name} updated`
      })
      dispatch('fetchDataset')
    })
    .catch(err => {
      if (Array.isArray(err.entries)) {
        err.entries.forEach(entry => {
          Vue.notify({
            group: 'report',
            type: 'error',
            // title: 'Error while updating factsheet',
            text: `${entry.message}`
          })
        })
      }
      dispatch('fetchDataset')
      console.error(err)
    })
}
