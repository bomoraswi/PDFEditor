<template>
  <v-container class="fill-height d-flex flex-column justify-center align-center py-10">
    <!-- Hero Text Section -->
    <div class="text-center mb-10">
      <h1 class="text-h3 text-md-h2 font-weight-black mb-4">
        Millions of people trust us with their PDFs
      </h1>
      <p class="text-h6 text-grey-darken-1">
        Edit, collaborate, and eSign documents — all with one comprehensive solution.
      </p>
    </div>

    <!-- Upload Area (Visible when no file is selected) -->
    <v-card
      v-if="!selectedFile"
      flat
      border
      class="upload-area w-100 d-flex flex-column align-center justify-center py-10 px-4"
      max-width="900"
      @click="triggerFileInput"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @dragenter.prevent
    >
      <v-icon
        icon="mdi-file-upload-outline"
        size="64"
        color="grey-darken-1"
        class="mb-4"
      ></v-icon>
      
      <div class="text-h6 mb-6 font-weight-medium">
        Drop document here to upload
      </div>

      <v-btn
        color="orange-darken-1"
        size="large"
        class="text-white text-capitalize px-8 mb-8 font-weight-bold"
        rounded="sm"
        elevation="0"
        @click.stop="triggerFileInput"
      >
        Select from device
      </v-btn>

      <div class="text-caption text-grey text-center" style="max-width: 600px;">
        Up to 100 MB for PDF and up to 25 MB for DOC, DOCX, RTF, PPT, PPTX, JPEG, PNG, JFIF, XLS, XLSX or TXT
      </div>
      
      <!-- Hidden File Input -->
      <input
        type="file"
        ref="fileInput"
        class="d-none"
        @change="handleFileUpload"
        accept=".pdf"
      />
    </v-card>

    <!-- Selected File Display (Visible when file is selected) -->
    <v-card
      v-else
      flat
      border
      class="w-100 pa-6"
      max-width="600"
    >
      <div class="d-flex align-center">
        <v-avatar color="primary-lighten-5" size="56" class="mr-4">
          <v-icon icon="mdi-file-pdf-box" color="error" size="32"></v-icon>
        </v-avatar>
        
        <div class="flex-grow-1 overflow-hidden">
          <div class="text-h6 text-truncate">{{ selectedFile.name }}</div>
          <div class="text-body-2 text-grey">
            {{ formatFileSize(selectedFile.size) }}
          </div>
        </div>

        <v-tooltip text="Remove file" location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-close"
              variant="text"
              color="grey-darken-1"
              @click="removeFile"
              class="ml-2"
              :disabled="isConverting"
            ></v-btn>
          </template>
        </v-tooltip>
      </div>

      <!-- Conversion Progress -->
      <div v-if="isConverting" class="mt-6">
        <div class="d-flex justify-space-between mb-2">
          <span class="text-body-2 font-weight-medium">Converting to Word...</span>
          <span class="text-body-2 text-primary">{{ conversionProgress }}%</span>
        </div>
        <v-progress-linear
          v-model="conversionProgress"
          color="primary"
          height="8"
          rounded
          striped
        ></v-progress-linear>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const fileInput = ref(null)
const selectedFile = ref(null)
const isConverting = ref(false)
const conversionProgress = ref(0)
const conversionComplete = ref(false)
const convertedPages = ref([])

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
  event.target.value = ''
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file) => {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    alert('Please select a PDF file')
    return
  }
  selectedFile.value = file
  
  // Save to store and redirect
  store.dispatch('setFile', file)
  router.push('/options')
}

const removeFile = () => {
  selectedFile.value = null
  isConverting.value = false
  conversionProgress.value = 0
  conversionComplete.value = false
  convertedPages.value = []
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
.upload-area {
  border: 2px dashed #e0e0e0 !important;
  background-color: #ffffff;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #fb8c00 !important; /* Orange border on hover */
  background-color: #fffbf5; /* Light orange tint on hover */
}
</style>
