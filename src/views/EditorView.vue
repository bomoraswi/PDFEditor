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
          <v-btn value="whiteout" size="small">
            <v-icon start>mdi-eraser-variant</v-icon>
            Erase
          </v-btn>
          <v-menu location="bottom">
            <template v-slot:activator="{ props }">
               <v-btn value="shape" size="small" v-bind="props">
                 <v-icon start>mdi-shape</v-icon>
                 Shapes
                 <v-icon end size="small">mdi-chevron-down</v-icon>
               </v-btn>
            </template>
            <v-list density="compact">
               <v-list-item @click="setShapeTool('checkbox')" :active="shapeType === 'checkbox'">
                  <template v-slot:prepend><v-icon>mdi-checkbox-blank-outline</v-icon></template>
                  <v-list-item-title>Checkbox</v-list-item-title>
               </v-list-item>
               <v-list-item @click="setShapeTool('radio')" :active="shapeType === 'radio'">
                  <template v-slot:prepend><v-icon>mdi-radiobox-blank</v-icon></template>
                  <v-list-item-title>Radio Button</v-list-item-title>
               </v-list-item>
               <v-list-item @click="setShapeTool('check')" :active="shapeType === 'check'">
                  <template v-slot:prepend><v-icon>mdi-check</v-icon></template>
                  <v-list-item-title>Check Mark</v-list-item-title>
               </v-list-item>
               <v-list-item @click="setShapeTool('cross')" :active="shapeType === 'cross'">
                  <template v-slot:prepend><v-icon>mdi-close</v-icon></template>
                  <v-list-item-title>Cross (X)</v-list-item-title>
               </v-list-item>
               <v-list-item @click="setShapeTool('circle')" :active="shapeType === 'circle'">
                  <template v-slot:prepend><v-icon>mdi-circle</v-icon></template>
                  <v-list-item-title>Black Circle</v-list-item-title>
               </v-list-item>
            </v-list>
          </v-menu>
        </v-btn-toggle>
        
        <v-spacer></v-spacer>

        <template v-if="tool === 'sign' || tool === 'text' || tool === 'whiteout' || tool === 'shape'">
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
           @mousedown="handleCanvasMouseDown"
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
        
        <!-- Whiteout Layer -->
        <div class="whiteout-layer" :class="{ 'pointer-events-none': tool !== 'whiteout' }">
           <div v-for="w in (whiteouts[pageNum] || [])" :key="w.id"
                class="whiteout-element"
                :style="{ 
                  left: w.x + 'px', 
                  top: w.y + 'px', 
                  width: w.width + 'px', 
                  height: w.height + 'px' 
                }">
             <v-icon v-if="tool === 'whiteout'" 
                     icon="mdi-close-circle" 
                     color="error" 
                     size="x-small" 
                     class="delete-btn-whiteout"
                     @click.stop="deleteWhiteout(w)"
             ></v-icon>
           </div>
           
           <!-- Current drawing whiteout -->
           <div v-if="isDrawingWhiteout"
                class="whiteout-element drawing"
                :style="{
                  left: currentWhiteout.x + 'px',
                  top: currentWhiteout.y + 'px',
                  width: currentWhiteout.width + 'px',
                  height: currentWhiteout.height + 'px'
                }">
           </div>
        </div>

        <!-- Shapes Layer -->
        <div class="shape-layer" :class="{ 'pointer-events-none': tool !== 'shape' }">
          <div v-for="shape in (shapes[pageNum] || [])" :key="shape.id"
               class="shape-element"
               :class="{ 'is-selected': selectedShapeId === shape.id }"
               :style="{ left: shape.x + 'px', top: shape.y + 'px', width: shape.width + 'px', height: shape.height + 'px' }"
               @mousedown.stop="startDragShape(shape, $event)"
               @click.stop="selectShape(shape)">
            
            <div class="shape-content" style="width: 100%; height: 100%;">
               <!-- Checkbox -->
               <div v-if="shape.type === 'checkbox'" 
                    style="width: 100%; height: 100%; border: 2px solid black; background: transparent;"></div>
               
               <!-- Radio Button -->
               <div v-else-if="shape.type === 'radio'" 
                    style="width: 100%; height: 100%; border: 2px solid black; border-radius: 50%; background: transparent;"></div>
               
               <!-- Black Circle -->
               <div v-else-if="shape.type === 'circle'" 
                    style="width: 100%; height: 100%; border-radius: 50%; background: black;"></div>
               
               <!-- Check Mark -->
               <v-icon v-else-if="shape.type === 'check'" icon="mdi-check" color="black" style="width: 100%; height: 100%; font-size: 100%;"></v-icon>
               
               <!-- Cross (X) -->
               <v-icon v-else-if="shape.type === 'cross'" icon="mdi-close" color="black" style="width: 100%; height: 100%; font-size: 100%;"></v-icon>
            </div>

            <!-- Resize Handle -->
            <div v-if="selectedShapeId === shape.id" 
                 class="resize-handle"
                 @mousedown.stop="startResizeShape(shape, $event)"></div>

            <v-icon v-if="tool === 'shape' && selectedShapeId === shape.id" 
                    icon="mdi-close-circle" 
                    color="error" 
                    size="x-small" 
                    class="delete-btn-shape"
                    @click.stop="deleteShape(shape)"
            ></v-icon>
          </div>
        </div>

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
               <!-- Formatting Tools -->
               <template v-if="editingTextId === text.id">
                   <v-btn size="x-small" variant="text" icon @click.stop="toggleBold(text)" :color="text.isBold ? 'primary' : 'grey-darken-1'">
                     <v-icon>mdi-format-bold</v-icon>
                   </v-btn>
                   <v-btn size="x-small" variant="text" icon @click.stop="toggleItalic(text)" :color="text.isItalic ? 'primary' : 'grey-darken-1'">
                     <v-icon>mdi-format-italic</v-icon>
                   </v-btn>
                   <v-menu>
                     <template v-slot:activator="{ props }">
                        <v-btn size="x-small" variant="text" icon v-bind="props">
                          <v-icon>mdi-format-size</v-icon>
                        </v-btn>
                     </template>
                     <v-list density="compact">
                       <v-list-item v-for="size in [12, 14, 16, 18, 20, 24, 30]" :key="size" @click="text.fontSize = size" :value="size">
                         <v-list-item-title>{{ size }}</v-list-item-title>
                       </v-list-item>
                     </v-list>
                   </v-menu>
                   <v-menu>
                     <template v-slot:activator="{ props }">
                        <v-btn size="x-small" variant="text" icon v-bind="props">
                          <v-icon>mdi-format-font</v-icon>
                        </v-btn>
                     </template>
                     <v-list density="compact">
                       <v-list-item v-for="font in ['Helvetica', 'Times Roman', 'Courier']" :key="font" @click="text.fontFamily = font" :value="font">
                         <v-list-item-title>{{ font }}</v-list-item-title>
                       </v-list-item>
                     </v-list>
                   </v-menu>
                   <v-divider vertical class="mx-1"></v-divider>
               </template>

               <v-icon icon="mdi-drag" 
                       size="small" 
                       color="primary" 
                       class="move-handle mx-1"
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
              :style="{ 
                fontSize: (text.fontSize || 16) + 'px', 
                color: text.color || 'black',
                fontWeight: text.isBold ? 'bold' : 'normal',
                fontStyle: text.isItalic ? 'italic' : 'normal',
                fontFamily: getCssFontFamily(text.fontFamily)
              }"
              ref="textInputs"
            ></textarea>
            
            <div v-else 
                 class="text-content" 
                 :style="{ 
                    fontSize: (text.fontSize || 16) + 'px', 
                    color: text.color || 'black',
                    fontWeight: text.isBold ? 'bold' : 'normal',
                    fontStyle: text.isItalic ? 'italic' : 'normal',
                    fontFamily: getCssFontFamily(text.fontFamily)
                 }"
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
const whiteouts = ref({}) // Store whiteouts per page: { pageNum: [{ id, x, y, width, height }] }
const shapes = ref({}) // Store shapes per page: { pageNum: [{ id, x, y, type }] }
const viewportSize = ref({ width: 0, height: 0 })
const editingTextId = ref(null)
const draggingTextId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

const isDrawing = ref(false)
const isDrawingWhiteout = ref(false)
const shapeType = ref('checkbox') // checkbox, radio, check, cross, circle
const currentWhiteout = ref({ x: 0, y: 0, width: 0, height: 0 })

// Shape Resizing/Moving State
const selectedShapeId = ref(null)
const resizingShapeId = ref(null)
const draggingShapeId = ref(null)
const initialShapeState = ref(null) // { x, y, width, height }
const startMousePos = ref({ x: 0, y: 0 })

const whiteoutStart = ref({ x: 0, y: 0 })
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

const handleCanvasMouseDown = (e) => {
  if (tool.value === 'whiteout') {
      const rect = canvasWrapper.value.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      isDrawingWhiteout.value = true
      whiteoutStart.value = { x, y }
      currentWhiteout.value = { x, y, width: 0, height: 0 }
      
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
  }
}

const handleCanvasClick = (e) => {
  if (tool.value === 'whiteout') return // Handled by mousedown/up
  if (draggingTextId.value || editingTextId.value || draggingShapeId.value || resizingShapeId.value) return

  const rect = canvasWrapper.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  if (tool.value !== 'text' && tool.value !== 'shape') return
  
  if (tool.value === 'shape') {
      const newShape = {
          id: Date.now(),
          x: x - 10, // Center the 20x20 shape
          y: y - 10,
          width: 20,
          height: 20,
          type: shapeType.value
      }
      
      if (!shapes.value[pageNum.value]) {
          shapes.value[pageNum.value] = []
      }
      
      shapes.value[pageNum.value].push(newShape)
      selectedShapeId.value = newShape.id // Select newly created shape
      return
  }

  // Create new text
  const newText = {
    id: Date.now(),
    x: x,
    y: y,
    text: '',
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Helvetica',
    isBold: false,
    isItalic: false
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

const startDragShape = (shape, e) => {
  if (tool.value !== 'shape') return
  
  // Select the shape
  selectedShapeId.value = shape.id
  
  draggingShapeId.value = shape.id
  const rect = canvasWrapper.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - (rect.left + shape.x),
    y: e.clientY - (rect.top + shape.y)
  }
  
  window.addEventListener('mousemove', handleWindowMouseMove)
  window.addEventListener('mouseup', handleWindowMouseUp)
}

const startResizeShape = (shape, e) => {
  if (tool.value !== 'shape') return
  
  resizingShapeId.value = shape.id
  initialShapeState.value = { ...shape }
  startMousePos.value = { x: e.clientX, y: e.clientY }
  
  window.addEventListener('mousemove', handleWindowMouseMove)
  window.addEventListener('mouseup', handleWindowMouseUp)
}

const selectShape = (shape) => {
    if (tool.value === 'shape') {
        selectedShapeId.value = shape.id
    }
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
  } else if (draggingShapeId.value) {
    const rect = canvasWrapper.value.getBoundingClientRect()
    const shape = shapes.value[pageNum.value].find(s => s.id === draggingShapeId.value)
    if (shape) {
        let newX = e.clientX - rect.left - dragOffset.value.x
        let newY = e.clientY - rect.top - dragOffset.value.y
        
        // Optional: Constrain to canvas bounds
        const viewport = viewportSize.value
        if (newX < 0) newX = 0
        if (newY < 0) newY = 0
        if (viewport.width && newX > viewport.width - shape.width) newX = viewport.width - shape.width
        if (viewport.height && newY > viewport.height - shape.height) newY = viewport.height - shape.height
        
        shape.x = newX
        shape.y = newY
    }
  } else if (resizingShapeId.value) {
    const shape = shapes.value[pageNum.value].find(s => s.id === resizingShapeId.value)
    
    if (shape && initialShapeState.value) {
        const mouseX = e.clientX
        
        const deltaX = mouseX - startMousePos.value.x
        
        // Maintain aspect ratio 1:1 for shapes usually, or allow free?
        // Let's allow free resize but maybe square for checkbox/radio?
        // For simplicity, let's keep aspect ratio 1:1 if shift key is pressed?
        // Or just simpler: let's allow free resizing for now, but usually these shapes are square.
        // Let's enforce square for checkbox, radio, circle, check, cross to look good.
        
        const newSize = Math.max(10, initialShapeState.value.width + deltaX)
        
        shape.width = newSize
        shape.height = newSize
    }
  } else if (isDrawingWhiteout.value) {
    const rect = canvasWrapper.value.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top
    
    const width = currentX - whiteoutStart.value.x
    const height = currentY - whiteoutStart.value.y
    
    currentWhiteout.value = {
        x: width > 0 ? whiteoutStart.value.x : currentX,
        y: height > 0 ? whiteoutStart.value.y : currentY,
        width: Math.abs(width),
        height: Math.abs(height)
    }
  }
}

const handleWindowMouseUp = () => {
  if (draggingTextId.value) {
    draggingTextId.value = null
  } else if (draggingShapeId.value) {
    draggingShapeId.value = null
  } else if (resizingShapeId.value) {
    resizingShapeId.value = null
    initialShapeState.value = null
  } else if (isDrawingWhiteout.value) {
      isDrawingWhiteout.value = false
      if (currentWhiteout.value.width > 5 && currentWhiteout.value.height > 5) {
          if (!whiteouts.value[pageNum.value]) {
              whiteouts.value[pageNum.value] = []
          }
          whiteouts.value[pageNum.value].push({
              id: Date.now(),
              ...currentWhiteout.value
          })
      }
      currentWhiteout.value = { x: 0, y: 0, width: 0, height: 0 }
  }
  
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

const deleteWhiteout = (w) => {
  const idx = whiteouts.value[pageNum.value].indexOf(w)
  if (idx > -1) whiteouts.value[pageNum.value].splice(idx, 1)
}

const toggleBold = (text) => {
  text.isBold = !text.isBold
}

const toggleItalic = (text) => {
  text.isItalic = !text.isItalic
}

const getCssFontFamily = (pdfFontFamily) => {
  switch (pdfFontFamily) {
    case 'Times Roman': return '"Times New Roman", Times, serif'
    case 'Courier': return '"Courier New", Courier, monospace'
    case 'Helvetica': 
    default: return 'Helvetica, Arial, sans-serif'
  }
}

const clearCurrentPage = () => {
  if (tool.value === 'sign') {
    clearSignature()
  } else if (tool.value === 'text') {
    if (texts.value[pageNum.value]) {
      texts.value[pageNum.value] = []
    }
  } else if (tool.value === 'whiteout') {
    if (whiteouts.value[pageNum.value]) {
      whiteouts.value[pageNum.value] = []
    }
  } else if (tool.value === 'shape') {
    if (shapes.value[pageNum.value]) {
      shapes.value[pageNum.value] = []
    }
  }
}

const setShapeTool = (type) => {
    shapeType.value = type
    tool.value = 'shape'
}

const deleteShape = (shape) => {
  const idx = shapes.value[pageNum.value].indexOf(shape)
  if (idx > -1) shapes.value[pageNum.value].splice(idx, 1)
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
    
    // Embed Standard Fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    const helveticaBoldObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
    
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const timesRomanItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
    const timesRomanBoldItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)
    
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier)
    const courierBoldFont = await pdfDoc.embedFont(StandardFonts.CourierBold)
    const courierObliqueFont = await pdfDoc.embedFont(StandardFonts.CourierOblique)
    const courierBoldObliqueFont = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique)

    const getFont = (family, isBold, isItalic) => {
      if (family === 'Times Roman') {
        if (isBold && isItalic) return timesRomanBoldItalicFont
        if (isBold) return timesRomanBoldFont
        if (isItalic) return timesRomanItalicFont
        return timesRomanFont
      } else if (family === 'Courier') {
        if (isBold && isItalic) return courierBoldObliqueFont
        if (isBold) return courierBoldFont
        if (isItalic) return courierObliqueFont
        return courierFont
      } else {
        // Helvetica (Default)
        if (isBold && isItalic) return helveticaBoldObliqueFont
        if (isBold) return helveticaBoldFont
        if (isItalic) return helveticaObliqueFont
        return helveticaFont
      }
    }
    
    // Iterate through all pages
    for (let i = 0; i < pages.length; i++) {
      const pNum = i + 1
      const page = pages[i]
      const { width, height } = page.getSize()

      // 0. Embed Whiteouts (First, to be under text)
      const pageWhiteouts = whiteouts.value[pNum]
      if (pageWhiteouts && pageWhiteouts.length > 0) {
        for (const w of pageWhiteouts) {
             const x = w.x / scale.value
             // PDF Y is bottom-up
             const y = height - (w.y / scale.value) - (w.height / scale.value)
             
             page.drawRectangle({
                 x: x,
                 y: y,
                 width: w.width / scale.value,
                 height: w.height / scale.value,
                 color: rgb(1, 1, 1), // White
                 borderColor: undefined,
                 borderWidth: 0,
             })
        }
      }

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

      // 3. Embed Shapes
      const pageShapes = shapes.value[pNum]
      if (pageShapes && pageShapes.length > 0) {
        for (const s of pageShapes) {
            const x = s.x / scale.value
            // PDF Y is bottom-up. Center is at x+10, y+10 in view coords
            const y = height - (s.y / scale.value) - (20 / scale.value) 
            const size = 20 / scale.value
            
            if (s.type === 'checkbox') {
                page.drawRectangle({
                    x: x,
                    y: y,
                    width: size,
                    height: size,
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 2,
                    color: undefined,
                })
            } else if (s.type === 'radio') {
                page.drawCircle({
                    x: x + size/2,
                    y: y + size/2,
                    size: size/2,
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 2,
                    color: undefined,
                })
            } else if (s.type === 'circle') {
                page.drawCircle({
                    x: x + size/2,
                    y: y + size/2,
                    size: size/2,
                    color: rgb(0, 0, 0),
                    borderColor: undefined,
                })
            } else if (s.type === 'check') {
                // Draw checkmark manually or use a font if available. Drawing lines is safer.
                // Simple checkmark path relative to box
                page.drawLine({
                    start: { x: x + size*0.2, y: y + size*0.5 },
                    end: { x: x + size*0.4, y: y + size*0.2 },
                    thickness: 2,
                    color: rgb(0, 0, 0),
                })
                page.drawLine({
                    start: { x: x + size*0.4, y: y + size*0.2 },
                    end: { x: x + size*0.8, y: y + size*0.8 },
                    thickness: 2,
                    color: rgb(0, 0, 0),
                })
            } else if (s.type === 'cross') {
                page.drawLine({
                    start: { x: x, y: y },
                    end: { x: x + size, y: y + size },
                    thickness: 2,
                    color: rgb(0, 0, 0),
                })
                page.drawLine({
                    start: { x: x, y: y + size },
                    end: { x: x + size, y: y },
                    thickness: 2,
                    color: rgb(0, 0, 0),
                })
            }
        }
      }

      // 4. Embed Texts
      const pageTexts = texts.value[pNum]
      if (pageTexts && pageTexts.length > 0) {
        for (const t of pageTexts) {
            const textSize = t.fontSize / scale.value
            // Adjust X: Add padding (4px)
            const x = (t.x + 4) / scale.value
            
            const y = height - ((t.y + 4) / scale.value) - (textSize * 0.75) 
            
            const font = getFont(t.fontFamily, t.isBold, t.isItalic)
            
            // Draw background if needed (optional future feature)
            // if (t.backgroundColor) ...
            
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

  .whiteout-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 15; /* Below text layer (20), above canvas */
  }

  .whiteout-element {
    position: absolute;
    background-color: white;
    /* border: 1px dashed #ccc; Optional: Show border only when editing? */
  }
  
  .whiteout-element.drawing {
    border: 1px dashed #1976D2;
    background-color: rgba(255, 255, 255, 0.5);
  }

  .whiteout-element:hover {
    border: 1px dashed #ccc;
  }

  .delete-btn-whiteout {
    position: absolute;
    top: -8px;
    right: -8px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    display: none;
  }

  .whiteout-element:hover .delete-btn-whiteout {
    display: block;
  }

  .shape-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 25; /* Above text layer (20) */
  }

  .shape-element {
    position: absolute;
    cursor: pointer;
  }

  .shape-element.is-selected {
    outline: 2px dashed #1976D2;
  }

  .resize-handle {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 10px;
    height: 10px;
    background: #1976D2;
    border: 1px solid white;
    cursor: nwse-resize;
    z-index: 31;
  }

  .delete-btn-shape {
    position: absolute;
    top: -8px;
    right: -8px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    display: none;
    z-index: 30;
  }

  .shape-element:hover .delete-btn-shape,
  .shape-element.is-selected .delete-btn-shape {
    display: block;
  }
</style>
