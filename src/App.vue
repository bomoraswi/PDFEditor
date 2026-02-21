<template>
  <v-app :class="{ 'editor-container': isEditorRoute }">
    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      class="mobile-nav"
    >
      <v-list nav>
        <v-list-item
          v-for="item in items"
          :key="item.title"
          :to="item.to"
          link
          :title="item.title"
          class="mb-2 rounded-lg"
        ></v-list-item>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="pa-4">
            <v-btn color="black" block flat class="text-white">Get Started</v-btn>
        </div>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar :elevation="0" class="border-b" height="64" color="white" v-if="!isEditorRoute">
      <v-container class="d-flex align-center py-0 fill-height" style="max-width: 1440px;">
        <!-- Logo -->
        <div class="d-flex align-center cursor-pointer logo-container" @click="$router.push('/')">
          <img src="@/assets/logo.png" alt="PDF Editor" height="40" class="mr-3"/>
          <span class="font-weight-black text-h5">PDF <span class="text-primary">Editor</span></span>
        </div>

        <v-spacer></v-spacer>

        <!-- Document Name -->
        <div v-if="fileName" class="text-h6 font-weight-medium text-grey-darken-3 text-truncate text-center mx-4" style="max-width: 400px;">
          {{ fileName }}
        </div>

        <v-spacer></v-spacer>

        <!-- Right Side Actions -->
        <div class="d-none d-md-flex align-center">
            <v-btn 
              prepend-icon="mdi-share-variant" 
              variant="text" 
              class="text-capitalize mr-2" 
              @click="showInviteDialog = true"
            >
              Invite Friend
            </v-btn>
            <v-btn color="black" class="text-white text-capitalize px-6" rounded="pill" elevation="0">Get Started</v-btn>
        </div>

        <!-- Mobile Menu Button -->
        <v-app-bar-nav-icon
          variant="text"
          @click.stop="drawer = !drawer"
          class="d-md-none ml-2"
        ></v-app-bar-nav-icon>

      </v-container>
    </v-app-bar>

    <!-- Invite Friend Dialog -->
    <v-dialog v-model="showInviteDialog" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="d-flex justify-space-between align-center pa-4 bg-grey-lighten-4">
          <span class="text-h6 font-weight-bold">Invite a Friend</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showInviteDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6 text-center">
          <v-icon icon="mdi-account-group-outline" size="64" color="primary" class="mb-4"></v-icon>
          <div class="text-h6 font-weight-medium mb-2">Share PDF Editor</div>
          <p class="text-body-2 text-grey-darken-1 mb-6">
            Share this link with your friends so they can edit PDFs easily!
          </p>
          
          <v-text-field
            v-model="shareUrl"
            readonly
            variant="outlined"
            density="comfortable"
            bg-color="grey-lighten-5"
            hide-details
            class="mb-4"
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyToClipboard"
          ></v-text-field>
          
          <v-btn
            color="primary"
            block
            height="48"
            class="text-capitalize font-weight-bold"
            @click="copyToClipboard"
          >
            Copy Link
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar for copy feedback -->
    <v-snackbar
      v-model="showSnackbar"
      color="success"
      timeout="2000"
      location="top"
    >
      Link copied to clipboard!
    </v-snackbar>

    <!-- Main Content -->
    <v-main>
      <v-container>
        <router-view/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

const store = useStore()
const drawer = ref(false)
const showInviteDialog = ref(false)
const shareUrl = ref(window.location.origin)
const showSnackbar = ref(false)

const fileName = computed(() => store.getters.getFile?.name)
const route = useRoute()
const isEditorRoute = computed(() => route.path === '/editor')

// Navigation items
const items = ref([])

const copyToClipboard = () => {
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    showSnackbar.value = true
    setTimeout(() => {
        showInviteDialog.value = false
    }, 1000)
  })
}
</script>

<style>
#app {
  font-family: 'Inter', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f8f9fa; /* Light gray background for the whole app */
}

/* Modern App Bar Styles */
.app-bar-modern {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.nav-btn {
  color: #4a5568 !important;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  color: #000000 !important;
  background-color: rgba(0, 0, 0, 0.04) !important;
}

.nav-btn.v-btn--active {
  color: #000000 !important;
  font-weight: 700 !important;
}

.logo-container {
  transition: opacity 0.2s;
}

.logo-container:hover {
  opacity: 0.8;
}

/* Editor specific container override */
  .editor-container .v-container {
    max-width: 100% !important;
    padding: 0 !important;
  }
  
  /* Keep default for others, or ensure App.vue doesn't force it globally incorrectly */
  /* Revert global force */
  .v-container {
    /* max-width: 1440px !important; - Let Vuetify handle default or set a reasonable max */
  }
  </style>
