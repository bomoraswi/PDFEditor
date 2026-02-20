<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center bg-grey-lighten-3" fluid>
    <v-card class="w-100 pa-8 rounded-xl" max-width="800" elevation="4">
      <!-- Header Section -->
      <div class="text-center mb-8">
        <v-icon icon="mdi-file-document-check-outline" size="64" color="primary" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">File Uploaded Successfully!</h2>
        <p class="text-subtitle-1 text-grey-darken-1" v-if="file">
          {{ file.name }} ({{ formatFileSize(file.size) }})
        </p>
      </div>

      <v-divider class="mb-8"></v-divider>

      <!-- Options Grid -->
      <h3 class="text-h6 font-weight-medium mb-6 text-center text-uppercase text-grey-darken-2" style="letter-spacing: 1px;">
        Choose an Action
      </h3>

      <v-row>
        <!-- Option 1: View & Sign -->
        <v-col cols="12" md="4">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 8 : 2"
              class="option-card h-100 d-flex flex-column align-center justify-center pa-6 text-center cursor-pointer"
              @click="router.push('/editor')"
              color="white"
            >
              <v-avatar color="primary-lighten-5" size="80" class="mb-4">
                <v-icon icon="mdi-draw" color="primary" size="40"></v-icon>
              </v-avatar>
              <div class="text-h6 font-weight-bold mb-2">Sign & Edit</div>
              <div class="text-body-2 text-grey">View the PDF, add signatures, and make edits.</div>
            </v-card>
          </v-hover>
        </v-col>

        <!-- Option 2: Convert to Word -->
        <v-col cols="12" md="4">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 8 : 2"
              class="option-card h-100 d-flex flex-column align-center justify-center pa-6 text-center cursor-pointer"
              @click="handleConvert"
              :disabled="isConverting"
              color="white"
            >
              <v-avatar color="orange-lighten-5" size="80" class="mb-4">
                <v-icon icon="mdi-file-word-box" color="orange-darken-2" size="40"></v-icon>
              </v-avatar>
              <div class="text-h6 font-weight-bold mb-2">Convert to Word</div>
              <div class="text-body-2 text-grey">Convert your PDF to an editable Word document.</div>
              
              <v-progress-linear
                v-if="isConverting"
                indeterminate
                color="orange-darken-2"
                class="mt-4"
                rounded
                height="6"
              ></v-progress-linear>
            </v-card>
          </v-hover>
        </v-col>

        <!-- Option 3: Compress (Placeholder) -->
        <v-col cols="12" md="4">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 8 : 2"
              class="option-card h-100 d-flex flex-column align-center justify-center pa-6 text-center cursor-pointer"
              @click="handleCompress"
              color="white"
            >
              <v-avatar color="teal-lighten-5" size="80" class="mb-4">
                <v-icon icon="mdi-zip-box" color="teal-darken-2" size="40"></v-icon>
              </v-avatar>
              <div class="text-h6 font-weight-bold mb-2">Compress PDF</div>
              <div class="text-body-2 text-grey">Reduce file size while maintaining quality.</div>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>

      <div class="d-flex justify-center mt-8">
        <v-btn
          variant="text"
          color="grey-darken-1"
          prepend-icon="mdi-upload"
          @click="router.push('/')"
        >
          Upload Another File
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const file = computed(() => store.getters.getFile)
const isConverting = ref(false)

onMounted(() => {
  if (!file.value) {
    router.push('/')
  }
})

const handleConvert = () => {
  isConverting.value = true
  // Simulate conversion process
  setTimeout(() => {
    isConverting.value = false
    alert('Conversion feature coming soon! (Backend integration required)')
  }, 2000)
}

const handleCompress = () => {
  alert('Compression feature coming soon!')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.option-card {
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.option-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0,0,0,0.1);
}
</style>
