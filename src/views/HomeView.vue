<template>
  <div class="d-flex flex-column w-100 bg-white align-center" style="min-height: 100vh;">
    <!-- Hero Text Section (Original) -->
    <div class="text-center mb-10 mt-10">
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
      class="upload-area w-100 d-flex flex-column align-center justify-center py-10 px-4 mb-10"
      max-width="1000"
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
        Up to 100 MB for PDF, JPEG, PNG
      </div>
    </v-card>

    <!-- Selected File Display (Visible when file is selected) -->
    <v-card
      v-else
      flat
      border
      class="w-100 pa-6 mt-10"
      max-width="600"
    >
      <div class="d-flex align-center">
        <v-avatar color="primary-lighten-5" size="56" class="mr-4">
          <v-icon :icon="getFileIcon(selectedFile)" color="primary" size="32"></v-icon>
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
          <span class="text-body-2 font-weight-medium">Processing...</span>
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

    <!-- Features/Options Section -->
    <div class="w-100 mt-10" style="max-width: 1000px;">
      <h3 class="text-h5 font-weight-bold text-center mb-6 text-grey-darken-3">
        Popular PDF Tools
      </h3>
      
      <v-row>
        <!-- Sign & Edit -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('edit')"
              color="white"
            >
              <v-avatar color="primary-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-draw" color="primary" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">Sign & Edit</div>
              <div class="text-caption text-grey">View, sign, and edit PDFs</div>
            </v-card>
          </v-hover>
        </v-col>

        <!-- Convert to Word -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('convert')"
              color="white"
            >
              <v-avatar color="orange-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-file-word-box" color="orange-darken-2" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">Convert to Word</div>
              <div class="text-caption text-grey">Convert PDF to editable Word</div>
            </v-card>
          </v-hover>
        </v-col>

        <!-- Compress -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('compress')"
              color="white"
            >
              <v-avatar color="teal-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-zip-box" color="teal-darken-2" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">Compress PDF</div>
              <div class="text-caption text-grey">Reduce file size</div>
            </v-card>
          </v-hover>
        </v-col>

        <!-- Watermark -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('watermark')"
              color="white"
            >
              <v-avatar color="indigo-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-watermark" color="indigo-darken-2" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">Watermark</div>
              <div class="text-caption text-grey">Add custom watermark</div>
            </v-card>
          </v-hover>
        </v-col>
        <!-- Merge PDF -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('merge')"
              color="white"
            >
              <v-avatar color="purple-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-file-multiple" color="purple-darken-2" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">Merge PDF</div>
              <div class="text-caption text-grey">Combine multiple PDFs</div>
            </v-card>
          </v-hover>
        </v-col>

        <!-- PDF to PNG -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('pdf-to-png')"
              color="white"
            >
              <v-avatar color="green-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-file-image" color="green-darken-2" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">PDF to PNG</div>
              <div class="text-caption text-grey">Convert PDF to PNG images</div>
            </v-card>
          </v-hover>
        </v-col>

        <!-- PNG to PDF -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('png-to-pdf')"
              color="white"
            >
              <v-avatar color="red-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-file-pdf-box" color="red-darken-2" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">PNG to PDF</div>
              <div class="text-caption text-grey">Convert PNG images to PDF</div>
            </v-card>
          </v-hover>
        </v-col>

        <!-- PDF to JPG -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('pdf-to-jpg')"
              color="white"
            >
              <v-avatar color="blue-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-file-image" color="blue-darken-2" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">PDF to JPG</div>
              <div class="text-caption text-grey">Convert PDF to JPG images</div>
            </v-card>
          </v-hover>
        </v-col>

        <!-- JPG to PDF -->
        <v-col cols="12" md="3">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 4 : 1"
              class="h-100 d-flex flex-column align-center justify-center pa-4 text-center cursor-pointer"
              @click="handleOptionClick('jpg-to-pdf')"
              color="white"
            >
              <v-avatar color="orange-lighten-5" size="64" class="mb-3">
                <v-icon icon="mdi-file-pdf-box" color="orange-darken-2" size="32"></v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold mb-1">JPG to PDF</div>
              <div class="text-caption text-grey">Convert JPG images to PDF</div>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>
    </div>

    <!-- New Dark Hero Section (Bottom) -->
    <div
      class="bg-black py-16 position-relative d-flex align-center mt-16 rounded-xl mx-4 mb-4"
      style="min-height: 600px; width: calc(100% - 32px);"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @dragenter.prevent
    >
      <v-container>
        <v-row align="center">
          <!-- Left Column: Text & CTA -->
          <v-col cols="12" md="6" class="text-left">
            <h1 class="text-h3 text-md-h2 font-weight-black mb-6 text-white" style="line-height: 1.2;">
              Edit PDFs easily with a complete all-in-one solution.
            </h1>
            <p class="text-h6 text-grey-lighten-1 mb-8" style="font-weight: 400; max-width: 500px;">
              Handle, organize, and control your documents effortlessly with one smart digital platform.
            </p>
            <v-btn
              color="orange-darken-1"
              size="x-large"
              class="text-white text-capitalize px-8 font-weight-bold rounded-lg"
              elevation="0"
              height="56"
              @click="triggerFileInput"
            >
              Upload document
            </v-btn>
            
            <div class="mt-4 text-grey-darken-2 text-caption">
                or drop files here
            </div>

            <div class="text-caption text-grey-darken-2 mt-2" style="max-width: 600px;">
              Up to 100 MB for PDF, JPEG, PNG
            </div>
          </v-col>

          <!-- Right Column: Mock Editor Graphic -->
          <v-col cols="12" md="6" class="d-none d-md-block">
             <div class="mock-editor-container position-relative">
                <!-- Mock Editor Window -->
                <v-card class="rounded-lg overflow-hidden" elevation="10" border theme="light">
                   <!-- Mock Toolbar -->
                   <div class="bg-grey-lighten-4 pa-2 d-flex align-center gap-2 border-b">
                      <v-btn size="small" variant="text" icon="mdi-file-document-outline" color="grey-darken-2"></v-btn>
                      <v-divider vertical class="mx-1"></v-divider>
                      <v-btn size="small" variant="text" icon="mdi-undo" color="grey-darken-2"></v-btn>
                      <v-btn size="small" variant="text" icon="mdi-redo" color="grey-darken-2"></v-btn>
                      <v-spacer></v-spacer>
                      <v-btn size="small" variant="text" class="text-capitalize text-grey-darken-2">
                        <v-icon start icon="mdi-cursor-default-outline"></v-icon> Select
                      </v-btn>
                      <v-btn size="small" variant="text" class="text-capitalize text-grey-darken-2">
                        <v-icon start icon="mdi-format-text"></v-icon> Text
                      </v-btn>
                      <v-btn size="small" tonal color="primary" class="text-capitalize bg-blue-lighten-5">
                        <v-icon start icon="mdi-draw"></v-icon> Sign
                      </v-btn>
                   </div>
                   <!-- Mock Canvas -->
                   <div class="bg-grey-lighten-3 pa-4" style="height: 350px; overflow: hidden; position: relative;">
                      <v-sheet class="mx-auto pa-8 text-body-2 text-grey-darken-2" width="100%" height="100%" elevation="2">
                         <div class="text-h6 text-black mb-4">SaMo Eats</div>
                         <p class="mb-2">Samo Eats is a local food delivery service that connects customers with nearby restaurants and delivers meals straight to their door.</p>
                         <p>Download: <span class="bg-blue-lighten-4 px-1 text-black">SaMo Eat App</span></p>
                         
                         <div class="mt-10 d-flex justify-space-between align-end">
                            <div class="border-b w-25 pb-1">Client Signature</div>
                            <div class="border-b w-25 pb-1">Date</div>
                         </div>
                         
                         <!-- Mock Signature Placement -->
                         <div class="position-absolute" style="bottom: 80px; left: 60px;">
                            <div class="border-dashed border-primary bg-yellow-lighten-5 px-4 py-2 text-h5 font-italic" style="border-width: 2px !important; color: black; font-family: cursive;">
                                Hanna S.
                                <div class="position-absolute bg-white rounded-circle border border-primary" style="width: 10px; height: 10px; top: -5px; right: -5px;"></div>
                            </div>
                         </div>
                      </v-sheet>
                   </div>
                </v-card>

                <!-- Mock Type Signature Dialog (Floating) -->
                <v-card class="position-absolute rounded-lg elevation-24" width="280" style="bottom: -20px; left: -20px;" theme="light">
                   <div class="pa-3 border-b d-flex justify-space-between align-center">
                      <span class="text-subtitle-2 font-weight-bold text-black">Type signature</span>
                      <v-icon size="small" icon="mdi-close" color="grey"></v-icon>
                   </div>
                   <div class="pa-4 bg-grey-lighten-5">
                      <v-text-field
                        model-value="Hanna S"
                        variant="outlined"
                        density="compact"
                        bg-color="white"
                        hide-details
                        class="mb-3"
                        color="primary"
                      ></v-text-field>
                      <div class="text-h4 text-center font-italic py-2 text-black" style="font-family: cursive;">
                         Hanna S.
                      </div>
                   </div>
                </v-card>
             </div>
          </v-col>
        </v-row>
      </v-container>
      
      <!-- Hidden File Input (Duplicated logic for this section's button) -->
      <!-- Note: We can reuse the same refs and handlers -->
    </div>

    <!-- Informational Content Section -->
    <v-container class="py-16" style="max-width: 1000px;">
      <!-- What is PDF Editor -->
      <div class="mb-12">
        <h2 class="text-h4 font-weight-bold mb-6 text-grey-darken-3">What is PDF Editor?</h2>
        <p class="text-body-1 text-grey-darken-1" style="line-height: 1.8;">
          PDF Editor is an online platform that allows users to easily create, edit, manage, and share PDF documents. It provides powerful tools that help individuals and businesses modify PDF files without needing complex software.
        </p>
      </div>

      <!-- Usability -->
      <div class="mb-12">
        <h3 class="text-h5 font-weight-bold mb-4 text-grey-darken-3 d-flex align-center">
          <span class="mr-2">📘</span> Why does PDF Editor enhance document usability?
        </h3>
        <p class="text-body-1 text-grey-darken-1 mb-4">
          PDF Editor enhances document usability by making documents:
        </p>
        <v-list density="compact" class="bg-transparent mb-4">
          <v-list-item prepend-icon="mdi-check-circle" class="text-grey-darken-1">Easy to edit and update</v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" class="text-grey-darken-1">Accessible from anywhere (online access)</v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" class="text-grey-darken-1">Simple to fill, sign, and share</v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" class="text-grey-darken-1">More interactive and professional</v-list-item>
        </v-list>
        <p class="text-body-1 text-grey-darken-1">
          Instead of recreating documents from scratch, users can quickly make changes and improve document efficiency.
        </p>
      </div>

      <!-- Benefits -->
      <div class="mb-12">
        <h3 class="text-h5 font-weight-bold mb-4 text-grey-darken-3 d-flex align-center">
          <span class="mr-2">📘</span> Benefits of PDF Editor’s editing tools
        </h3>
        <p class="text-body-1 text-grey-darken-1 mb-4">
          PDF Editor offers several powerful features:
        </p>
        <v-row>
          <v-col cols="12" md="6">
            <v-list density="compact" class="bg-transparent">
              <v-list-item class="text-grey-darken-1">
                <template v-slot:prepend><span class="mr-2 text-h6">✏️</span></template>
                Edit text directly inside PDFs
              </v-list-item>
              <v-list-item class="text-grey-darken-1">
                <template v-slot:prepend><span class="mr-2 text-h6">🖼️</span></template>
                Add, remove, or resize images
              </v-list-item>
              <v-list-item class="text-grey-darken-1">
                <template v-slot:prepend><span class="mr-2 text-h6">✍️</span></template>
                Insert electronic signatures
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="6">
            <v-list density="compact" class="bg-transparent">
              <v-list-item class="text-grey-darken-1">
                <template v-slot:prepend><span class="mr-2 text-h6">📑</span></template>
                Create and fill out forms
              </v-list-item>
              <v-list-item class="text-grey-darken-1">
                <template v-slot:prepend><span class="mr-2 text-h6">🔒</span></template>
                Secure documents with password protection
              </v-list-item>
              <v-list-item class="text-grey-darken-1">
                <template v-slot:prepend><span class="mr-2 text-h6">📤</span></template>
                Download or share instantly
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
        <p class="text-body-1 text-grey-darken-1 mt-4">
          These tools save time, increase productivity, and improve workflow.
        </p>
      </div>

      <!-- Why Choose -->
      <div class="mb-12">
        <h3 class="text-h5 font-weight-bold mb-4 text-grey-darken-3 d-flex align-center">
          <span class="mr-2">📘</span> Why choose PDF Editor for your document needs?
        </h3>
        <p class="text-body-1 text-grey-darken-1 mb-4">
          You should choose PDF Editor because:
        </p>
        <v-list density="compact" class="bg-transparent mb-4">
          <v-list-item prepend-icon="mdi-star" class="text-grey-darken-1">It is user-friendly and simple to use</v-list-item>
          <v-list-item prepend-icon="mdi-star" class="text-grey-darken-1">It works online without complicated installations</v-list-item>
          <v-list-item prepend-icon="mdi-star" class="text-grey-darken-1">It keeps your document formatting intact</v-list-item>
          <v-list-item prepend-icon="mdi-star" class="text-grey-darken-1">It provides secure and reliable document handling</v-list-item>
          <v-list-item prepend-icon="mdi-star" class="text-grey-darken-1">It is suitable for students, professionals, and businesses</v-list-item>
        </v-list>
        <p class="text-body-1 text-grey-darken-1">
          PDF Editor helps you manage your documents faster and more efficiently.
        </p>
      </div>

      <!-- How To -->
      <div class="mb-12">
        <h3 class="text-h5 font-weight-bold mb-4 text-grey-darken-3 d-flex align-center">
          <span class="mr-2">📘</span> How to edit a PDF document using PDF Editor
        </h3>
        <v-timeline density="compact" side="end" class="text-left">
          <v-timeline-item dot-color="orange-darken-1" size="x-small">
            <div class="text-body-1 text-grey-darken-1">Visit the PDF Editor website.</div>
          </v-timeline-item>
          <v-timeline-item dot-color="orange-darken-1" size="x-small">
            <div class="text-body-1 text-grey-darken-1">Upload your PDF file.</div>
          </v-timeline-item>
          <v-timeline-item dot-color="orange-darken-1" size="x-small">
            <div class="text-body-1 text-grey-darken-1">Select the editing tools you need (text, image, signature, etc.).</div>
          </v-timeline-item>
          <v-timeline-item dot-color="orange-darken-1" size="x-small">
            <div class="text-body-1 text-grey-darken-1">Make the required changes.</div>
          </v-timeline-item>
          <v-timeline-item dot-color="orange-darken-1" size="x-small">
            <div class="text-body-1 text-grey-darken-1">Save your updated document.</div>
          </v-timeline-item>
          <v-timeline-item dot-color="green" size="small" icon="mdi-check">
            <div class="text-body-1 text-grey-darken-1 font-weight-bold">Download or share the edited file.</div>
          </v-timeline-item>
        </v-timeline>
      </div>
    </v-container>
    
    <!-- Shared Hidden Inputs -->
    <input
      type="file"
      ref="fileInput"
      class="d-none"
      @change="handleFileUpload"
      accept=".pdf, .jpeg, .png, .jpg"
      multiple
    />

    <input
      type="file"
      ref="pngInput"
      class="d-none"
      @change="handlePngUpload"
      accept="image/png, image/jpeg, image/jpg"
      multiple
    />

    <!-- Merge Dialog -->
    <v-dialog v-model="showMergeDialog" max-width="600" persistent>
      <v-card class="rounded-lg elevation-4">
        <v-card-title class="text-h5 pa-4 bg-orange-darken-1 text-white d-flex justify-space-between align-center">
          <div class="font-weight-bold">
            <v-icon icon="mdi-file-multiple" class="mr-2"></v-icon>
            Merge PDFs
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeMergeDialog"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <div class="text-subtitle-1 mb-4 text-grey-darken-2 font-weight-medium">
            Files to be merged:
          </div>
          
          <v-list lines="one" class="bg-grey-lighten-4 rounded-lg mb-6 border" elevation="0">
            <v-list-item v-for="(file, index) in filesToMerge" :key="index" class="py-2">
              <template v-slot:prepend>
                <v-avatar color="white" class="mr-2" size="40">
                    <v-icon icon="mdi-file-pdf-box" color="error" size="24"></v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">{{ file.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatFileSize(file.size) }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-btn icon="mdi-close-circle" variant="text" density="comfortable" color="grey-darken-1" @click="removeMergeFile(index)" :disabled="index === 0 && !canRemoveFirstFile"></v-btn>
              </template>
            </v-list-item>
          </v-list>
          
          <div class="d-flex gap-3">
              <v-btn
                variant="outlined"
                color="orange-darken-1"
                prepend-icon="mdi-plus"
                height="48"
                class="text-capitalize font-weight-bold flex-grow-1"
                @click="triggerMergeInput"
              >
                Add Another File
              </v-btn>
              
              <v-btn
                color="orange-darken-1"
                height="48"
                variant="flat"
                :loading="isMerging"
                :disabled="filesToMerge.length < 2"
                @click="mergePdfs"
                class="text-white text-capitalize font-weight-bold flex-grow-1"
                elevation="2"
              >
                Combine
              </v-btn>
          </div>
          
          <input
            type="file"
            ref="mergeInput"
            class="d-none"
            @change="handleMergeFileUpload"
            accept=".pdf"
            multiple
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      location="top"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const store = useStore()
const router = useRouter()

const fileInput = ref(null)
const selectedFile = ref(null)
const isConverting = ref(false)
const conversionProgress = ref(0)
const conversionComplete = ref(false)
const convertedPages = ref([])

// Snackbar state
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('info')

// Selected Images for PNG to PDF
const selectedImages = ref([])

// Merge State
const showMergeDialog = ref(false)
const filesToMerge = ref([])
const mergeInput = ref(null)
const isMerging = ref(false)
const canRemoveFirstFile = ref(false) // Usually first file is the main uploaded file

const getFileIcon = (file) => {
    if (!file) return 'mdi-file'
    const type = file.type
    const name = file.name.toLowerCase()
    
    if (type === 'application/pdf' || name.endsWith('.pdf')) return 'mdi-file-pdf-box'
    if (['image/png', 'image/jpeg', 'image/jpg'].includes(type) || name.match(/\.(png|jpg|jpeg|jfif)$/)) return 'mdi-file-image'
    if (name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.rtf')) return 'mdi-file-word-box'
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'mdi-file-powerpoint-box'
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'mdi-file-excel-box'
    if (name.endsWith('.txt')) return 'mdi-file-document-outline'
    
    return 'mdi-file'
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    processFiles(files)
  }
  event.target.value = ''
}

const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    processFiles(files)
  }
}

const processFiles = (files) => {
    // Separate files
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    const imageFiles = files.filter(f => ['image/png', 'image/jpeg', 'image/jpg'].includes(f.type))
    const otherFiles = files.filter(f => !pdfFiles.includes(f) && !imageFiles.includes(f))
    
    // Priority 1: PDF Files
    if (pdfFiles.length > 0) {
        if (pdfFiles.length > 1) {
            // Multiple PDFs -> Merge
            selectedFile.value = pdfFiles[0]
            store.dispatch('setFile', pdfFiles[0])
            filesToMerge.value = pdfFiles
            canRemoveFirstFile.value = true
            showMergeDialog.value = true
        } else {
            // Single PDF -> View/Edit
            processFile(pdfFiles[0])
        }
        
        // Notify if other files were ignored
        if (imageFiles.length > 0 || otherFiles.length > 0) {
            showSnackbar.value = true
            snackbarText.value = `Opened PDF(s). Ignored ${imageFiles.length + otherFiles.length} other file(s).`
            snackbarColor.value = 'info'
        }
        return
    }
    
    // Priority 2: Image Files -> Allow selection, manual PNG to PDF
    if (imageFiles.length > 0) {
        // Store all images
        selectedImages.value = imageFiles
        selectedFile.value = imageFiles[0] // Set first as main to trigger UI "Selected File" state
        store.dispatch('setFile', imageFiles[0])
        
        showSnackbar.value = true
        snackbarText.value = `${imageFiles.length} images selected. Click 'PNG to PDF' to convert.`
        snackbarColor.value = 'success'
        return
    }
    
    // Priority 3: Other Files (Doc, PPT, etc.) -> Show not supported yet or specific message
    if (otherFiles.length > 0) {
        showSnackbar.value = true
        snackbarText.value = 'Document conversion for this file type is coming soon!'
        snackbarColor.value = 'warning'
        return
    }
    
    // Fallback
    showSnackbar.value = true
    snackbarText.value = 'Please select a supported file.'
    snackbarColor.value = 'warning'
}

const processFile = (file) => {
  // Allow non-PDFs to be "selected" but maybe with limited actions?
  // For now, if it's a PDF, we proceed as normal.
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      selectedFile.value = file
      store.dispatch('setFile', file)
  } else {
      // It's a non-PDF (e.g. Doc) that got here. 
      // We can set it as selectedFile to show it, but disable Edit/Merge tools?
      selectedFile.value = file
      store.dispatch('setFile', file)
      // Maybe show a warning that only "Convert to PDF" is available?
      // Currently we don't have "Word to PDF" logic implemented.
  }
}

const handleOptionClick = (action) => {
    // Check if file is required for this action
    if (action === 'png-to-pdf' || action === 'jpg-to-pdf') {
        // If images are already selected, use them
        if (selectedImages.value.length > 0) {
            handlePngConversion(selectedImages.value)
        } else {
            // Otherwise trigger upload
            triggerPngInput()
        }
        return
    }

    // If file exists, perform action (redirect to options or editor)
    if (selectedFile.value) {
        if (action === 'edit') {
            router.push('/editor')
        } else if (action === 'merge') {
            openMergeDialog()
        } else if (action === 'pdf-to-png') {
            convertPdfToImage('png')
        } else if (action === 'pdf-to-jpg') {
            convertPdfToImage('jpeg')
        } else if (action === 'watermark') {
            router.push({ path: '/editor', query: { tool: 'watermark' } })
        } else {
            router.push('/options') // For now, other actions are in OptionsView
        }
    } else {
        // No file, show warning
        showSnackbar.value = true
        snackbarText.value = 'Please upload a PDF document first.'
        snackbarColor.value = 'warning'
    }
}

const convertPdfToImage = async (format) => {
    // format must be 'png' or 'jpeg'
    if (!selectedFile.value) return
    isConverting.value = true
    conversionProgress.value = 0
    
    try {
        const fileData = await selectedFile.value.arrayBuffer()
        const pdf = await pdfjsLib.getDocument(fileData).promise
        const numPages = pdf.numPages
        
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({ scale: 2.0 }) // High resolution
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.height = viewport.height
            canvas.width = viewport.width
            
            // Draw white background for JPEG (since it doesn't support transparency)
            if (format === 'jpeg') {
                context.fillStyle = '#FFFFFF'
                context.fillRect(0, 0, canvas.width, canvas.height)
            }
            
            await page.render({ canvasContext: context, viewport: viewport }).promise
            
            conversionProgress.value = Math.round((i / numPages) * 100)
            
            // Download
            const link = document.createElement('a')
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
            const ext = format === 'png' ? 'png' : 'jpg'
            
            link.href = canvas.toDataURL(mimeType, 0.9) // 0.9 quality for jpeg
            link.download = `${selectedFile.value.name.replace('.pdf', '')}_page_${i}.${ext}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
        
        showSnackbar.value = true
        snackbarText.value = `PDF converted to ${format.toUpperCase()} successfully!`
        snackbarColor.value = 'success'
        
    } catch (error) {
        console.error(`PDF to ${format.toUpperCase()} error:`, error)
        showSnackbar.value = true
        snackbarText.value = `Failed to convert PDF to ${format.toUpperCase()}.`
        snackbarColor.value = 'error'
    } finally {
        isConverting.value = false
        conversionProgress.value = 0
    }
}

// PNG to PDF
const pngInput = ref(null)

const triggerPngInput = () => {
    pngInput.value.click()
}

const handlePngUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return
    
    // Instead of auto-converting, just select them and let user click 'PNG to PDF'
    selectedImages.value = files
    selectedFile.value = files[0] // Display purpose
    store.dispatch('setFile', files[0])
    
    showSnackbar.value = true
    snackbarText.value = `${files.length} images selected. Click 'PNG to PDF' to convert.`
    snackbarColor.value = 'success'
    
    event.target.value = ''
}

const handlePngConversion = async (files) => {
    isConverting.value = true
    
    try {
        const pdfDoc = await PDFDocument.create()
        
        for (const file of files) {
            const imageBytes = await file.arrayBuffer()
            let image
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                image = await pdfDoc.embedJpg(imageBytes)
            } else if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(imageBytes)
            } else {
                continue // Skip unsupported
            }
            
            if (image) {
                const page = pdfDoc.addPage([image.width, image.height])
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                })
            }
        }
        
        const pdfBytes = await pdfDoc.save()
        
        // Download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `converted_images_${Date.now()}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        showSnackbar.value = true
        snackbarText.value = 'Images converted to PDF successfully!'
        snackbarColor.value = 'success'
        
    } catch (error) {
        console.error('PNG to PDF error:', error)
        showSnackbar.value = true
        snackbarText.value = 'Failed to convert images to PDF.'
        snackbarColor.value = 'error'
    } finally {
        isConverting.value = false
    }
}

// Merge Functions
const openMergeDialog = () => {
    if (!selectedFile.value) return
    filesToMerge.value = [selectedFile.value]
    canRemoveFirstFile.value = false // Keep the main file
    showMergeDialog.value = true
}

const closeMergeDialog = () => {
    showMergeDialog.value = false
    filesToMerge.value = []
}

const triggerMergeInput = () => {
    mergeInput.value.click()
}

const handleMergeFileUpload = (event) => {
    const files = Array.from(event.target.files)
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    
    if (pdfFiles.length < files.length) {
        showSnackbar.value = true
        snackbarText.value = 'Some files were skipped. Only PDFs allowed.'
        snackbarColor.value = 'warning'
    }
    
    filesToMerge.value = [...filesToMerge.value, ...pdfFiles]
    event.target.value = ''
}

const removeMergeFile = (index) => {
    filesToMerge.value.splice(index, 1)
}

const mergePdfs = async () => {
    if (filesToMerge.value.length < 2) return
    isMerging.value = true
    
    try {
        const mergedPdf = await PDFDocument.create()
        
        for (const file of filesToMerge.value) {
            const arrayBuffer = await file.arrayBuffer()
            const pdf = await PDFDocument.load(arrayBuffer)
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
            copiedPages.forEach((page) => mergedPdf.addPage(page))
        }
        
        const mergedPdfBytes = await mergedPdf.save()
        
        // Download
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `merged_document_${Date.now()}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        showSnackbar.value = true
        snackbarText.value = 'PDFs merged successfully!'
        snackbarColor.value = 'success'
        showMergeDialog.value = false
        filesToMerge.value = []
        
    } catch (error) {
        console.error('Merge error:', error)
        showSnackbar.value = true
        snackbarText.value = 'Failed to merge PDFs.'
        snackbarColor.value = 'error'
    } finally {
        isMerging.value = false
    }
}

const removeFile = () => {
  selectedFile.value = null
  selectedImages.value = [] // Clear selected images
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
