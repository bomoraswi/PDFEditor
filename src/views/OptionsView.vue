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
              :disabled="isCompressing"
              color="white"
            >
              <v-avatar color="teal-lighten-5" size="80" class="mb-4">
                <v-icon icon="mdi-zip-box" color="teal-darken-2" size="40"></v-icon>
              </v-avatar>
              <div class="text-h6 font-weight-bold mb-2">Compress PDF</div>
              <div class="text-body-2 text-grey">Reduce file size while maintaining quality.</div>

              <v-progress-linear
                v-if="isCompressing"
                indeterminate
                color="teal-darken-2"
                class="mt-4"
                rounded
                height="6"
              ></v-progress-linear>
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

    <!-- Compression Dialog -->
    <v-dialog v-model="showCompressionDialog" max-width="500" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="text-h5 pa-4 bg-primary text-white">
          <v-icon icon="mdi-zip-box" class="mr-2"></v-icon>
          {{ compressionResult ? 'Compression Complete' : 'Compressing PDF' }}
        </v-card-title>

        <v-card-text class="pa-6">
          <!-- Progress State -->
          <div v-if="!compressionResult" class="text-center py-4">
            <v-progress-circular
              :model-value="compressionProgress"
              color="primary"
              size="80"
              width="8"
              class="mb-6"
            >
              <span class="text-h6 font-weight-bold">{{ compressionProgress }}%</span>
            </v-progress-circular>
            <div class="text-h6 font-weight-medium mb-2">{{ compressionStatus }}</div>
            <div class="text-body-2 text-grey">Please wait while we optimize your document...</div>
          </div>

          <!-- Result State -->
          <div v-else>
            <div class="d-flex justify-space-between align-center mb-6 pa-4 bg-grey-lighten-4 rounded">
              <div class="text-center">
                <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Original Size</div>
                <div class="text-h6">{{ formatFileSize(compressionResult.originalSize) }}</div>
              </div>
              
              <v-icon icon="mdi-arrow-right" color="grey"></v-icon>
              
              <div class="text-center">
                <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">New Size</div>
                <div class="text-h6 text-success font-weight-bold">{{ formatFileSize(compressionResult.newSize) }}</div>
              </div>
            </div>
            
            <div class="text-center">
              <v-chip
                :color="compressionResult.reduction > 0 ? 'success' : 'warning'"
                size="large"
                variant="flat"
                class="px-6"
              >
                <v-icon start :icon="compressionResult.reduction > 0 ? 'mdi-check-circle' : 'mdi-alert'"></v-icon>
                <span class="font-weight-bold text-body-1">
                  {{ compressionResult.reduction > 0 ? `${compressionResult.percentage}% Smaller` : 'No Reduction' }}
                </span>
              </v-chip>
              <div class="mt-2 text-caption text-grey" v-if="compressionResult.reduction > 0">
                Saved {{ formatFileSize(compressionResult.reduction) }}
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            v-if="!compressionResult"
            color="grey-darken-1"
            variant="text"
            @click="cancelCompression" 
          >
            Cancel
          </v-btn>
          <template v-else>
            <v-btn color="grey-darken-1" variant="text" @click="showCompressionDialog = false">
              Close
            </v-btn>
            <v-btn 
              color="primary" 
              variant="flat" 
              prepend-icon="mdi-download"
              @click="downloadCompressedFile"
              :disabled="compressionResult.reduction <= 0"
            >
              Download File
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const store = useStore()
const router = useRouter()
const file = computed(() => store.getters.getFile)
const isConverting = ref(false)
const isCompressing = ref(false)
const showCompressionDialog = ref(false)
const compressionProgress = ref(0)
const compressionStatus = ref('')
const compressionResult = ref(null)
const compressedPdfBytes = ref(null)
const isCancelled = ref(false)

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

const handleCompress = async () => {
  if (!file.value) return
  isCompressing.value = true
  showCompressionDialog.value = true
  compressionProgress.value = 0
  compressionStatus.value = 'Initializing...'
  compressionResult.value = null
  compressedPdfBytes.value = null
  isCancelled.value = false
  
  try {
    const arrayBuffer = await file.value.arrayBuffer()
    
    // 1. Load the original PDF
    compressionStatus.value = 'Loading PDF...'
    const loadingTask = pdfjsLib.getDocument(arrayBuffer)
    const originalPdf = await loadingTask.promise
    
    // 2. Create a new PDF document
    const newPdfDoc = await PDFDocument.create()
    
    const numPages = originalPdf.numPages
    
    // 3. Process each page
    for (let i = 1; i <= numPages; i++) {
      if (isCancelled.value) throw new Error('Cancelled by user')

      compressionStatus.value = `Processing page ${i} of ${numPages}...`
      compressionProgress.value = Math.round(((i - 1) / numPages) * 100)
      
      const page = await originalPdf.getPage(i)
      
      // Use a scale of 1.5 for decent quality but good compression
      // 1.0 = 72 DPI (standard screen)
      // 1.5 = 108 DPI
      const scale = 1.5
      const viewport = page.getViewport({ scale })
      
      // Create an offscreen canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      // Render the page to the canvas
      await page.render({ canvasContext: context, viewport }).promise
      
      // Convert canvas to JPEG with 0.7 quality (70%)
      const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.7)
      
      // Embed the JPEG into the new PDF
      const jpgImage = await newPdfDoc.embedJpg(jpgDataUrl)
      
      // Add a page to the new PDF with the same dimensions as the original (scaled back)
      const pageDims = jpgImage.scale(1 / scale)
      const newPage = newPdfDoc.addPage([pageDims.width, pageDims.height])
      
      // Draw the image on the new page
      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: pageDims.width,
        height: pageDims.height,
      })
      
      // Yield to UI thread to allow progress update
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    if (isCancelled.value) throw new Error('Cancelled by user')
    
    compressionStatus.value = 'Finalizing PDF...'
    compressionProgress.value = 100
    
    // Save the new compressed PDF
    const compressedBytes = await newPdfDoc.save()
    compressedPdfBytes.value = compressedBytes
    
    // Check size reduction
    const originalSize = file.value.size
    const compressedSize = compressedBytes.byteLength
    const reduction = originalSize - compressedSize
    const percentage = reduction > 0 ? ((reduction / originalSize) * 100).toFixed(1) : 0
    
    compressionResult.value = {
        originalSize,
        newSize: compressedSize,
        reduction,
        percentage
    }
    
  } catch (error) {
    if (error.message === 'Cancelled by user') {
        showCompressionDialog.value = false
    } else {
        console.error('Compression error:', error)
        alert('Failed to compress PDF.')
        showCompressionDialog.value = false
    }
  } finally {
    isCompressing.value = false
  }
}

const cancelCompression = () => {
    isCancelled.value = true
}

const downloadCompressedFile = () => {
    if (!compressedPdfBytes.value) return
    
    const blob = new Blob([compressedPdfBytes.value], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `compressed_${file.value.name}`
    link.click()
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
