<template>
  <v-app>
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
            <v-btn variant="outlined" block color="primary" class="mb-3">Log in</v-btn>
            <v-btn color="black" block flat class="text-white">Get Started</v-btn>
        </div>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar 
      flat 
      height="80" 
      class="app-bar-modern"
    >
      <v-container class="d-flex align-center fill-height">
        <!-- Logo -->
        <div class="d-flex align-center cursor-pointer logo-container" @click="$router.push('/')">
          <span class="font-weight-black text-h5">PDF <span class="text-primary">Editor</span></span>
        </div>

        <v-spacer></v-spacer>

        <!-- Desktop Navigation Items -->
        <div class="d-none d-md-flex align-center navigation-items">
          <v-btn
            v-for="item in items"
            :key="item.title"
            :to="item.to"
            variant="text"
            class="nav-btn mx-1 text-body-1 font-weight-medium text-capitalize"
            :ripple="false"
          >
            {{ item.title }}
          </v-btn>
        </div>

        <v-spacer></v-spacer>

        <!-- Right Side Actions -->
        <div class="d-none d-md-flex align-center">
            <v-btn variant="text" class="mr-2 text-capitalize font-weight-medium">Log in</v-btn>
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

    <!-- Main Content -->
    <v-main>
      <v-container>
        <router-view/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const drawer = ref(false)

// Navigation items
const items = ref([
  { title: 'Home', to: '/' },
  { title: 'Features', to: '/features' },
  { title: 'Pricing', to: '/pricing' },
])
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

.v-container {
  max-width: 1440px !important;
}
</style>
