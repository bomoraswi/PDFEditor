import { createStore } from 'vuex'

export default createStore({
  state: {
    uploadedFile: null
  },
  getters: {
    getFile: (state) => state.uploadedFile
  },
  mutations: {
    SET_FILE(state, file) {
      state.uploadedFile = file
    }
  },
  actions: {
    setFile({ commit }, file) {
      commit('SET_FILE', file)
    }
  },
  modules: {
  }
})
