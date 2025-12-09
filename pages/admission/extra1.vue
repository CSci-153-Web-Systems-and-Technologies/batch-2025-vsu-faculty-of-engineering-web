<template>
  <main class="bg-white">
    <!-- Hero with dynamic cover image -->
    <div class="relative flex items-center w-full font-playfair">
      <img
        :src="coverImage"
        :alt="`${pageTitle} cover`"
        class="object-cover w-full h-44 md:h-128"
      />
      <div
        class="absolute left-6 top-16 bg-gray-700/90 px-2 py-2 md:left-[120px] md:top-40 md:px-4 md:py-4"
      >
        <span class="text-xl text-white md:text-6xl">
          {{ pageTitle }}
        </span>
      </div>
    </div>

    <!-- Main Content Container (same layout style as faculty / graduate) -->
    <div class="w-full h-auto mx-auto mt-10 space-y-6 md:w-3/4 md:space-y-8">
      <!-- If admin hid the page -->
      <div v-if="!isVisible" class="py-20 text-center">
        <h2 class="text-2xl font-semibold">This page is not available</h2>
        <p class="mt-2 text-gray-600">
          The content on this page has been hidden by the site administrator.
        </p>
      </div>

      <!-- Actual content when visible -->
      <template v-else>
        <!-- Optional video section -->
        <div
          v-if="hasVideo"
          class="w-full h-auto p-2 rounded-xl md:mx-auto md:h-128 md:w-3/4"
        >
          <!-- YouTube embed -->
          <iframe
            v-if="sectionData?.videoUrl && sectionData.videoUrl.includes('youtube.com')"
            :src="getYoutubeEmbedUrl(sectionData.videoUrl)"
            frameborder="0"
            allowfullscreen
            class="w-full h-56 rounded-md object-fit md:h-full"
          ></iframe>

          <!-- Fallback for direct video URLs (.mp4 etc.) -->
          <video
            v-else
            :src="sectionData?.videoUrl"
            controls
            preload="auto"
            playsinline
            class="object-cover w-full h-56 rounded-md md:h-full"
          ></video>
        </div>

        <!-- Grey content card -->
        <div class="w-11/12 mx-auto mb-12 md:w-3/4 md:mb-16">
          <div
            class="px-6 py-8 border rounded-lg bg-neutral-100 border-neutral-200 md:px-10 md:py-10"
          >
            <div
              class="prose cet-content max-w-none"
              v-html="contentHtml"
            ></div>
          </div>
        </div>

        <!-- Tiny loading fallback if visible but no content yet -->
        <div v-if="!contentHtml" class="m-5 text-sm text-center text-gray-500">
          Loading…
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFirestore, useDocument } from 'vuefire'
import { doc } from 'firebase/firestore'

definePageMeta({ layout: 'custom' })

const db = useFirestore()

// admission_sections > extra_section_1
const { data: section } = useDocument(
  doc(db, 'admission_sections', 'extra_section_1')
)

// Helper ref so template can use `sectionData` directly
const sectionData = computed(() => section.value || null)

const FALLBACK = '/images/default_about_cover.jpg'

// Title (admin-editable, else fallback)
const pageTitle = computed(() => {
  const t = section.value?.title as string | undefined
  return t && t.trim().length ? t : 'Extra Section'
})

// Cover image
const coverImage = computed(
  () => section.value?.coverImageUrl || FALLBACK
)

// Rich text HTML
const contentHtml = computed(
  () => (section.value?.content as string | undefined) || ''
)

// Optional video
const hasVideo = computed(() => !!section.value?.videoUrl)

// Visibility flag (default visible)
const isVisible = computed(() => section.value?.isVisible !== false)

// YouTube embed conversion
function getYoutubeEmbedUrl(url: string): string {
  try {
    const videoId = new URL(url).searchParams.get('v')
    return `https://www.youtube.com/embed/${videoId}`
  } catch (e) {
    console.error('Invalid YouTube URL:', url)
    return ''
  }
}
</script>