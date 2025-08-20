<script setup lang="ts">
import { useApi } from '#imports'

const { data, execute } = await useApi('/pet/{petId}', {
  immediate: false,
  path: {
    petId: 1,
  },
})

const { data: value } = await useApi('/pet/{petId}', {
  path: {
    petId: 3,
  },
})

const { data: helloValue } = useFetch('/api/hello')

// Form Data Examples - these demonstrate the new type-safe form data support

// Example 1: URL-encoded form data with object (will be auto-converted to URLSearchParams)
const { data: formUpdateData, execute: executeFormUpdate } = await useApi(
  '/pet/{petId}/updateForm',
  {
    immediate: false,
    method: 'post',
    path: { petId: 1 },
    body: {
      name: 'Updated Pet Name',
      status: 'available',
      photoUrls: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ],
    },
  },
)

// Example 2: URL-encoded form data with URLSearchParams
function updatePetWithParams() {
  const params = new URLSearchParams()
  params.append('name', 'Pet from URLSearchParams')
  params.append('status', 'pending')

  return $fetch('/api/v3/pet/1/updateForm', {
    method: 'post',
    body: params,
  })
}

// Example 3: Multipart form data with object (will be auto-converted to FormData)
const { data: uploadData, execute: executeUpload } = await useApi(
  '/pet/{petId}/uploadMultiple',
  {
    immediate: false,
    method: 'post',
    path: { petId: 1 },
    body: {
      files: ['file1.jpg', 'file2.jpg'] as any, // In real usage, these would be File objects
      name: 'My Pet Photos',
      description: 'Photos of my favorite pet',
      metadata: {
        tags: ['cute', 'pet', 'photo'],
        priority: 1,
      },
    },
  },
)

// Example 4: Multipart form data with FormData
function uploadWithFormData() {
  const formData = new FormData()
  formData.append('name', 'Manual FormData Upload')
  formData.append('description', 'Uploaded using FormData directly')

  // In a real application, you'd append actual File objects
  // formData.append('files', fileInput.files[0])

  return $fetch('/api/v3/pet/1/uploadMultiple', {
    method: 'post',
    body: formData,
  })
}
</script>

<template>
  <div style="padding: 2rem; font-family: monospace">
    <h1>Nuxt Open Fetch Playground</h1>

    <h2>Basic Examples</h2>
    <div>
      <pre>Pet Data (lazy): {{ data }}</pre>
      <pre>Pet Data (immediate): {{ value }}</pre>
      <pre>Nitro API: {{ helloValue }}</pre>
      <button @click="() => execute()">
        Load Pet Data
      </button>
    </div>

    <h2>Form Data Examples</h2>
    <div style="margin-top: 1rem">
      <h3>URL-Encoded Form Data</h3>
      <pre>Form Update Result: {{ formUpdateData }}</pre>
      <button style="margin-right: 1rem" @click="() => executeFormUpdate()">
        Update Pet with Form Data
      </button>
      <button @click="updatePetWithParams">
        Update Pet with URLSearchParams
      </button>
    </div>

    <div style="margin-top: 1rem">
      <h3>Multipart Form Data</h3>
      <pre>Upload Result: {{ uploadData }}</pre>
      <button style="margin-right: 1rem" @click="() => executeUpload()">
        Upload with Object Body
      </button>
      <button @click="uploadWithFormData">
        Upload with FormData
      </button>
    </div>

    <div
      style="
        margin-top: 2rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
      "
    >
      <h3>Type Safety Features Demonstrated:</h3>
      <ul style="margin: 0; padding-left: 1.5rem">
        <li>
          <strong>Automatic Content-Type Detection:</strong> Objects become
          URLSearchParams or FormData based on endpoint
        </li>
        <li>
          <strong>TypeScript Intellisense:</strong> Full type safety for form
          fields and file uploads
        </li>
        <li>
          <strong>Multiple Input Types:</strong> Support for both object
          notation and native Web APIs
        </li>
        <li>
          <strong>SSR Compatible:</strong> Works seamlessly with Nuxt
          composables and server-side rendering
        </li>
        <li>
          <strong>Zero Runtime Overhead:</strong> All type checking happens at
          compile time
        </li>
      </ul>
    </div>
  </div>
</template>
