<template>
  <div class="fill-height d-flex flex-column align-center bg-white pa-0" fluid>
    <!-- Signature Modal -->
    <v-dialog v-model="showSignatureModal" max-width="500px">
      <v-card>
        <v-card-title>Create Signature</v-card-title>
        <v-card-text>
          <div style="border: 1px solid #ccc; background: #fff;">
            <canvas ref="signaturePad" width="450" height="200" 
                    @mousedown="startSignature" 
                    @mousemove="drawSignature" 
                    @mouseup="stopSignature"
                    @mouseleave="stopSignature"
                    style="cursor: crosshair; touch-action: none;">
            </canvas>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" variant="text" @click="clearSignaturePad">Clear</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showSignatureModal = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveSignatureFromModal">Add Signature</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="!pdfDoc" class="text-center mt-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-h6 text-grey-darken-1">Loading Document...</div>
    </div>
    
    <div v-else class="d-flex flex-column align-center w-100 h-100">
      <!-- Top Mode Switcher -->
      <div class="d-flex align-center px-4 bg-white border-b" style="height: 50px; width: 100%; z-index: 10;">
          <v-btn variant="text" :color="!isFormMode ? 'primary' : 'grey-darken-1'" @click="isFormMode = false" class="text-capitalize font-weight-bold mr-2">Edit</v-btn>
          <v-btn variant="text" :color="isFormMode ? 'primary' : 'grey-darken-1'" @click="isFormMode = true" class="text-capitalize font-weight-bold">Create Form</v-btn>
      </div>

      <div class="d-flex w-100 flex-grow-1 overflow-hidden position-relative">
          <!-- Form Elements Sidebar -->
          <div v-if="isFormMode" class="bg-white border-r overflow-y-auto pa-4" style="width: 280px; min-width: 280px; height: 100%;">
              <div class="text-subtitle-2 font-weight-bold mb-4">Add form elements</div>
              <v-row dense>
                  <v-col cols="6" v-for="(item, i) in formElements" :key="i">
                      <v-card
                          variant="outlined"
                          class="d-flex flex-column align-center justify-center py-4 px-2 mb-2 fill-height cursor-pointer form-element-card"
                          color="orange-lighten-5"
                          style="border-color: #ffe0b2 !important;"
                          @mousedown="startDragFormElement($event, item)"
                          @click="addFormElement(item)"
                          draggable="true"
                      >
                          <div class="d-flex justify-space-between w-100 align-center mb-1 px-1">
                              <span class="text-caption font-weight-medium text-grey-darken-3 text-truncate" style="font-size: 0.75rem !important;">{{ item.label }}</span>
                              <v-icon size="x-small" color="grey-darken-3">{{ item.icon }}</v-icon>
                          </div>
                      </v-card>
                  </v-col>
              </v-row>
          </div>

          <div class="d-flex flex-column flex-grow-1 h-100 w-100 overflow-hidden">
              <!-- Toolbar (Always visible, but tools might change based on mode if needed, for now keep same) -->
              <v-toolbar density="compact" class="mb-4 px-2 border-b flex-shrink-0" elevation="0" color="#e7ecf1" height="80">
                <v-btn icon @click="router.push('/options')" title="Back to Options" class="mr-2">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                
                <v-divider vertical class="mx-2 my-4"></v-divider>

                <div class="mx-2 d-flex align-center">
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'view' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'view'">
                    <v-icon size="24" class="mb-1">mdi-eye</v-icon>
                    <span class="text-caption text-capitalize">Read</span>
                  </div>
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'sign' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'sign'; openSignatureModal()">
                    <v-icon size="24" class="mb-1">mdi-draw</v-icon>
                    <span class="text-caption text-capitalize">Sign</span>
                  </div>
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'text' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'text'">
                    <v-icon size="24" class="mb-1">mdi-format-text</v-icon>
                    <span class="text-caption text-capitalize">Text</span>
                  </div>
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'highlight' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'highlight'">
                    <v-icon size="24" class="mb-1">mdi-format-color-highlight</v-icon>
                    <span class="text-caption text-capitalize">Highlight</span>
                  </div>
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'strikeout' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'strikeout'">
                    <v-icon size="24" class="mb-1">mdi-format-strikethrough</v-icon>
                    <span class="text-caption text-capitalize">Strike</span>
                  </div>
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'underline' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'underline'">
                    <v-icon size="24" class="mb-1">mdi-format-underline</v-icon>
                    <span class="text-caption text-capitalize">Underline</span>
                  </div>
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'whiteout' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'whiteout'">
                    <v-icon size="24" class="mb-1">mdi-eraser-variant</v-icon>
                    <span class="text-caption text-capitalize">Whiteout</span>
                  </div>
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'redact' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'redact'">
                    <v-icon size="24" class="mb-1">mdi-eye-off</v-icon>
                    <span class="text-caption text-capitalize">Redact</span>
                  </div>
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'image' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'image'; triggerImageUpload()">
                    <v-icon size="24" class="mb-1">mdi-image</v-icon>
                    <span class="text-caption text-capitalize">Image</span>
                  </div>
                  <input type="file" ref="imageInput" accept="image/png, image/jpeg, image/jpg" style="display: none" @change="handleImageUpload">
                  
                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'table' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'table'; openTableDialog()">
                    <v-icon size="24" class="mb-1">mdi-table</v-icon>
                    <span class="text-caption text-capitalize">Table</span>
                  </div>

                  <div class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                       :class="tool === 'watermark' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                       style="width: 80px; height: 64px"
                       @click="tool = 'watermark'; openWatermarkDialog()">
                    <v-icon size="24" class="mb-1">mdi-watermark</v-icon>
                    <span class="text-caption text-capitalize">Watermark</span>
                  </div>

                  <v-menu location="bottom">
                    <template v-slot:activator="{ props }">
                       <div v-bind="props"
                            class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                            :class="tool === 'draw' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                            style="width: 80px; height: 64px"
                            @click="tool = 'draw'">
                         <v-icon size="24" class="mb-1">mdi-pencil</v-icon>
                         <span class="text-caption text-capitalize">Draw</span>
                       </div>
                    </template>
                    <v-list density="compact">
                       <v-list-item @click="setDrawTool('pencil')" :active="drawType === 'pencil'">
                          <template v-slot:prepend><v-icon>mdi-pencil</v-icon></template>
                          <v-list-item-title>Pencil</v-list-item-title>
                       </v-list-item>
                       <v-list-item @click="setDrawTool('line')" :active="drawType === 'line'">
                          <template v-slot:prepend><v-icon>mdi-minus</v-icon></template>
                          <v-list-item-title>Line</v-list-item-title>
                       </v-list-item>
                       <v-list-item @click="setDrawTool('arrow')" :active="drawType === 'arrow'">
                          <template v-slot:prepend><v-icon>mdi-arrow-right</v-icon></template>
                          <v-list-item-title>Arrow</v-list-item-title>
                       </v-list-item>
                       <v-list-item @click="setDrawTool('polygon')" :active="drawType === 'polygon'">
                          <template v-slot:prepend><v-icon>mdi-vector-polygon</v-icon></template>
                          <v-list-item-title>Polygon</v-list-item-title>
                       </v-list-item>
                    </v-list>
                  </v-menu>

                  <v-menu location="bottom">
                    <template v-slot:activator="{ props }">
                       <div v-bind="props"
                            class="d-flex flex-column align-center justify-center py-2 rounded mx-1 cursor-pointer tool-item"
                            :class="tool === 'shape' ? 'bg-blue-lighten-5 text-primary' : 'text-grey-darken-2'"
                            style="width: 80px; height: 64px"
                            @click="tool = 'shape'">
                         <v-icon size="24" class="mb-1">mdi-shape</v-icon>
                         <span class="text-caption text-capitalize">Shape</span>
                       </div>
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
                </div>
                
                <v-spacer></v-spacer>

                <!-- Page Navigation -->
                <div class="d-flex align-center mx-2 text-grey-darken-1">
                    <v-btn icon size="small" variant="text" @click="prevPage" :disabled="pageNum <= 1">
                      <v-icon>mdi-chevron-left</v-icon>
                    </v-btn>
                    <span class="mx-2 text-caption font-weight-medium">Page {{ pageNum }} / {{ numPages }}</span>
                    <v-btn icon size="small" variant="text" @click="nextPage" :disabled="pageNum >= numPages">
                      <v-icon>mdi-chevron-right</v-icon>
                    </v-btn>
                </div>

                <v-divider vertical class="mx-2 my-4"></v-divider>

                <!-- History Controls -->
                <v-btn icon size="small" variant="text" @click="undo" :disabled="historyIndex <= 0" title="Undo">
                  <v-icon>mdi-undo</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" @click="redo" :disabled="historyIndex >= history.length - 1" title="Redo">
                  <v-icon>mdi-redo</v-icon>
                </v-btn>
                
                <v-divider vertical class="mx-2 my-4"></v-divider>

                <template v-if="['sign', 'text', 'whiteout', 'shape', 'highlight', 'strikeout', 'underline', 'redact', 'watermark'].includes(tool)">
                  <v-btn color="error" variant="text" size="small" @click="resetCurrentPage" class="mr-2" icon title="Reset Page">
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>
                  <v-btn color="success" variant="flat" @click="saveSignature" prepend-icon="mdi-download" class="text-none">
                    Download
                  </v-btn>
                </template>
              </v-toolbar>

              <!-- Canvas Scroll Area -->
              <div class="d-flex justify-center flex-grow-1 overflow-auto bg-grey-lighten-4 py-8">
                  <!-- Canvas Container -->
                  <div class="canvas-wrapper bg-white border-black" ref="canvasWrapper"
                       :class="{ 'cursor-crosshair': isPlacingTable }"
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
        
        <!-- Highlight Layer -->
        <div class="highlight-layer" :class="{ 'pointer-events-none': tool !== 'highlight' }">
           <div v-for="h in (highlights[pageNum] || [])" :key="h.id"
                class="highlight-element"
                :style="{ 
                  left: h.x + 'px', 
                  top: h.y + 'px', 
                  width: h.width + 'px', 
                  height: h.height + 'px' 
                }">
             <v-icon v-if="tool === 'highlight'" 
                     icon="mdi-close-circle" 
                     color="error" 
                     size="x-small" 
                     class="delete-btn-highlight"
                     @click.stop="deleteHighlight(h)"
             ></v-icon>
           </div>
           
           <!-- Current drawing highlight -->
           <div v-if="isDrawingHighlight"
                class="highlight-element drawing"
                :style="{
                  left: currentHighlight.x + 'px',
                  top: currentHighlight.y + 'px',
                  width: currentHighlight.width + 'px',
                  height: currentHighlight.height + 'px'
                }">
           </div>
        </div>

        <!-- Strikeout Layer -->
        <div class="strikeout-layer" :class="{ 'pointer-events-none': tool !== 'strikeout' }">
           <div v-for="s in (strikeouts[pageNum] || [])" :key="s.id"
                class="strikeout-element"
                :style="{ 
                  left: s.x + 'px', 
                  top: s.y + 'px', 
                  width: s.width + 'px', 
                  height: s.height + 'px' 
                }">
             <div class="strikeout-line"></div>
             <v-icon v-if="tool === 'strikeout'" 
                     icon="mdi-close-circle" 
                     color="error" 
                     size="x-small" 
                     class="delete-btn-strikeout"
                     @click.stop="deleteStrikeout(s)"
             ></v-icon>
           </div>
           
           <!-- Current drawing strikeout -->
           <div v-if="isDrawingStrikeout"
                class="strikeout-element drawing"
                :style="{
                  left: currentStrikeout.x + 'px',
                  top: currentStrikeout.y + 'px',
                  width: currentStrikeout.width + 'px',
                  height: currentStrikeout.height + 'px'
                }">
                <div class="strikeout-line"></div>
           </div>
        </div>

        <!-- Underline Layer -->
        <div class="underline-layer" :class="{ 'pointer-events-none': tool !== 'underline' }">
           <div v-for="u in (underlines[pageNum] || [])" :key="u.id"
                class="underline-element"
                :style="{ 
                  left: u.x + 'px', 
                  top: u.y + 'px', 
                  width: u.width + 'px', 
                  height: u.height + 'px' 
                }">
             <div class="underline-line"></div>
             <v-icon v-if="tool === 'underline'" 
                     icon="mdi-close-circle" 
                     color="error" 
                     size="x-small" 
                     class="delete-btn-underline"
                     @click.stop="deleteUnderline(u)"
             ></v-icon>
           </div>
           
           <!-- Current drawing underline -->
           <div v-if="isDrawingUnderline"
                class="underline-element drawing"
                :style="{
                  left: currentUnderline.x + 'px',
                  top: currentUnderline.y + 'px',
                  width: currentUnderline.width + 'px',
                  height: currentUnderline.height + 'px'
                }">
                <div class="underline-line"></div>
           </div>
        </div>

        <!-- Watermark Layer -->
        <div class="watermark-layer" v-if="watermark">
            <div class="watermark-element" :style="{
                opacity: watermark.opacity,
                transform: `translate(-50%, -50%) rotate(${watermark.rotation}deg)`,
                fontSize: watermark.size + 'px',
                color: watermark.color
            }">
                {{ watermark.text }}
            </div>
        </div>

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

        <!-- Redact Layer -->
        <div class="redact-layer" :class="{ 'pointer-events-none': tool !== 'redact' }">
           <div v-for="r in (redacts[pageNum] || [])" :key="r.id"
                class="redact-element"
                :style="{ 
                  left: r.x + 'px', 
                  top: r.y + 'px', 
                  width: r.width + 'px', 
                  height: r.height + 'px' 
                }">
             <v-icon v-if="tool === 'redact'" 
                     icon="mdi-close-circle" 
                     color="error" 
                     size="x-small" 
                     class="delete-btn-redact"
                     @click.stop="deleteRedact(r)"
             ></v-icon>
           </div>
           
           <!-- Current drawing redact -->
           <div v-if="isDrawingRedact"
                class="redact-element drawing"
                :style="{
                  left: currentRedact.x + 'px',
                  top: currentRedact.y + 'px',
                  width: currentRedact.width + 'px',
                  height: currentRedact.height + 'px'
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

        <!-- Tables Layer -->
        <div class="table-layer" :class="{ 'pointer-events-none': tool !== 'table' }">
          <div v-for="tbl in (tables[pageNum] || [])" :key="tbl.id"
               class="table-element"
               :class="{ 'is-selected': selectedTableId === tbl.id }"
               :style="{ 
                 left: tbl.x + 'px', 
                 top: tbl.y + 'px', 
                 width: tbl.width + 'px', 
                 height: tbl.height + 'px'
               }"
               @mousedown.stop="startDragTable($event, tbl)"
               @click.stop="selectedTableId = tbl.id">
               
               <table style="width: 100%; height: 100%; border-collapse: collapse; table-layout: fixed;">
                 <tr v-for="(row, rIndex) in tbl.rows" :key="rIndex">
                   <td v-for="(col, cIndex) in tbl.cols" :key="cIndex" 
                       style="border: 1px solid black; padding: 0;">
                       <input v-model="tbl.cellData[rIndex][cIndex]" 
                              style="width: 100%; height: 100%; border: none; padding: 4px; background: transparent; outline: none;"
                              @mousedown.stop="selectedTableId = tbl.id"
                              @focus="selectedTableId = tbl.id"
                              @blur="pushToHistory"
                       />
                   </td>
                 </tr>
               </table>

               <div v-if="selectedTableId === tbl.id" class="table-controls">
                 <!-- Move Handle -->
                 <div class="move-handle-table" @mousedown.stop="startDragTable($event, tbl)">
                     <v-icon icon="mdi-drag" size="small" color="white"></v-icon>
                 </div>
                 
                 <div class="resize-handle" @mousedown.stop="startResizeTable($event, tbl)"></div>
                 <v-icon icon="mdi-close-circle" color="error" class="delete-btn-table" @click.stop="deleteTable(tbl)"></v-icon>
               </div>
          </div>
        </div>

        <!-- Images Layer -->
        <div class="image-layer">
          <div v-for="img in (images[pageNum] || [])" :key="img.id"
               class="image-element"
               :style="{ 
                 left: img.x + 'px', 
                 top: img.y + 'px', 
                 width: img.width + 'px', 
                 height: img.height + 'px'
               }"
               @mousedown.stop="startDragImage($event, img)">
               <img :src="img.dataUrl" style="width: 100%; height: 100%; object-fit: contain;" />
               <div v-if="selectedImageId === img.id" class="image-controls">
                 <div class="resize-handle" @mousedown.stop="startResizeImage($event, img)"></div>
                 <v-icon icon="mdi-close-circle" color="error" class="delete-btn-image" @click.stop="deleteImageObject(img)"></v-icon>
               </div>
          </div>
        </div>

        <!-- Drawings Layer (SVG) -->
        <svg class="drawing-layer" :style="{ width: viewportSize.width + 'px', height: viewportSize.height + 'px' }" :class="{ 'pointer-events-none': tool !== 'draw' }">
           <defs>
             <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
               <polygon points="0 0, 10 3.5, 0 7" fill="black" />
             </marker>
           </defs>
           
           <g v-for="d in (drawings[pageNum] || [])" :key="d.id" class="drawing-element" @click.stop="selectDrawing(d)">
              <template v-if="d.type === 'pencil'">
                 <path :d="d.path" :stroke="d.color" :stroke-width="d.strokeWidth" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              </template>
              <template v-else-if="d.type === 'line'">
                 <line :x1="d.x1" :y1="d.y1" :x2="d.x2" :y2="d.y2" :stroke="d.color" :stroke-width="d.strokeWidth" />
              </template>
              <template v-else-if="d.type === 'arrow'">
                 <line :x1="d.x1" :y1="d.y1" :x2="d.x2" :y2="d.y2" :stroke="d.color" :stroke-width="d.strokeWidth" marker-end="url(#arrowhead)" />
              </template>
              <template v-else-if="d.type === 'polygon'">
                 <polygon :points="d.points" :stroke="d.color" :stroke-width="d.strokeWidth" fill="none" />
              </template>
              
              <!-- Selection Highlight (if implemented) -->
              <template v-if="selectedDrawingId === d.id">
                 <!-- Simple highlight for pencil/polygon is harder, maybe bounding box? For line/arrow just stroke? -->
              </template>
           </g>
           
           <!-- Current Drawing Preview -->
           <g v-if="isDrawingDraw">
              <template v-if="drawType === 'pencil'">
                 <path :d="currentDrawingPath" stroke="black" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              </template>
              <template v-else-if="drawType === 'line'">
                 <line :x1="drawStart.x" :y1="drawStart.y" :x2="currentMousePos.x" :y2="currentMousePos.y" stroke="black" stroke-width="2" />
              </template>
              <template v-else-if="drawType === 'arrow'">
                 <line :x1="drawStart.x" :y1="drawStart.y" :x2="currentMousePos.x" :y2="currentMousePos.y" stroke="black" stroke-width="2" marker-end="url(#arrowhead)" />
              </template>
              <template v-else-if="drawType === 'polygon'">
                 <polyline :points="currentPolygonString" stroke="black" stroke-width="2" fill="none" />
                 <!-- Line to cursor -->
                 <line v-if="polygonPoints.length > 0" :x1="polygonPoints[polygonPoints.length-1].x" :y1="polygonPoints[polygonPoints.length-1].y" :x2="currentMousePos.x" :y2="currentMousePos.y" stroke="black" stroke-width="1" stroke-dasharray="4" />
              </template>
           </g>
        </svg>
        
        <!-- Delete button for selected drawing (HTML overlay) -->
        <div v-if="selectedDrawingId" class="drawing-controls" :style="{ left: selectedDrawingPos.x + 'px', top: selectedDrawingPos.y + 'px' }">
             <v-icon icon="mdi-close-circle" color="error" class="delete-btn-drawing" @click.stop="deleteSelectedDrawing"></v-icon>
        </div>

        <!-- Signatures Layer -->
        <div class="signature-layer">
          <div v-for="sig in (signatureObjects[pageNum] || [])" :key="sig.id"
               class="signature-element"
               :style="{ 
                 left: sig.x + 'px', 
                 top: sig.y + 'px', 
                 width: sig.width + 'px', 
                 height: sig.height + 'px'
               }"
               @mousedown.stop="startDragSignature($event, sig)">
               <img :src="sig.dataUrl" style="width: 100%; height: 100%; object-fit: contain;" />
               <div v-if="selectedSignatureId === sig.id" class="signature-controls">
                 <div class="resize-handle" @mousedown.stop="startResizeSignature($event, sig)"></div>
                 <v-icon icon="mdi-close-circle" color="error" class="delete-btn-signature" @click.stop="deleteSignatureObject(sig)"></v-icon>
               </div>
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
    </div>
    </div>
  </div>
</div>

  <v-dialog v-model="showWatermarkDialog" max-width="400">
      <v-card>
          <v-card-title class="text-h5">Add Watermark</v-card-title>
          <v-card-text>
              <v-text-field v-model="watermarkConfig.text" label="Watermark Text"></v-text-field>
              <v-slider v-model="watermarkConfig.opacity" label="Opacity" min="0" max="1" step="0.1" thumb-label></v-slider>
              <v-slider v-model="watermarkConfig.rotation" label="Rotation" min="-180" max="180" step="15" thumb-label></v-slider>
              <v-slider v-model="watermarkConfig.size" label="Font Size" min="10" max="200" step="5" thumb-label></v-slider>
              <v-color-picker v-model="watermarkConfig.color" mode="hex" hide-inputs hide-canvas class="mb-2"></v-color-picker>
          </v-card-text>
          <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="grey-darken-1" variant="text" @click="showWatermarkDialog = false">Cancel</v-btn>
              <v-btn color="error" variant="text" @click="removeWatermark">Remove</v-btn>
              <v-btn color="primary" @click="applyWatermark">Apply</v-btn>
          </v-card-actions>
      </v-card>
  </v-dialog>

  <v-dialog v-model="showTableDialog" max-width="340">
      <v-card class="rounded-lg elevation-4">
        <v-card-title class="text-subtitle-1 font-weight-bold pt-4 px-4">Insert Table</v-card-title>
        <v-card-text class="px-4 py-2">
          <div class="d-flex flex-column align-center">
             <!-- Grid Selector -->
             <div class="d-flex justify-space-between w-100 mb-2 align-center">
                <span class="text-caption text-grey-darken-1">Size: {{ tableConfig.rows }} x {{ tableConfig.cols }}</span>
             </div>
             
             <div class="table-grid-selector mb-4" @mouseleave="resetGridHover">
                 <div v-for="r in 10" :key="r" class="d-flex">
                     <div v-for="c in 10" :key="c" 
                          class="grid-cell"
                          :class="{ 'active': r <= tableConfig.rows && c <= tableConfig.cols }"
                          @mouseover="hoverGrid(r, c)"
                          @click="confirmTableSize">
                     </div>
                 </div>
             </div>

             <!-- Manual Input Fallback -->
             <div class="d-flex align-center w-100 gap-2">
                 <v-text-field v-model.number="tableConfig.rows" label="Rows" type="number" min="1" max="20" density="compact" variant="outlined" hide-details class="mr-2"></v-text-field>
                 <span class="text-h6 text-grey-lighten-1">×</span>
                 <v-text-field v-model.number="tableConfig.cols" label="Cols" type="number" min="1" max="20" density="compact" variant="outlined" hide-details class="ml-2"></v-text-field>
             </div>
          </div>
        </v-card-text>
        <v-card-actions class="px-4 pb-4 pt-2">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showTableDialog = false" class="text-none">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmTableSize" class="text-none px-6">Place Table</v-btn>
        </v-card-actions>
      </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, rgb, StandardFonts, pushGraphicsState, popGraphicsState, translate, rotate, degrees } from 'pdf-lib'

// Set worker source
// Note: In a production environment, you might want to bundle the worker.
// Using CDN for simplicity in this setup.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ) : rgb(0, 0, 0);
}

const store = useStore()
const router = useRouter()
const route = useRoute()
const file = computed(() => store.getters.getFile)

const pdfDoc = ref(null)
const pageNum = ref(1)
const numPages = ref(0)
const scale = ref(1.5) // Adjusted scale
const pdfCanvas = ref(null)
const signCanvas = ref(null)
const imageInput = ref(null)
const canvasWrapper = ref(null)
const tool = ref('view')
const tables = ref({}) // Store tables per page: { pageNum: [{ id, x, y, rows, cols, cellData, width, height }] }
const showTableDialog = ref(false)
const tableConfig = ref({ rows: 3, cols: 3 })
const selectedTableId = ref(null)
const draggingTableId = ref(null)
const resizingTableId = ref(null)
const initialTableState = ref(null)

const isPlacingTable = ref(false)
const draggedFormElement = ref(null)

const isFormMode = ref(false)

const formElements = [
    { label: 'Signature', icon: 'mdi-draw', name: 'signature' },
    { label: 'Text', icon: 'mdi-format-text', name: 'text' },
    { label: 'Date', icon: 'mdi-calendar', name: 'date' },
    { label: 'Initials', icon: 'mdi-signature-text', name: 'initials' },
    { label: 'Name', icon: 'mdi-account-box-outline', name: 'name' },
    { label: 'Email', icon: 'mdi-email-outline', name: 'email' },
    { label: 'Checkbox', icon: 'mdi-checkbox-marked-outline', name: 'checkbox' },
    { label: 'Radio button', icon: 'mdi-radiobox-marked', name: 'radio' },
    { label: 'Image', icon: 'mdi-image-outline', name: 'image' },
    { label: 'Dropdown', icon: 'mdi-form-dropdown', name: 'dropdown' },
    { label: 'Number', icon: 'mdi-pound', name: 'number' },
    { label: 'Formula', icon: 'mdi-function-variant', name: 'formula' },
    { label: 'USD', icon: 'mdi-currency-usd', name: 'usd' },
    { label: 'EUR', icon: 'mdi-currency-eur', name: 'eur' },
    { label: 'Title', icon: 'mdi-account-tie', name: 'title' },
    { label: 'Company', icon: 'mdi-domain', name: 'company' },
    { label: 'ZIP code', icon: 'mdi-mailbox', name: 'zip' },
    { label: 'US phone number', icon: 'mdi-cellphone', name: 'phone' },
    { label: 'EIN', icon: 'mdi-card-account-details', name: 'ein' },
    { label: 'SSN', icon: 'mdi-bank', name: 'ssn' },
    { label: 'Age', icon: 'mdi-cake-variant', name: 'age' },
    { label: 'Gender', icon: 'mdi-gender-male-female', name: 'gender' },
    { label: 'US states', icon: 'mdi-flag', name: 'states' },
]

const startDragFormElement = (e, item) => {
    draggedFormElement.value = item
    // Prevent default drag ghost if we want custom behavior, or let it be
    // e.preventDefault() // If we prevent default, we need to handle drag manually via mousemove
    // For now let's use simple logic: set state, then on mouseup on canvas check state
    
    window.addEventListener('mouseup', handleFormElementDrop)
}

const handleFormElementDrop = (e) => {
    window.removeEventListener('mouseup', handleFormElementDrop)
    if (!draggedFormElement.value) return
    
    // Check if drop is within canvas
    const rect = canvasWrapper.value.getBoundingClientRect()
    if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
    ) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        addFormElementAt(draggedFormElement.value, x, y)
    }
    
    draggedFormElement.value = null
}

const addFormElementAt = (item, x, y) => {
    if (item.name === 'signature') {
        // Add signature field placeholder
        const width = 150
        const height = 60
        const newSig = {
            id: Date.now(),
            x: x - width/2,
            y: y - height/2,
            width: width,
            height: height,
            dataUrl: '', // Empty initially
            isPlaceholder: true // Mark as form field
        }
        if (!signatureObjects.value[pageNum.value]) signatureObjects.value[pageNum.value] = []
        signatureObjects.value[pageNum.value].push(newSig)
        pushToHistory()
    } else if (item.name === 'text' || item.name === 'name' || item.name === 'email' || item.name === 'date' || item.name === 'initials') {
        // Add text field
        const newText = {
            id: Date.now(),
            x: x,
            y: y,
            text: item.label, // Default text
            fontSize: 16,
            color: '#000000',
            fontFamily: 'Helvetica',
            isBold: false,
            isItalic: false,
            isFormField: true // Mark as form field
        }
        if (!texts.value[pageNum.value]) texts.value[pageNum.value] = []
        texts.value[pageNum.value].push(newText)
        editingTextId.value = newText.id
    } else if (item.name === 'checkbox') {
        const newShape = {
            id: Date.now(),
            x: x - 10,
            y: y - 10,
            width: 20,
            height: 20,
            type: 'checkbox'
        }
        if (!shapes.value[pageNum.value]) shapes.value[pageNum.value] = []
        shapes.value[pageNum.value].push(newShape)
        pushToHistory()
    } else if (item.name === 'radio') {
        const newShape = {
            id: Date.now(),
            x: x - 10,
            y: y - 10,
            width: 20,
            height: 20,
            type: 'radio'
        }
        if (!shapes.value[pageNum.value]) shapes.value[pageNum.value] = []
        shapes.value[pageNum.value].push(newShape)
        pushToHistory()
    } else {
        // Default text for others
        const newText = {
            id: Date.now(),
            x: x,
            y: y,
            text: item.label,
            fontSize: 16,
            color: '#000000',
            fontFamily: 'Helvetica',
            isBold: false,
            isItalic: false,
            isFormField: true
        }
        if (!texts.value[pageNum.value]) texts.value[pageNum.value] = []
        texts.value[pageNum.value].push(newText)
        editingTextId.value = newText.id
    }
}

const addFormElement = (item) => {
    // Logic for adding form element on click (e.g. center of screen or next available position)
    // For now, we can just start drag or place at center.
    // Let's place at center of current viewport.
    const viewport = viewportSize.value
    const x = (viewport.width / 2) - 50
    const y = (viewport.height / 2) - 15
    addFormElementAt(item, Math.max(0, x), Math.max(0, y))
}

const openTableDialog = () => {
    showTableDialog.value = true
}

const hoverGrid = (r, c) => {
    tableConfig.value.rows = r
    tableConfig.value.cols = c
}

const resetGridHover = () => {
    // Optional: reset to default
}

const confirmTableSize = () => {
    showTableDialog.value = false
    isPlacingTable.value = true
}

const createTableAt = (x, y) => {
    const rows = Math.max(1, tableConfig.value.rows)
    const cols = Math.max(1, tableConfig.value.cols)
    
    const width = Math.min(500, cols * 100)
    const height = rows * 40
    
    // Initialize cell data
    const cellData = Array(rows).fill().map(() => Array(cols).fill(''))
    
    const newTable = {
        id: Date.now(),
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: width,
        height: height,
        rows: rows,
        cols: cols,
        cellData: cellData
    }
    
    if (!tables.value[pageNum.value]) {
        tables.value[pageNum.value] = []
    }
    // Use spread for reactivity
    tables.value[pageNum.value] = [...tables.value[pageNum.value], newTable]
    
    // Select the new table
    selectedTableId.value = newTable.id
    
    pushToHistory()
}

const startDragTable = (e, table) => {
    if (tool.value !== 'table') return
    
    // If clicking on an input, don't drag
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return

    selectedTableId.value = table.id
    draggingTableId.value = table.id
    
    const rect = canvasWrapper.value.getBoundingClientRect()
    dragOffset.value = {
        x: e.clientX - rect.left - table.x,
        y: e.clientY - rect.top - table.y
    }
    
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
}

const startResizeTable = (e, table) => {
    if (tool.value !== 'table') return
    
    resizingTableId.value = table.id
    initialTableState.value = { ...table }
    startMousePos.value = { x: e.clientX, y: e.clientY }
    
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
}

const deleteTable = (table) => {
    const idx = tables.value[pageNum.value].indexOf(table)
    if (idx > -1) {
        tables.value[pageNum.value].splice(idx, 1)
        pushToHistory()
    }
}

const signatures = ref({}) // Store full page signatures per page: { pageNum: dataUrl }
const signatureObjects = ref({}) // Store individual signature objects per page: { pageNum: [{ id, x, y, width, height, dataUrl }] }
const images = ref({}) // Store images per page: { pageNum: [{ id, x, y, width, height, dataUrl }] }
const drawings = ref({}) // Store drawings per page: { pageNum: [{ id, type, x1, y1, x2, y2, path, points, color, strokeWidth }] }
const texts = ref({}) // Store texts per page: { pageNum: [{ id, x, y, text, fontSize, color }] }
const whiteouts = ref({}) // Store whiteouts per page: { pageNum: [{ id, x, y, width, height }] }
const redacts = ref({}) // Store redacts per page: { pageNum: [{ id, x, y, width, height }] }
const highlights = ref({}) // Store highlights per page: { pageNum: [{ id, x, y, width, height }] }
const strikeouts = ref({}) // Store strikeouts per page: { pageNum: [{ id, x, y, width, height }] }
const underlines = ref({}) // Store underlines per page: { pageNum: [{ id, x, y, width, height }] }
const shapes = ref({}) // Store shapes per page: { pageNum: [{ id, x, y, type }] }
const viewportSize = ref({ width: 0, height: 0 })
const editingTextId = ref(null)
const draggingTextId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

const isDrawing = ref(false)
const isDrawingWhiteout = ref(false)
const isDrawingRedact = ref(false)
const isDrawingHighlight = ref(false)
const isDrawingStrikeout = ref(false)
const isDrawingUnderline = ref(false)
const isDrawingDraw = ref(false)
const drawType = ref('pencil') // pencil, line, arrow, polygon
const drawStart = ref({ x: 0, y: 0 })
const currentMousePos = ref({ x: 0, y: 0 })
const polygonPoints = ref([]) // Array of {x, y}
const pencilPoints = ref([]) // Array of {x, y}
const selectedDrawingId = ref(null)
const selectedDrawingPos = ref({ x: 0, y: 0 })

const currentDrawingPath = computed(() => {
    if (drawType.value === 'pencil' && pencilPoints.value.length > 0) {
        return `M ${pencilPoints.value.map(p => `${p.x} ${p.y}`).join(' L ')}`
    }
    return ''
})

const currentPolygonString = computed(() => {
    return polygonPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

const shapeType = ref('checkbox') // checkbox, radio, check, cross, circle
const currentWhiteout = ref({ x: 0, y: 0, width: 0, height: 0 })
const currentRedact = ref({ x: 0, y: 0, width: 0, height: 0 })
const currentHighlight = ref({ x: 0, y: 0, width: 0, height: 0 })
const currentStrikeout = ref({ x: 0, y: 0, width: 0, height: 0 })
const currentUnderline = ref({ x: 0, y: 0, width: 0, height: 0 })

const showSignatureModal = ref(false)
const showWatermarkDialog = ref(false)
const signaturePad = ref(null)

const watermarkConfig = ref({
    text: 'CONFIDENTIAL',
    opacity: 0.3,
    rotation: -45,
    size: 60,
    color: '#000000'
})
const watermark = ref(null) // { text, opacity, rotation, size, color }

const openWatermarkDialog = () => {
    if (watermark.value) {
        watermarkConfig.value = { ...watermark.value }
    }
    showWatermarkDialog.value = true
}

const applyWatermark = () => {
    watermark.value = { ...watermarkConfig.value }
    showWatermarkDialog.value = false
    pushToHistory()
}

const removeWatermark = () => {
    watermark.value = null
    showWatermarkDialog.value = false
    pushToHistory()
}
const selectedSignatureId = ref(null)
const draggingSignatureId = ref(null)
const resizingSignatureId = ref(null)
const selectedImageId = ref(null)
const draggingImageId = ref(null)
const resizingImageId = ref(null)
const initialImageState = ref(null)
const initialSignatureState = ref(null)
const isDrawingSignature = ref(false)

// History State
const history = ref([])
const historyIndex = ref(-1)
const isHistoryAction = ref(false)

// Shape Resizing/Moving State
const selectedShapeId = ref(null)
const resizingShapeId = ref(null)
const draggingShapeId = ref(null)
const initialShapeState = ref(null) // { x, y, width, height }
const startMousePos = ref({ x: 0, y: 0 })

const whiteoutStart = ref({ x: 0, y: 0 })
const redactStart = ref({ x: 0, y: 0 })
const highlightStart = ref({ x: 0, y: 0 })
const strikeoutStart = ref({ x: 0, y: 0 })
const underlineStart = ref({ x: 0, y: 0 })
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
    // Initial history push
    pushToHistory()

    // Check for query parameters to open specific tools
    if (route.query.tool === 'watermark') {
        tool.value = 'watermark'
        showWatermarkDialog.value = true
    }
  } catch (error) {
    console.error('Error loading PDF:', error)
    alert('Failed to load PDF file.')
  }
})

// Initialize history
const pushToHistory = () => {
    if (isHistoryAction.value) return

    // Deep clone current state
    const state = {
        signatures: JSON.parse(JSON.stringify(signatures.value)),
        signatureObjects: JSON.parse(JSON.stringify(signatureObjects.value)),
        images: JSON.parse(JSON.stringify(images.value)),
        drawings: JSON.parse(JSON.stringify(drawings.value)),
        texts: JSON.parse(JSON.stringify(texts.value)),
        whiteouts: JSON.parse(JSON.stringify(whiteouts.value)),
        redacts: JSON.parse(JSON.stringify(redacts.value)),
        shapes: JSON.parse(JSON.stringify(shapes.value)),
        tables: JSON.parse(JSON.stringify(tables.value)),
        highlights: JSON.parse(JSON.stringify(highlights.value)),
        strikeouts: JSON.parse(JSON.stringify(strikeouts.value)),
        underlines: JSON.parse(JSON.stringify(underlines.value)),
        watermark: watermark.value ? JSON.parse(JSON.stringify(watermark.value)) : null
    }

    // Remove future history if we pushed a new action while in the middle of history
    if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(state)
    historyIndex.value++
    
    // Limit history size
    if (history.value.length > 50) {
        history.value.shift()
        historyIndex.value--
    }
}

const undo = () => {
    if (historyIndex.value > 0) {
        isHistoryAction.value = true
        historyIndex.value--
        restoreState(history.value[historyIndex.value])
        
        // Re-render current page to update canvas (signatures)
        renderPage(pageNum.value)
        
        // Use nextTick to allow DOM updates then reset flag
        setTimeout(() => { isHistoryAction.value = false }, 50)
    }
}

const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
        isHistoryAction.value = true
        historyIndex.value++
        restoreState(history.value[historyIndex.value])
        
        // Re-render current page
        renderPage(pageNum.value)
        
        setTimeout(() => { isHistoryAction.value = false }, 50)
    }
}

const restoreState = (state) => {
    signatures.value = JSON.parse(JSON.stringify(state.signatures))
    signatureObjects.value = JSON.parse(JSON.stringify(state.signatureObjects || {}))
    images.value = JSON.parse(JSON.stringify(state.images || {}))
    drawings.value = JSON.parse(JSON.stringify(state.drawings || {}))
    texts.value = JSON.parse(JSON.stringify(state.texts))
    whiteouts.value = JSON.parse(JSON.stringify(state.whiteouts))
    redacts.value = JSON.parse(JSON.stringify(state.redacts || {}))
    shapes.value = JSON.parse(JSON.stringify(state.shapes))
    tables.value = JSON.parse(JSON.stringify(state.tables || {}))
    highlights.value = JSON.parse(JSON.stringify(state.highlights))
    strikeouts.value = JSON.parse(JSON.stringify(state.strikeouts || {})) // Handle old history without strikeouts
    underlines.value = JSON.parse(JSON.stringify(state.underlines || {})) // Handle old history without underlines
    watermark.value = state.watermark ? JSON.parse(JSON.stringify(state.watermark)) : null
}

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
    const dataUrl = signCanvas.value.toDataURL('image/png')
    // Only save if changed or not empty (optimization: check if canvas is blank?)
    // For now, simple save. 
    // We should only push history if it actually changed.
    // But since this is called on page navigation, it's tricky.
    // Better to hook into mouseup of drawing.
    signatures.value[pageNum.value] = dataUrl
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
  if (isDrawing.value) {
      isDrawing.value = false
      saveCurrentSignature() // Save to state
      pushToHistory() // Push state to history
  }
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
  } else if (tool.value === 'redact') {
      const rect = canvasWrapper.value.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      isDrawingRedact.value = true
      redactStart.value = { x, y }
      currentRedact.value = { x, y, width: 0, height: 0 }
      
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
  } else if (tool.value === 'highlight') {
      const rect = canvasWrapper.value.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      isDrawingHighlight.value = true
      highlightStart.value = { x, y }
      currentHighlight.value = { x, y, width: 0, height: 0 }
      
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
  } else if (tool.value === 'strikeout') {
      const rect = canvasWrapper.value.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      isDrawingStrikeout.value = true
      strikeoutStart.value = { x, y }
      currentStrikeout.value = { x, y, width: 0, height: 0 }
      
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
  } else if (tool.value === 'underline') {
      const rect = canvasWrapper.value.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      isDrawingUnderline.value = true
      underlineStart.value = { x, y }
      currentUnderline.value = { x, y, width: 0, height: 0 }
      
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
  } else if (tool.value === 'draw') {
      const rect = canvasWrapper.value.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      if (drawType.value === 'polygon') {
          // Polygon handled in click
          return
      }
      
      isDrawingDraw.value = true
      drawStart.value = { x, y }
      currentMousePos.value = { x, y }
      
      if (drawType.value === 'pencil') {
          pencilPoints.value = [{ x, y }]
      }
      
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
  }
}

const handleCanvasClick = (e) => {
  if (tool.value === 'whiteout' || tool.value === 'redact' || tool.value === 'highlight' || tool.value === 'strikeout' || tool.value === 'underline') return // Handled by mousedown/up
  if (draggingTextId.value || editingTextId.value || draggingShapeId.value || resizingShapeId.value || draggingSignatureId.value || resizingSignatureId.value || draggingImageId.value || resizingImageId.value || draggingTableId.value || resizingTableId.value) return

  const rect = canvasWrapper.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  if (tool.value === 'draw') {
      // Handle selection deselect if clicked empty space
      if (!selectedDrawingId.value && drawType.value !== 'polygon') {
         // Maybe allow drawing to start on mousedown? Yes.
      } else {
         selectedDrawingId.value = null
      }
      
      if (drawType.value === 'polygon') {
          if (polygonPoints.value.length === 0) {
             window.addEventListener('mousemove', handleWindowMouseMove)
          }
          // Add point
          polygonPoints.value.push({ x, y })
          isDrawingDraw.value = true
          currentMousePos.value = { x, y }
          return
      }
  }

  if (tool.value !== 'text' && tool.value !== 'shape' && tool.value !== 'sign' && tool.value !== 'draw' && tool.value !== 'table') return
  
  if (tool.value === 'sign') {
      // If we are in sign tool, clicking should deselect any selected signature unless we clicked on one
      // The @mousedown.stop on signature elements handles selection.
      // So if we are here, we clicked on empty space.
      selectedSignatureId.value = null
      return
  }

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
      pushToHistory()
      return
  }

  if (tool.value === 'table') {
      if (isPlacingTable.value) {
          const rect = canvasWrapper.value.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          createTableAt(x, y)
          isPlacingTable.value = false
          return
      }
      selectedTableId.value = null
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
  // We don't push to history yet, only when editing finishes
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

const setDrawTool = (type) => {
    drawType.value = type
    tool.value = 'draw'
    selectedDrawingId.value = null
}

const deleteSelectedDrawing = () => {
    if (selectedDrawingId.value) {
        const drawingsList = drawings.value[pageNum.value] || []
        const idx = drawingsList.findIndex(d => d.id === selectedDrawingId.value)
        if (idx > -1) {
            drawingsList.splice(idx, 1)
            selectedDrawingId.value = null
            pushToHistory()
        }
    }
}

const selectDrawing = (drawing) => {
    if (tool.value === 'draw') {
        selectedDrawingId.value = drawing.id
        // Calculate center for delete button
        if (drawing.type === 'pencil' || drawing.type === 'polygon') {
            // Simple center of bounding box
            const points = drawing.points || [] // For polygon and pencil
            if (points.length > 0) {
                const xs = points.map(p => p.x)
                const ys = points.map(p => p.y)
                const maxX = Math.max(...xs)
                const minY = Math.min(...ys)
                selectedDrawingPos.value = { x: maxX, y: minY } // Top right corner
            }
        } else if (drawing.type === 'line' || drawing.type === 'arrow') {
            const maxX = Math.max(drawing.x1, drawing.x2)
            const minY = Math.min(drawing.y1, drawing.y2)
            selectedDrawingPos.value = { x: maxX, y: minY }
        }
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
   } else if (draggingSignatureId.value) {
       const rect = canvasWrapper.value.getBoundingClientRect()
       const sig = signatureObjects.value[pageNum.value].find(s => s.id === draggingSignatureId.value)
       if (sig) {
           let newX = e.clientX - rect.left - dragOffset.value.x
           let newY = e.clientY - rect.top - dragOffset.value.y
           
           const viewport = viewportSize.value
           if (newX < 0) newX = 0
           if (newY < 0) newY = 0
           if (viewport.width && newX > viewport.width - sig.width) newX = viewport.width - sig.width
           if (viewport.height && newY > viewport.height - sig.height) newY = viewport.height - sig.height
           
           sig.x = newX
           sig.y = newY
       }
   } else if (resizingSignatureId.value) {
       const sig = signatureObjects.value[pageNum.value].find(s => s.id === resizingSignatureId.value)
       if (sig && initialSignatureState.value) {
           const mouseX = e.clientX
           const deltaX = mouseX - startMousePos.value.x
           
           // Maintain aspect ratio
           const ratio = initialSignatureState.value.width / initialSignatureState.value.height
           
           const newWidth = Math.max(20, initialSignatureState.value.width + deltaX)
           const newHeight = newWidth / ratio
           
           sig.width = newWidth
           sig.height = newHeight
       }
   } else if (draggingImageId.value) {
       const rect = canvasWrapper.value.getBoundingClientRect()
       const img = images.value[pageNum.value].find(i => i.id === draggingImageId.value)
       if (img) {
           let newX = e.clientX - rect.left - dragOffset.value.x
           let newY = e.clientY - rect.top - dragOffset.value.y
           
           const viewport = viewportSize.value
           if (newX < 0) newX = 0
           if (newY < 0) newY = 0
           if (viewport.width && newX > viewport.width - img.width) newX = viewport.width - img.width
           if (viewport.height && newY > viewport.height - img.height) newY = viewport.height - img.height
           
           img.x = newX
           img.y = newY
       }
   } else if (resizingImageId.value) {
      const img = images.value[pageNum.value].find(i => i.id === resizingImageId.value)
      if (img && initialImageState.value) {
          const mouseX = e.clientX
          const deltaX = mouseX - startMousePos.value.x
          
          // Maintain aspect ratio
          const ratio = initialImageState.value.width / initialImageState.value.height
          
          const newWidth = Math.max(20, initialImageState.value.width + deltaX)
          const newHeight = newWidth / ratio
          
          img.width = newWidth
          img.height = newHeight
      }
  } else if (draggingTableId.value) {
      const rect = canvasWrapper.value.getBoundingClientRect()
      const tbl = tables.value[pageNum.value].find(t => t.id === draggingTableId.value)
      if (tbl) {
          let newX = e.clientX - rect.left - dragOffset.value.x
          let newY = e.clientY - rect.top - dragOffset.value.y
          
          const viewport = viewportSize.value
          if (newX < 0) newX = 0
          if (newY < 0) newY = 0
          if (viewport.width && newX > viewport.width - tbl.width) newX = viewport.width - tbl.width
          if (viewport.height && newY > viewport.height - tbl.height) newY = viewport.height - tbl.height
          
          tbl.x = newX
          tbl.y = newY
      }
  } else if (resizingTableId.value) {
      const tbl = tables.value[pageNum.value].find(t => t.id === resizingTableId.value)
      if (tbl && initialTableState.value) {
          const mouseX = e.clientX
          const mouseY = e.clientY
          
          const deltaX = mouseX - startMousePos.value.x
          const deltaY = mouseY - startMousePos.value.y
          
          const newWidth = Math.max(50, initialTableState.value.width + deltaX)
          const newHeight = Math.max(30, initialTableState.value.height + deltaY)
          
          tbl.width = newWidth
          tbl.height = newHeight
      }
  } else if (isDrawingDraw.value) {
   const rect = canvasWrapper.value.getBoundingClientRect()
   const currentX = e.clientX - rect.left
   const currentY = e.clientY - rect.top
   
   currentMousePos.value = { x: currentX, y: currentY }
   
   if (drawType.value === 'pencil') {
       pencilPoints.value.push({ x: currentX, y: currentY })
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
   } else if (isDrawingRedact.value) {
     const rect = canvasWrapper.value.getBoundingClientRect()
     const currentX = e.clientX - rect.left
     const currentY = e.clientY - rect.top
     
     const width = currentX - redactStart.value.x
     const height = currentY - redactStart.value.y
     
     currentRedact.value = {
         x: width > 0 ? redactStart.value.x : currentX,
         y: height > 0 ? redactStart.value.y : currentY,
         width: Math.abs(width),
         height: Math.abs(height)
     }
   } else if (isDrawingHighlight.value) {
     const rect = canvasWrapper.value.getBoundingClientRect()
     const currentX = e.clientX - rect.left
     const currentY = e.clientY - rect.top
     
     const width = currentX - highlightStart.value.x
     const height = currentY - highlightStart.value.y
     
     currentHighlight.value = {
         x: width > 0 ? highlightStart.value.x : currentX,
         y: height > 0 ? highlightStart.value.y : currentY,
         width: Math.abs(width),
         height: Math.abs(height)
     }
   } else if (isDrawingStrikeout.value) {
     const rect = canvasWrapper.value.getBoundingClientRect()
     const currentX = e.clientX - rect.left
     const currentY = e.clientY - rect.top
     
     const width = currentX - strikeoutStart.value.x
     const height = currentY - strikeoutStart.value.y
     
     currentStrikeout.value = {
         x: width > 0 ? strikeoutStart.value.x : currentX,
         y: height > 0 ? strikeoutStart.value.y : currentY,
         width: Math.abs(width),
         height: Math.abs(height)
     }
   } else if (isDrawingUnderline.value) {
     const rect = canvasWrapper.value.getBoundingClientRect()
     const currentX = e.clientX - rect.left
     const currentY = e.clientY - rect.top
     
     const width = currentX - underlineStart.value.x
     const height = currentY - underlineStart.value.y
     
     currentUnderline.value = {
         x: width > 0 ? underlineStart.value.x : currentX,
         y: height > 0 ? underlineStart.value.y : currentY,
         width: Math.abs(width),
         height: Math.abs(height)
     }
   }
}

const handleWindowMouseUp = () => {
  if (isDrawingWhiteout.value) {
      isDrawingWhiteout.value = false
      if (currentWhiteout.value.width > 5 && currentWhiteout.value.height > 5) {
          if (!whiteouts.value[pageNum.value]) {
              whiteouts.value[pageNum.value] = []
          }
          whiteouts.value[pageNum.value].push({
              id: Date.now(),
              ...currentWhiteout.value
          })
          pushToHistory()
      }
      currentWhiteout.value = { x: 0, y: 0, width: 0, height: 0 }
  } else if (isDrawingDraw.value && drawType.value !== 'polygon') {
      isDrawingDraw.value = false
      // Save drawing
      if (!drawings.value[pageNum.value]) {
          drawings.value[pageNum.value] = []
      }
      
      const newDrawing = {
          id: Date.now(),
          type: drawType.value,
          color: 'black',
          strokeWidth: 2
      }
      
      if (drawType.value === 'pencil') {
          if (pencilPoints.value.length > 1) {
              newDrawing.points = [...pencilPoints.value]
              newDrawing.path = currentDrawingPath.value
              drawings.value[pageNum.value].push(newDrawing)
              pushToHistory()
          }
          pencilPoints.value = []
      } else if (drawType.value === 'line' || drawType.value === 'arrow') {
          if (Math.abs(currentMousePos.value.x - drawStart.value.x) > 2 || Math.abs(currentMousePos.value.y - drawStart.value.y) > 2) {
              newDrawing.x1 = drawStart.value.x
              newDrawing.y1 = drawStart.value.y
              newDrawing.x2 = currentMousePos.value.x
              newDrawing.y2 = currentMousePos.value.y
              drawings.value[pageNum.value].push(newDrawing)
              pushToHistory()
          }
      }
  } else if (isDrawingRedact.value) {
      isDrawingRedact.value = false
      if (currentRedact.value.width > 5 && currentRedact.value.height > 5) {
          if (!redacts.value[pageNum.value]) {
              redacts.value[pageNum.value] = []
          }
          redacts.value[pageNum.value].push({
              id: Date.now(),
              ...currentRedact.value
          })
          pushToHistory()
      }
      currentRedact.value = { x: 0, y: 0, width: 0, height: 0 }
  } else if (isDrawingHighlight.value) {
      isDrawingHighlight.value = false
      if (currentHighlight.value.width > 5 && currentHighlight.value.height > 5) {
          if (!highlights.value[pageNum.value]) {
              highlights.value[pageNum.value] = []
          }
          highlights.value[pageNum.value].push({
              id: Date.now(),
              ...currentHighlight.value
          })
          pushToHistory()
      }
      currentHighlight.value = { x: 0, y: 0, width: 0, height: 0 }
  } else if (isDrawingStrikeout.value) {
      isDrawingStrikeout.value = false
      if (currentStrikeout.value.width > 5) { // Allow thin height, but check width
          if (!strikeouts.value[pageNum.value]) {
              strikeouts.value[pageNum.value] = []
          }
          strikeouts.value[pageNum.value].push({
              id: Date.now(),
              ...currentStrikeout.value
          })
          pushToHistory()
      }
      currentStrikeout.value = { x: 0, y: 0, width: 0, height: 0 }
  } else if (isDrawingUnderline.value) {
      isDrawingUnderline.value = false
      if (currentUnderline.value.width > 5) {
          if (!underlines.value[pageNum.value]) {
              underlines.value[pageNum.value] = []
          }
          underlines.value[pageNum.value].push({
              id: Date.now(),
              ...currentUnderline.value
          })
          pushToHistory()
      }
      currentUnderline.value = { x: 0, y: 0, width: 0, height: 0 }
  } else if (draggingTextId.value || draggingShapeId.value || resizingShapeId.value || draggingSignatureId.value || resizingSignatureId.value || draggingImageId.value || resizingImageId.value) {
      // End of drag/resize
      pushToHistory()
      
      if (draggingTextId.value) {
        draggingTextId.value = null
      } else if (draggingShapeId.value) {
        draggingShapeId.value = null
      } else if (resizingShapeId.value) {
        resizingShapeId.value = null
        initialShapeState.value = null
      } else if (draggingSignatureId.value) {
        draggingSignatureId.value = null
      } else if (resizingSignatureId.value) {
        resizingSignatureId.value = null
        initialSignatureState.value = null
      } else if (draggingImageId.value) {
        draggingImageId.value = null
      } else if (resizingImageId.value) {
      resizingImageId.value = null
      initialImageState.value = null
  } else if (draggingTableId.value) {
      draggingTableId.value = null
  } else if (resizingTableId.value) {
      resizingTableId.value = null
      initialTableState.value = null
  }
  }
  
  window.removeEventListener('mousemove', handleWindowMouseMove)
  window.removeEventListener('mouseup', handleWindowMouseUp)
}

const finishEditing = (text) => {
  const wasEditing = editingTextId.value
  editingTextId.value = null
  if (!text.text || !text.text.trim()) {
     // Remove empty text
     const idx = texts.value[pageNum.value].indexOf(text)
     if (idx > -1) {
         texts.value[pageNum.value].splice(idx, 1)
         pushToHistory()
     }
  } else if (wasEditing) {
      // Text changed
      pushToHistory()
  }
}

const editText = (text) => {
  if (tool.value === 'text') {
    editingTextId.value = text.id
  }
}

const deleteSignatureObject = (sig) => {
    const idx = signatureObjects.value[pageNum.value].indexOf(sig)
    if (idx > -1) {
        signatureObjects.value[pageNum.value].splice(idx, 1)
        pushToHistory()
    }
}

const deleteImageObject = (img) => {
    const idx = images.value[pageNum.value].indexOf(img)
    if (idx > -1) {
        images.value[pageNum.value].splice(idx, 1)
        pushToHistory()
    }
}

const openSignatureModal = () => {
    showSignatureModal.value = true
    // Wait for dialog to open then init pad? 
    // Actually we can init on mousedown or just use native canvas events.
}

const clearSignaturePad = () => {
    const canvas = signaturePad.value
    if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
}

const startSignature = (e) => {
    isDrawingSignature.value = true
    const canvas = signaturePad.value
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const drawSignature = (e) => {
    if (!isDrawingSignature.value) return
    const canvas = signaturePad.value
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
}

const stopSignature = () => {
    isDrawingSignature.value = false
}

const saveSignatureFromModal = () => {
    const canvas = signaturePad.value
    if (canvas) {
        // Trim canvas? For now just save full.
        const dataUrl = canvas.toDataURL('image/png')
        
        // Create signature object in center of screen
        const viewport = viewportSize.value
        const width = 200
        const height = 100
        const x = (viewport.width / 2) - (width / 2)
        const y = (viewport.height / 2) - (height / 2)
        
        const newSig = {
            id: Date.now(),
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: width,
            height: height,
            dataUrl: dataUrl
        }
        
        if (!signatureObjects.value[pageNum.value]) {
            signatureObjects.value[pageNum.value] = []
        }
        signatureObjects.value[pageNum.value].push(newSig)
        pushToHistory()
        
        showSignatureModal.value = false
        clearSignaturePad()
    }
}

const startDragSignature = (e, sig) => {
    if (tool.value !== 'sign') return
    
    selectedSignatureId.value = sig.id
    draggingSignatureId.value = sig.id
    dragOffset.value = {
        x: e.clientX - canvasWrapper.value.getBoundingClientRect().left - sig.x,
        y: e.clientY - canvasWrapper.value.getBoundingClientRect().top - sig.y
    }
    
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
}

const startResizeSignature = (e, sig) => {
    resizingSignatureId.value = sig.id
    initialSignatureState.value = { ...sig }
    startMousePos.value = { x: e.clientX, y: e.clientY }
    
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
}

const triggerImageUpload = () => {
    imageInput.value.click()
}

const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
        const dataUrl = event.target.result
        
        // Get image dimensions to set initial size
        const img = new Image()
        img.onload = () => {
             // Default size or scaled down if too big
             let width = img.width
             let height = img.height
             
             // Max initial size 300px width
             if (width > 300) {
                 const ratio = width / height
                 width = 300
                 height = 300 / ratio
             }
             
             const viewport = viewportSize.value
             const x = (viewport.width / 2) - (width / 2)
             const y = (viewport.height / 2) - (height / 2)
             
             const newImage = {
                 id: Date.now(),
                 x: Math.max(0, x),
                 y: Math.max(0, y),
                 width: width,
                 height: height,
                 dataUrl: dataUrl,
                 fileType: file.type // Store mime type for PDF embedding
             }
             
             if (!images.value[pageNum.value]) {
                 images.value[pageNum.value] = []
             }
             images.value[pageNum.value].push(newImage)
             pushToHistory()
        }
        img.src = dataUrl
    }
    reader.readAsDataURL(file)
    
    // Reset input
    e.target.value = ''
}

const startDragImage = (e, img) => {
    selectedImageId.value = img.id
    draggingImageId.value = img.id
    dragOffset.value = {
        x: e.clientX - canvasWrapper.value.getBoundingClientRect().left - img.x,
        y: e.clientY - canvasWrapper.value.getBoundingClientRect().top - img.y
    }
    
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
}

const startResizeImage = (e, img) => {
    resizingImageId.value = img.id
    initialImageState.value = { ...img }
    startMousePos.value = { x: e.clientX, y: e.clientY }
    
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
}

const deleteText = (text) => {
  const idx = texts.value[pageNum.value].indexOf(text)
  if (idx > -1) {
      texts.value[pageNum.value].splice(idx, 1)
      pushToHistory()
  }
}

const deleteWhiteout = (w) => {
  const idx = whiteouts.value[pageNum.value].indexOf(w)
  if (idx > -1) {
      whiteouts.value[pageNum.value].splice(idx, 1)
      pushToHistory()
  }
}

const deleteRedact = (r) => {
  const idx = redacts.value[pageNum.value].indexOf(r)
  if (idx > -1) {
      redacts.value[pageNum.value].splice(idx, 1)
      pushToHistory()
  }
}

const deleteHighlight = (h) => {
  const idx = highlights.value[pageNum.value].indexOf(h)
  if (idx > -1) {
      highlights.value[pageNum.value].splice(idx, 1)
      pushToHistory()
  }
}

const deleteStrikeout = (s) => {
  const idx = strikeouts.value[pageNum.value].indexOf(s)
  if (idx > -1) {
      strikeouts.value[pageNum.value].splice(idx, 1)
      pushToHistory()
  }
}

const deleteUnderline = (u) => {
  const idx = underlines.value[pageNum.value].indexOf(u)
  if (idx > -1) {
      underlines.value[pageNum.value].splice(idx, 1)
      pushToHistory()
  }
}

const setShapeTool = (type) => {
    shapeType.value = type
    tool.value = 'shape'
}

const deleteShape = (shape) => {
  const idx = shapes.value[pageNum.value].indexOf(shape)
  if (idx > -1) {
      shapes.value[pageNum.value].splice(idx, 1)
      pushToHistory()
  }
}

const toggleBold = (text) => {
  text.isBold = !text.isBold
  pushToHistory()
}

const toggleItalic = (text) => {
  text.isItalic = !text.isItalic
  pushToHistory()
}

const getCssFontFamily = (pdfFontFamily) => {
  switch (pdfFontFamily) {
    case 'Times Roman': return '"Times New Roman", Times, serif'
    case 'Courier': return '"Courier New", Courier, monospace'
    case 'Helvetica': 
    default: return 'Helvetica, Arial, sans-serif'
  }
}

const resetCurrentPage = () => {
    if (!confirm('Are you sure you want to reset edits for this tool on this page?')) return
    
    const current = pageNum.value
    
    if (tool.value === 'sign') {
    if (signatures.value[current]) signatures.value[current] = null
    const canvas = signCanvas.value
    if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    // Also clear signature objects
    if (signatureObjects.value[current]) signatureObjects.value[current] = []
  } else if (tool.value === 'text') {
        if (texts.value[current]) texts.value[current] = []
    } else if (tool.value === 'whiteout') {
        if (whiteouts.value[current]) whiteouts.value[current] = []
    } else if (tool.value === 'redact') {
        if (redacts.value[current]) redacts.value[current] = []
    } else if (tool.value === 'highlight') {
        if (highlights.value[current]) highlights.value[current] = []
    } else if (tool.value === 'strikeout') {
        if (strikeouts.value[current]) strikeouts.value[current] = []
    } else if (tool.value === 'shape') {
        if (shapes.value[current]) shapes.value[current] = []
    } else if (tool.value === 'table') {
        if (tables.value[current]) tables.value[current] = []
    } else if (tool.value === 'watermark') {
        watermark.value = null
    }
    
    pushToHistory()
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

      // 0b. Embed Redactions
      const pageRedacts = redacts.value[pNum]
      if (pageRedacts && pageRedacts.length > 0) {
        for (const r of pageRedacts) {
             const x = r.x / scale.value
             // PDF Y is bottom-up
             const y = height - (r.y / scale.value) - (r.height / scale.value)
             
             page.drawRectangle({
                 x: x,
                 y: y,
                 width: r.width / scale.value,
                 height: r.height / scale.value,
                 color: rgb(0, 0, 0), // Black
                 borderColor: undefined,
                 borderWidth: 0,
             })
        }
      }

      // 1. Embed Signatures (Legacy Canvas)
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

      // 1b. Embed Signature Objects (New Draggable)
      const pageSigs = signatureObjects.value[pNum]
      if (pageSigs && pageSigs.length > 0) {
          for (const sig of pageSigs) {
              const pngImage = await pdfDoc.embedPng(sig.dataUrl)
              const x = sig.x / scale.value
              const y = height - (sig.y / scale.value) - (sig.height / scale.value)
              
              page.drawImage(pngImage, {
                  x: x,
                  y: y,
                  width: sig.width / scale.value,
                  height: sig.height / scale.value
              })
          }
      }

      // 2. Embed Images
      const pageImages = images.value[pNum]
      if (pageImages && pageImages.length > 0) {
          for (const img of pageImages) {
              let embeddedImage
              try {
                  if (img.fileType === 'image/jpeg' || img.fileType === 'image/jpg') {
                      embeddedImage = await pdfDoc.embedJpg(img.dataUrl)
                  } else {
                      // Default to PNG (also handles base64 data URLs often)
                      embeddedImage = await pdfDoc.embedPng(img.dataUrl)
                  }
              } catch (e) {
                  console.warn('Failed to embed image, trying fallback', e)
                  // Fallback: sometimes dataURL type is missing or wrong, try the other
                  try {
                      embeddedImage = await pdfDoc.embedPng(img.dataUrl)
                  } catch (e2) {
                      try {
                          embeddedImage = await pdfDoc.embedJpg(img.dataUrl)
                      } catch (e3) {
                          console.error('Could not embed image', e3)
                          continue
                      }
                  }
              }

              const x = img.x / scale.value
              const y = height - (img.y / scale.value) - (img.height / scale.value)
              
              page.drawImage(embeddedImage, {
                  x: x,
                  y: y,
                  width: img.width / scale.value,
                  height: img.height / scale.value
              })
          }
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

      // 3c. Embed Tables
      const pageTables = tables.value[pNum]
      if (pageTables && pageTables.length > 0) {
          for (const tbl of pageTables) {
              const x = tbl.x / scale.value
              const y = height - (tbl.y / scale.value) - (tbl.height / scale.value)
              const w = tbl.width / scale.value
              const h = tbl.height / scale.value
              
              const rowHeight = h / tbl.rows
              const colWidth = w / tbl.cols
              
              // Draw Grid
              // Vertical lines
              for (let c = 0; c <= tbl.cols; c++) {
                  page.drawLine({
                      start: { x: x + (c * colWidth), y: y },
                      end: { x: x + (c * colWidth), y: y + h },
                      thickness: 1,
                      color: rgb(0, 0, 0),
                  })
              }
              // Horizontal lines
              for (let r = 0; r <= tbl.rows; r++) {
                  page.drawLine({
                      start: { x: x, y: y + (r * rowHeight) },
                      end: { x: x + w, y: y + (r * rowHeight) },
                      thickness: 1,
                      color: rgb(0, 0, 0),
                  })
              }
              
              // Draw Text
              const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
              const fontSize = 10 // Fixed for now
              
              for (let r = 0; r < tbl.rows; r++) {
                  for (let c = 0; c < tbl.cols; c++) {
                      const text = tbl.cellData[r][c]
                      if (text) {
                          // PDF coords are bottom-up, so row 0 is at the top (y + h)
                          // Cell Y center: y + h - (r * rowHeight) - (rowHeight / 2)
                          // Text Y (baseline): approximate adjustment
                          const cellX = x + (c * colWidth) + 2 // Padding
                          // Adjusted Y: y + h - (r * rowHeight) is the TOP of the cell.
                          // We want to go down by rowHeight/2 for center, then down by fontSize/3 for baseline.
                          const cellY = (y + h) - (r * rowHeight) - (rowHeight / 2) - (fontSize / 3)
                          
                          page.drawText(text, {
                              x: cellX,
                              y: cellY,
                              size: fontSize,
                              font: font,
                              color: rgb(0, 0, 0),
                              maxWidth: colWidth - 4
                          })
                      }
                  }
              }
          }
      }

      // 3b. Embed Drawings (Pencil, Line, Arrow, Polygon)
      const pageDrawings = drawings.value[pNum]
      if (pageDrawings && pageDrawings.length > 0) {
          for (const d of pageDrawings) {
              if (d.type === 'pencil') {
                  // Convert SVG path to PDF drawSvgPath? pdf-lib supports this?
                  // Actually pdf-lib has drawSvgPath since v1.11.0?
                  // If not, we can parse points. We stored points!
                  if (d.points && d.points.length > 1) {
                      // Draw lines
                      for (let k = 0; k < d.points.length - 1; k++) {
                          const p1 = d.points[k]
                          const p2 = d.points[k+1]
                          page.drawLine({
                              start: { x: p1.x / scale.value, y: height - (p1.y / scale.value) },
                              end: { x: p2.x / scale.value, y: height - (p2.y / scale.value) },
                              thickness: d.strokeWidth,
                              color: rgb(0, 0, 0),
                          })
                      }
                  }
              } else if (d.type === 'line') {
                  page.drawLine({
                      start: { x: d.x1 / scale.value, y: height - (d.y1 / scale.value) },
                      end: { x: d.x2 / scale.value, y: height - (d.y2 / scale.value) },
                      thickness: d.strokeWidth,
                      color: rgb(0, 0, 0),
                  })
              } else if (d.type === 'arrow') {
                  const startX = d.x1 / scale.value
                  const startY = height - (d.y1 / scale.value)
                  const endX = d.x2 / scale.value
                  const endY = height - (d.y2 / scale.value)
                  
                  page.drawLine({
                      start: { x: startX, y: startY },
                      end: { x: endX, y: endY },
                      thickness: d.strokeWidth,
                      color: rgb(0, 0, 0),
                  })
                  
                  // Draw Arrowhead
                  // Calculate angle
                  const angle = Math.atan2(endY - startY, endX - startX)
                  const headLen = 10 // length of head in pixels
                  
                  page.drawLine({
                      start: { x: endX, y: endY },
                      end: { 
                          x: endX - headLen * Math.cos(angle - Math.PI / 6),
                          y: endY - headLen * Math.sin(angle - Math.PI / 6)
                      },
                      thickness: d.strokeWidth,
                      color: rgb(0, 0, 0),
                  })
                  page.drawLine({
                      start: { x: endX, y: endY },
                      end: { 
                          x: endX - headLen * Math.cos(angle + Math.PI / 6),
                          y: endY - headLen * Math.sin(angle + Math.PI / 6)
                      },
                      thickness: d.strokeWidth,
                      color: rgb(0, 0, 0),
                  })
              } else if (d.type === 'polygon') {
                  const pointsStr = d.points.split(' ')
                  const points = pointsStr.map(p => {
                      const [x, y] = p.split(',')
                      return { x: parseFloat(x), y: parseFloat(y) }
                  })
                  
                  if (points.length > 1) {
                      for (let k = 0; k < points.length; k++) {
                          const p1 = points[k]
                          const p2 = points[(k + 1) % points.length] // Close loop
                          page.drawLine({
                              start: { x: p1.x / scale.value, y: height - (p1.y / scale.value) },
                              end: { x: p2.x / scale.value, y: height - (p2.y / scale.value) },
                              thickness: d.strokeWidth,
                              color: rgb(0, 0, 0),
                          })
                      }
                  }
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
      // 5. Embed Highlights (Last, with transparency)
      const pageHighlights = highlights.value[pNum]
      if (pageHighlights && pageHighlights.length > 0) {
        for (const h of pageHighlights) {
            const x = h.x / scale.value
            // PDF Y is bottom-up
            const y = height - (h.y / scale.value) - (h.height / scale.value)
            
            page.drawRectangle({
                x: x,
                y: y,
                width: h.width / scale.value,
                height: h.height / scale.value,
                color: rgb(1, 1, 0), // Yellow
                opacity: 0.4,
                borderColor: undefined,
                borderWidth: 0,
            })
        }
      }
      // 6. Embed Strikeouts
      const pageStrikeouts = strikeouts.value[pNum]
      if (pageStrikeouts && pageStrikeouts.length > 0) {
        for (const s of pageStrikeouts) {
            const x = s.x / scale.value
            // PDF Y is bottom-up
            const y = height - (s.y / scale.value) - (s.height / scale.value)
            
            // Draw a line through the middle of the box
            const midY = y + (s.height / scale.value) / 2
            
            page.drawLine({
                 start: { x: x, y: midY },
                 end: { x: x + (s.width / scale.value), y: midY },
                 thickness: 2,
                 color: rgb(0, 0, 0), // Black
             })
         }
       }

       // 7. Embed Underlines
       const pageUnderlines = underlines.value[pNum]
       if (pageUnderlines && pageUnderlines.length > 0) {
         for (const u of pageUnderlines) {
             const x = u.x / scale.value
             // PDF Y is bottom-up
             const y = height - (u.y / scale.value) - (u.height / scale.value)
             
             // Draw a line at the bottom
             page.drawLine({
                 start: { x: x, y: y },
                 end: { x: x + (u.width / scale.value), y: y },
                 thickness: 2,
                 color: rgb(0, 0, 0), // Black
             })
         }
       }
     }
    
    // Embed Watermark
    if (watermark.value) {
        const { text, opacity, rotation, size, color } = watermark.value
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        
        // Apply to all pages
        const pages = pdfDoc.getPages()
        for (const p of pages) {
            const { width, height } = p.getSize()
            
            // Measure text to center it
            const textWidth = font.widthOfTextAtSize(text, size)
            const textHeight = font.heightAtSize(size)
            
            p.pushOperators(
              pushGraphicsState(),
              translate(width / 2, height / 2),
              rotate(degrees(rotation)),
              translate(-textWidth / 2, -textHeight / 4) // Approximate vertical center
            )
            
            p.drawText(text, {
                x: 0,
                y: 0,
                size: size,
                font: font,
                color: hexToRgb(color),
                opacity: opacity,
                rotate: degrees(0),
            })
            
            p.pushOperators(popGraphicsState())
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
  border: 1px solid black;
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

  .drawing-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 33; /* Below images (34) and signatures (35), above text (20) */
    pointer-events: none;
  }
  
  .drawing-element {
    pointer-events: auto;
    cursor: pointer;
  }
  
  .drawing-element:hover {
    opacity: 0.7;
  }
  
  .drawing-controls {
    position: absolute;
    z-index: 40;
    pointer-events: none;
  }
  
  .delete-btn-drawing {
    cursor: pointer;
    background: white;
    border-radius: 50%;
    pointer-events: auto;
    transform: translate(-50%, -50%);
  }

  .delete-btn-table {
    position: absolute;
    top: -10px;
    right: -10px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    pointer-events: auto;
  }

  .table-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 34; /* Same level as images */
    pointer-events: none;
  }

  .table-element {
    position: absolute;
    cursor: move;
    background: rgba(255, 255, 255, 0.8);
    border: 1px dashed transparent;
    pointer-events: auto;
  }

  .table-element.is-selected {
    border: 1px dashed #2196F3;
  }

  .table-controls {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 1px solid #2196F3;
    pointer-events: none;
  }

  .move-handle-table {
    position: absolute;
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 24px;
    background: #2196F3;
    cursor: move;
    border-radius: 4px 4px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    z-index: 35;
  }

  .image-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 34; /* Below signature (35) */
    pointer-events: none;
  }

  .image-element {
    position: absolute;
    cursor: move;
    border: 1px dashed transparent;
    pointer-events: auto;
  }
  
  .image-element:hover {
    border: 1px dashed #2196F3;
  }

  .image-controls {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 1px solid #2196F3;
    pointer-events: none;
  }

  .delete-btn-image {
    position: absolute;
    top: -10px;
    right: -10px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    pointer-events: auto;
  }

  .signature-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 35;
    pointer-events: none;
  }

  .signature-element {
    position: absolute;
    cursor: move;
    border: 1px dashed transparent;
    pointer-events: auto;
  }
  
  .signature-element:hover {
    border: 1px dashed #2196F3;
  }

  .signature-controls {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 1px solid #2196F3;
    pointer-events: none;
  }
  
  .delete-btn-signature {
    position: absolute;
    top: -10px;
    right: -10px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    pointer-events: auto;
  }
  
  .resize-handle {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 10px;
    height: 10px;
    background: #2196F3;
    cursor: se-resize;
    pointer-events: auto;
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

  .redact-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 28; /* Above whiteout (15), text (20), but below signature (35) */
  }

  .redact-element {
    position: absolute;
    background-color: black;
  }
  
  .redact-element.drawing {
    border: 1px dashed #000;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .redact-element:hover {
    border: 1px dashed #fff;
  }

  .delete-btn-redact {
    position: absolute;
    top: -8px;
    right: -8px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    display: none;
  }

  .redact-element:hover .delete-btn-redact {
    display: block;
  }

  .highlight-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 18; /* Above whiteout (15), below text (20) */
  }

  .highlight-element {
    position: absolute;
    background-color: rgba(255, 255, 0, 0.4); /* Yellow with 40% opacity */
  }
  
  .highlight-element.drawing {
    border: 1px dashed #FFD600;
  }

  .highlight-element:hover {
    border: 1px dashed #FFD600;
  }

  .delete-btn-highlight {
    position: absolute;
    top: -8px;
    right: -8px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    display: none;
  }

  .highlight-element:hover .delete-btn-highlight {
    display: block;
  }

  .strikeout-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 22; /* Above text (20) */
  }

  .strikeout-element {
    position: absolute;
    /* Transparent background, just the line */
  }
  
  .strikeout-line {
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: black;
      transform: translateY(-50%);
  }

  .strikeout-element.drawing {
    border: 1px dashed black;
  }

  .strikeout-element:hover {
    border: 1px dashed black;
  }

  .underline-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 23; /* Above text (20) */
  }

  .underline-element {
    position: absolute;
  }
  
  .underline-line {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: black;
  }

  .underline-element.drawing {
    border: 1px dashed black;
  }

  .underline-element:hover {
    border: 1px dashed black;
  }

  .delete-btn-underline {
    position: absolute;
    top: -8px;
    right: -8px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    display: none;
  }

  .underline-element:hover .delete-btn-underline {
    display: block;
  }

  .delete-btn-strikeout {
    position: absolute;
    top: -8px;
    right: -8px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    display: none;
  }

  .strikeout-element:hover .delete-btn-strikeout {
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

  .watermark-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 50; /* Top most */
    pointer-events: none;
    overflow: hidden;
  }

  .watermark-element {
    position: absolute;
    top: 50%;
    left: 50%;
    white-space: nowrap;
    font-weight: bold;
    user-select: none;
  }

  .tool-item {
    transition: background-color 0.2s;
  }
  
  .tool-item:hover {
    background-color: #F5F5F5; /* grey-lighten-4 */
  }

  .table-grid-selector {
    border: 1px solid #e0e0e0;
    padding: 4px;
    border-radius: 4px;
    background: #FAFAFA;
  }
  .grid-cell {
    width: 18px;
    height: 18px;
    border: 1px solid #e0e0e0;
    margin: 1px;
    cursor: pointer;
    background: white;
    transition: all 0.1s;
  }
  .grid-cell.active {
    background: #E3F2FD; /* blue-lighten-5 */
    border-color: #2196F3;
  }
  
  .cursor-crosshair {
      cursor: crosshair !important;
  }
  .form-element-card {
    transition: all 0.2s;
    border: 1px solid #ffe0b2 !important;
  }
  .form-element-card:hover {
    background-color: #FFF3E0 !important; /* orange-lighten-5 darken slightly */
    border-color: #FFB74D !important;
  }
</style>
