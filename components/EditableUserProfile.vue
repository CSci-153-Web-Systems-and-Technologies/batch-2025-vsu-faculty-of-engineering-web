<template>
  <div class="mx-auto w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
    <!-- Header -->
    <div class="bg-gradient-to-r from-maroon to-red-700 p-6 text-center">
      <h1 class="text-3xl font-extrabold text-white">Faculty Profile</h1>
    </div>

    <div class="p-8">
      <!-- Top-right actions -->
      <div class="mb-6 flex justify-end gap-4">
        <!-- When NOT editing: just Edit -->
        <button
          v-if="!isEditing"
          @click="toggleEdit"
          :disabled="photoUploading"
          class="rounded px-5 py-2 text-sm font-medium text-white"
          :class="photoUploading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gray-400 hover:bg-gray-600'"
        >
          Edit
        </button>

        <!-- When editing: Cancel + Save -->
        <template v-else>
          <button
            type="button"
            @click="toggleEdit"
            :disabled="photoUploading"
            class="rounded px-5 py-2 text-sm font-medium text-white"
            :class="photoUploading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-400 hover:bg-gray-600'"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSave"
            :disabled="photoUploading"
            class="rounded px-5 py-2 text-sm font-medium text-white"
            :class="photoUploading
              ? 'bg-red-300 cursor-not-allowed'
              : 'bg-maroon hover:bg-red-700'"
          >
            Save
          </button>
        </template>
      </div>

      <!-- Profile Picture -->
      <div class="mb-10 text-center">
        <div class="relative inline-block">
          <!-- Avatar -->
          <img
            :src="profilePhoto || '/placeholder.png'"
            alt="Profile"
            class="mx-auto h-32 w-32 rounded-full border-4 border-white object-cover shadow-md"
            :class="photoUploading ? 'opacity-60' : ''"
          />

          <!-- Upload overlay / spinner -->
          <div
            v-if="photoUploading"
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/30"
          >
            <!-- Simple spinner -->
            <svg class="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
                fill="none"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>

          <!-- Pencil button (hidden while uploading) -->
          <label
            v-if="isEditing && !photoUploading"
            for="file-upload"
            class="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-maroon text-white shadow-md"
            title="Upload new photo"
          >
            <Pencil class="h-4 w-4" />
          </label>

          <input
            id="file-upload"
            type="file"
            class="hidden"
            accept="image/*"
            @change="onUpload"
          />
        </div>

        <h2 class="mt-4 text-2xl font-bold text-gray-800">
          {{ profile.fullName }}
        </h2>
      </div>

      <!-- Information Section -->
      <div class="mb-10 space-y-6">
        <h3 class="text-lg font-bold text-maroon">Information</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-gray-600">Full Name</label>
            <input
              v-model="profile.fullName"
              :disabled="!isEditing"
              class="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-gray-600">Specialization</label>
            <input
              v-model="profile.specialization"
              :disabled="!isEditing"
              class="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-600">Contact Number</label>
            <input
              v-model="profile.contact"
              :disabled="!isEditing"
              type="text"
              placeholder="e.g. 09123456789"
              class="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-600">Personal Email</label>
            <input
              v-model="profile.personalEmail"
              :disabled="!isEditing"
              type="email"
              placeholder="e.g. me@example.com"
              class="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <!-- Highest Educational Attainment (UiTiptapEditor) -->
        <div>
          <label class="text-sm font-semibold text-gray-600">
            Highest Educational Attainment
          </label>
          <client-only>
            <!-- EDIT MODE -->
            <UiTiptapEditor
              v-if="isEditing"
              :key="editorKey"
              class="mt-1 rounded border shadow-sm"
              v-model="educationDraft"
              :editing="isEditing"
              placeholder="About me"
            />
            <!-- VIEW MODE -->
            <div
              v-else
              class="prose prose-sm mt-1 max-w-none leading-tight"
              v-html="profile.educationHtml || 'N/A'"
            ></div>
          </client-only>
        </div>

        <!-- Websites -->
        <div>
          <label class="text-sm font-semibold text-gray-600">Websites</label>
          <div v-if="isEditing" class="mt-1 space-y-2">
            <div
              v-for="(link, index) in profile.websites"
              :key="index"
              class="flex items-center gap-2"
            >
              <input
                v-model="profile.websites[index]"
                type="url"
                class="w-full rounded border px-3 py-2"
              />
              <button
                @click="removeWebsite(index)"
                class="text-red-500"
                title="Remove"
              >
                &times;
              </button>
            </div>
            <button @click="addWebsite" class="text-sm text-blue-600">
              + Add website
            </button>
          </div>
          <div v-else>
            <a
              v-for="(link, index) in profile.websites"
              :key="index"
              :href="link"
              class="block break-words text-blue-500 underline"
              target="_blank"
            >
              {{ link }}
            </a>
            <p v-if="!profile.websites.length">N/A</p>
          </div>
        </div>
      </div>

      <!-- Account Details -->
      <div class="space-y-6">
        <h3 class="text-lg font-bold text-maroon">Account Details</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-gray-600">Email</label>
            <input
              v-model="profile.email"
              disabled
              class="mt-1 w-full rounded border bg-gray-100 px-3 py-2"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-gray-600">
              {{ isEditing ? 'New Password' : 'Password' }}
            </label>
            <input
              :type="'password'"
              :value="isEditing ? newPassword : '••••••••'"
              @input="(e) => isEditing && (newPassword = e.target.value)"
              :disabled="!isEditing"
              class="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div v-if="isEditing && newPassword" class="md:col-span-2">
            <label class="text-sm font-semibold text-gray-600">Current Password</label>
            <input
              v-model="currentPassword"
              type="password"
              class="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import UiTiptapEditor from '@/components/UiTiptapEditor.vue'
import { Pencil } from 'lucide-vue-next'

const props = defineProps({
  initialProfile: { type: Object, required: true },
  profilePhoto: String,
  isFaculty: Boolean,
  photoUploading: { type: Boolean, default: false },
})

const emit = defineEmits(['update-profile', 'upload-photo', 'change-password'])

const isEditing = ref(false)
const newPassword = ref('')
const currentPassword = ref('')

/** Local reactive profile */
const profile = ref({
  ...props.initialProfile,
  websites: Array.isArray(props.initialProfile?.websites)
    ? [...props.initialProfile.websites]
    : [],
  contact: props.initialProfile.contact || '',
  personalEmail: props.initialProfile.personalEmail || '',
  specialization: props.initialProfile.specialization || '',
  educationHtml:
    props.initialProfile.educationHtml || props.initialProfile.education || '',
})

/** Tiptap content draft + key to force re-mount on cancel */
const educationDraft = ref('')
const editorKey = ref(0)

/** Sync when parent updates initialProfile */
watch(
  () => props.initialProfile,
  (val) => {
    profile.value = {
      ...val,
      websites: Array.isArray(val?.websites) ? [...val.websites] : [],
      contact: val?.contact || '',
      personalEmail: val?.personalEmail || '',
      specialization: val?.specialization || '',
      educationHtml: val?.educationHtml || val?.education || '',
    }
    if (!isEditing.value) {
      educationDraft.value = profile.value.educationHtml || ''
    }
  },
  { immediate: true, deep: true },
)

const toggleEdit = () => {
  if (!isEditing.value) {
    educationDraft.value = profile.value.educationHtml || ''
  } else {
    editorKey.value++
    newPassword.value = ''
    currentPassword.value = ''
  }
  isEditing.value = !isEditing.value
}

const handleSave = () => {
  const cleaned = (educationDraft.value || '')
    .replace(/^(<p><br><\/p>\s*)+/, '')
    .replace(/(\s*<p><br><\/p>)+$/, '')
    .trim()

  if (!cleaned) {
    alert('Education field cannot be empty!')
    return
  }

  emit('update-profile', {
    ...profile.value,
    education: cleaned,
    educationHtml: cleaned,
    contact: profile.value.contact,
    personalEmail: profile.value.personalEmail,
    specialization: profile.value.specialization,
    websites: profile.value.websites,
  })

  if (newPassword.value && currentPassword.value) {
    emit('change-password', {
      newPassword: newPassword.value,
      currentPassword: currentPassword.value,
    })
  }

  isEditing.value = false
  newPassword.value = ''
  currentPassword.value = ''
}

const addWebsite = () => profile.value.websites.push('')

const removeWebsite = (index) => {
  profile.value.websites.splice(index, 1)
}

const onUpload = (e) => {
  const target = e.target
  const file = target && target.files && target.files[0]
  if (file) emit('upload-photo', file)
}
</script>

<style scoped>
.text-maroon {
  color: #740505;
}
.bg-maroon {
  background-color: #740505;
}

/* ✅ Keep text tidy in viewer */
.prose p {
  margin-top: 0 !important;
  margin-bottom: 0.25rem !important;
  line-height: 1.5 !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
}
.prose ul,
.prose ol {
  margin-top: 0.5rem !important;
  margin-bottom: 0.5rem !important;
  padding-left: 1.25rem !important;
}
.prose {
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
}
.prose p:empty {
  display: none;
}
</style>
