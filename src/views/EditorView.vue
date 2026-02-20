<template>
  <v-container class="fill-height d-flex flex-column align-center bg-grey-lighten-3" fluid>
    <div v-if="!pdfDoc" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-h6 text-grey-darken-1">Loading Document...</div>
    </div>
    
    <div v-else class="d-flex flex-column align-center w-100 h-100" style="max-width: 1000px;">
      <!-- Toolbar -->
      <v-toolbar density="compact" class="mb-4 rounded-lg px-2" elevation="2" color="white">
        <v-btn icon @click="router.push('/options')" title="Back to Options">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        
        <v-divider vertical class="mx-2"></v-divider>

        <v-btn icon @click="prevPage" :disabled="pageNum <= 1">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <span class="mx-4 text-body-2 font-weight-medium">Page {{ pageNum }} of {{ numPages }}</span>
        <v-btn icon @click="nextPage" :disabled="pageNum >= numPages">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
        
        <v-divider vertical class="mx-2"></v-divider>
        
        <v-btn-toggle v-model="tool" mandatory density="compact" class="mx-2" color="primary" variant="outlined">
          <v-btn value="view" size="small">
            <v-icon start>mdi-eye</v-icon>
            View
          </v-btn>
          <v-btn value="sign" size="small">
            <v-icon start>mdi-draw</v-icon>
            Sign
          </v-btn>
          <v-btn value="text" size="small">
            <v-icon start>mdi-format-text</v-icon>
            Text
          </v-btn>
        </v-btn-toggle>
        
        <v-spacer></v-spacer>

        <template v-if="tool === 'sign' || tool === 'text'">
          <v-btn color="error" variant="text" @click="clearCurrentPage" class="mr-2" prepend-icon="mdi-eraser">
            Clear
          </v-btn>
          <v-btn color="success" variant="flat" @click="saveSignature" prepend-icon="mdi-download">
            Download
          </v-btn>
        </template>
      </v-toolbar>

      <!-- Canvas Container -->
      <div class="canvas-wrapper elevation-4 bg-white" ref="canvasWrapper"
           @click="handleCanvasClick"
      >
        <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
        <canvas 
          ref="signCanvas" 
          class="sign-canvas"
          :class="{ 'pointer-events-none': tool !== 'sign' }"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
        ></canvas>
        
        <!-- Text Layer -->
        <div class="text-layer" :class="{ 'pointer-events-none': tool !== 'text' }">
          <div v-for="text in (texts[pageNum] || [])" :key="text.id"
               class="text-element"
               :class="{ 
                 'pointer-events-auto': tool === 'text',
                 'is-editing': editingTextId === text.id 
               }"
               :style="{ left: text.x + 'px', top: text.y + 'px' }"
               @mousedown.stop="startDragText(text, $event)">
            
            <!-- Controls (Visible on hover or when editing) -->
            <div class="text-controls" v-if="tool === 'text'">
               <v-icon icon="mdi-drag" 
                       size="small" 
                       color="primary" 
                       class="move-handle"
                       @mousedown.stop="startDragText(text, $event)"
               ></v-icon>
               
               <v-icon icon="mdi-close-circle" 
                       color="error" 
                       size="small" 
                       class="delete-btn"
                       @click.stop="deleteText(text)"
               ></v-icon>
            </div>

            <textarea
              v-if="editingTextId === text.id"
              v-model="text.text"
              @blur="finishEditing(text)"
              @click.stop
              class="text-input"
              autofocus
              :style="{ fontSize: (text.fontSize || 16) + 'px', color: text.color || 'black' }"
              ref="textInputs"
            ></textarea>
            
            <div v-else 
                 class="text-content" 
                 :style="{ fontSize: (text.fontSize || 16) + 'px', color: text.color || 'black' }"
                 @dblclick.stop="editText(text)">
              {{ text.text || 'Double click to edit' }}
            </div>

            <!-- Baseline Guide -->
            <div class="baseline-guide" v-if="tool === 'text' || editingTextId === text.id"></div>
          </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Set worker source
// Note: In a production environment, you might want to bundle the worker.
// Using CDN for simplicity in this setup.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const store = useStore()
const router = useRouter()
const file = computed(() => store.getters.getFile)

const pdfDoc = ref(null)
const pageNum = ref(1)
const numPages = ref(0)
const scale = ref(1.2) // Adjusted scale
const pdfCanvas = ref(null)
const signCanvas = ref(null)
const canvasWrapper = ref(null)
const tool = ref('view')
const signatures = ref({}) // Store signatures per page: { pageNum: dataUrl }
const texts = ref({}) // Store texts per page: { pageNum: [{ id, x, y, text, fontSize, color }] }
const viewportSize = ref({ width: 0, height: 0 })
const editingTextId = ref(null)
const draggingTextId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

onMounted(async () => {
  if (!file.value) {
    console.warn('No file found in store, redirecting to home')
    router.push('/')
    return
  }
  
  try {
    const arrayBuffer = await file.value.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument(arrayBuffer)
    pdfDoc.value = await loadingTask.promise
    numPages.value = pdfDoc.value.numPages
    await renderPage(pageNum.value)
  } catch (error) {
    console.error('Error loading PDF:', error)
    alert('Failed to load PDF file.')
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleWindowMouseMove)
  window.removeEventListener('mouseup', handleWindowMouseUp)
})

const renderPage = async (num) => {
  if (!pdfDoc.value) return

  const page = await pdfDoc.value.getPage(num)
  const viewport = page.getViewport({ scale: scale.value })
  
  viewportSize.value = { width: viewport.width, height: viewport.height }

  const canvas = pdfCanvas.value
  const ctx = canvas.getContext('2d')
  
  canvas.height = viewport.height
  canvas.width = viewport.width
  
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  }
  
  await page.render(renderContext).promise
  
  // Resize sign canvas to match
  const sCanvas = signCanvas.value
  sCanvas.height = viewport.height
  sCanvas.width = viewport.width
  
  // Restore signature for this page if exists
  const savedSignature = signatures.value[num]
  if (savedSignature) {
    const ctx = sCanvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
    }
    img.src = savedSignature
  }
}

const saveCurrentSignature = () => {
  if (signCanvas.value) {
    signatures.value[pageNum.value] = signCanvas.value.toDataURL('image/png')
  }
}

const prevPage = () => {
  if (pageNum.value <= 1) return
  saveCurrentSignature()
  pageNum.value--
  renderPage(pageNum.value)
}

const nextPage = () => {
  if (pageNum.value >= numPages.value) return
  saveCurrentSignature()
  pageNum.value++
  renderPage(pageNum.value)
}

// Drawing Logic
const startDrawing = (e) => {
  if (tool.value !== 'sign') return
  isDrawing.value = true
  const rect = signCanvas.value.getBoundingClientRect()
  lastX.value = e.clientX - rect.left
  lastY.value = e.clientY - rect.top
}

const draw = (e) => {
  if (!isDrawing.value || tool.value !== 'sign') return
  const canvas = signCanvas.value
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(x, y)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.stroke()
  
  lastX.value = x
  lastY.value = y
}

const stopDrawing = () => {
  isDrawing.value = false
}

const handleCanvasClick = (e) => {
  if (tool.value !== 'text' || draggingTextId.value || editingTextId.value) return

  const rect = canvasWrapper.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Create new text
  const newText = {
    id: Date.now(),
    x: x,
    y: y,
    text: '',
    fontSize: 16,
    color: '#000000'
  }
  
  if (!texts.value[pageNum.value]) {
    texts.value[pageNum.value] = []
  }
  
  texts.value[pageNum.value].push(newText)
  editingTextId.value = newText.id
  
  // Focus will be handled by v-if
}

const startDragText = (text, e) => {
  if (tool.value !== 'text') return
  
  // If we are editing THIS text, only allow drag if we clicked the handle (or not the textarea)
  if (editingTextId.value === text.id) {
     if (e.target.tagName.toLowerCase() === 'textarea') {
         return 
     }
  }
  
  // If editing another text, close it first
  if (editingTextId.value && editingTextId.value !== text.id) {
      const oldText = texts.value[pageNum.value].find(t => t.id === editingTextId.value)
      if (oldText) finishEditing(oldText)
  }
  
  draggingTextId.value = text.id
  const rect = canvasWrapper.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - (rect.left + text.x),
    y: e.clientY - (rect.top + text.y)
  }
  
  window.addEventListener('mousemove', handleWindowMouseMove)
  window.addEventListener('mouseup', handleWindowMouseUp)
}

const handleWindowMouseMove = (e) => {
  if (draggingTextId.value) {
    const rect = canvasWrapper.value.getBoundingClientRect()
    const text = texts.value[pageNum.value].find(t => t.id === draggingTextId.value)
    if (text) {
        let newX = e.clientX - rect.left - dragOffset.value.x
        let newY = e.clientY - rect.top - dragOffset.value.y
        
        // Optional: Constrain to canvas bounds
        const viewport = viewportSize.value
        if (newX < 0) newX = 0
        if (newY < 0) newY = 0
        if (viewport.width && newX > viewport.width - 50) newX = viewport.width - 50
        if (viewport.height && newY > viewport.height - 20) newY = viewport.height - 20
        
        text.x = newX
        text.y = newY
    }
  }
}

const handleWindowMouseUp = () => {
  draggingTextId.value = null
  window.removeEventListener('mousemove', handleWindowMouseMove)
  window.removeEventListener('mouseup', handleWindowMouseUp)
}

const finishEditing = (text) => {
  editingTextId.value = null
  if (!text.text || !text.text.trim()) {
     // Remove empty text
     const idx = texts.value[pageNum.value].indexOf(text)
     if (idx > -1) texts.value[pageNum.value].splice(idx, 1)
  }
}

const editText = (text) => {
  if (tool.value === 'text') {
    editingTextId.value = text.id
  }
}

const deleteText = (text) => {
  const idx = texts.value[pageNum.value].indexOf(text)
  if (idx > -1) texts.value[pageNum.value].splice(idx, 1)
}

const clearCurrentPage = () => {
  if (tool.value === 'sign') {
    clearSignature()
  } else if (tool.value === 'text') {
    if (texts.value[pageNum.value]) {
      texts.value[pageNum.value] = []
    }
  }
}

const clearSignature = () => {
  const canvas = signCanvas.value
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

const saveSignature = async () => {
  saveCurrentSignature() // Save the current page signature first
  
  if (!file.value) return

  try {
    const arrayBuffer = await file.value.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    // Iterate through all pages
    for (let i = 0; i < pages.length; i++) {
      const pNum = i + 1
      const page = pages[i]
      const { width, height } = page.getSize()

      // 1. Embed Signatures
      const signatureDataUrl = signatures.value[pNum]
      if (signatureDataUrl) {
        const pngImage = await pdfDoc.embedPng(signatureDataUrl)
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        })
      }

      // 2. Embed Texts
      const pageTexts = texts.value[pNum]
      if (pageTexts && pageTexts.length > 0) {
        for (const t of pageTexts) {
            const textSize = t.fontSize / scale.value
            // Adjust X: Add padding (4px)
            const x = (t.x + 4) / scale.value
            
            // Adjust Y: 
            // PDF Y is bottom-up. HTML Y is top-down.
            // t.y is the top of the .text-element
            // Text starts at t.y + 4 (padding)
            // pdf-lib drawText Y is the baseline
            // StandardFonts.Helvetica baseline is approx 0.2 * size from bottom of em-box?
            // Actually, pdf-lib docs say:
            // "The y coordinate is the y-coordinate of the baseline of the text."
            
            // In HTML (top-left origin):
            // Top of text: t.y + 4
            // Baseline is roughly: t.y + 4 + (fontSize * 0.8) (approximation)
            // Bottom of text element: t.y + 4 + fontSize + 4
            
            // Let's try to map the top of the text visually to the PDF.
            // y_pdf_top = height - ((t.y + 4) / scale.value)
            // y_pdf_baseline = y_pdf_top - (textSize * 0.85) // Tuned offset
            
            // Let's try to use the bottom of the element as a reference if the user aligns the bottom?
            // User likely aligns the text itself.
            
            const y = height - ((t.y + 4) / scale.value) - (textSize * 0.75) 
            
            page.drawText(t.text, {
                x: x,
                y: y,
                size: textSize,
                font: font,
                color: rgb(0, 0, 0),
            })
        }
      }
    }
    
    const pdfBytes = await pdfDoc.save()
    downloadBlob(pdfBytes, 'signed_edited_document.pdf', 'application/pdf')
    
  } catch (error) {
    console.error('Error saving PDF:', error)
    alert('Failed to save signed PDF.')
  }
}

const downloadBlob = (data, fileName, mimeType) => {
  const blob = new Blob([data], { type: mimeType })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  border: 1px solid #ddd;
  display: inline-block;
  overflow: hidden; /* Ensure content doesn't spill */
}

.pdf-canvas {
  display: block;
}

.sign-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
  z-index: 10;
}

.pointer-events-none {
  pointer-events: none;
}

.text-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
}

.text-element {
  position: absolute;
  cursor: move;
  background: rgba(255, 255, 255, 0.5);
  padding: 4px;
  border: 1px dashed transparent;
  min-width: 50px;
  line-height: 1; /* Match PDF rendering closer */
}

.text-element:hover {
  border-color: #1976D2; /* Primary color */
}

.text-input {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #1976D2;
  outline: none;
  resize: none;
  overflow: hidden;
  font-family: Helvetica, sans-serif;
  min-width: 100px;
  width: auto;
  height: auto;
  line-height: 1;
}

.text-content {
  font-family: Helvetica, sans-serif;
  white-space: pre-wrap;
  position: relative;
  user-select: none;
  line-height: 1;
}

.text-controls {
  position: absolute;
  top: -24px;
  right: 0;
  display: none; /* Hidden by default */
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 2px;
  z-index: 30;
}

.text-element:hover .text-controls,
.text-element.is-editing .text-controls {
  display: flex;
  gap: 4px;
}

.move-handle {
  cursor: grab;
}

.move-handle:active {
  cursor: grabbing;
}

.delete-btn {
  cursor: pointer;
}

.baseline-guide {
  position: absolute;
  bottom: 4px; /* Matches padding-bottom */
  left: 0;
  width: 100%;
  border-bottom: 1px dashed rgba(255, 0, 0, 0.5);
  pointer-events: none;
}

.pointer-events-auto {
  pointer-events: auto;
}
</style>
