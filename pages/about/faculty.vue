<template>
  <main class="mb-4 bg-white">
    <!-- Header with dynamic cover image -->
    <div class="relative flex items-center w-full font-playfair">
      <img
        :src="aboutData?.coverImageUrl || '/images/fallback.jpg'"
        alt="The College Cover"
        class="object-cover w-full h-44 md:h-128"
      />
      <div
        class="absolute left-6 top-16 bg-gray-700/90 px-2 py-2 md:left-[120px] md:top-40 md:px-4 md:py-4"
      >
        <span class="text-xl text-white md:text-6xl">The Faculty</span>
      </div>
    </div>

    <!-- Main Content Container -->
    <!-- space-y-* only applies if both video + content exist -->
    <div class="w-full h-auto mx-auto mt-10 space-y-6 md:w-3/4 md:space-y-8">
      <!-- ✅ Video Section is rendered ONLY if there is a videoUrl -->
      <div
        v-if="hasVideo"
        class="w-full h-auto p-2 rounded-xl md:mx-auto md:h-128 md:w-3/4"
      >
        <!-- YouTube Embed -->
        <iframe
          v-if="aboutData?.videoUrl && aboutData.videoUrl.includes('youtube.com')"
          :src="getYoutubeEmbedUrl(aboutData.videoUrl)"
          frameborder="0"
          allowfullscreen
          class="w-full h-56 rounded-md object-fit md:h-full"
        ></iframe>

        <!-- Fallback for direct video URLs (e.g., .mp4 from Firebase Storage) -->
        <video
          v-else
          :src="aboutData?.videoUrl"
          controls
          preload="auto"
          playsinline
          class="object-cover w-full h-56 rounded-md md:h-full"
        ></video>
      </div>

      <!-- Rich Text Content with grey bar -->
      <!-- w-11/12 on mobile so it doesn't touch the sides -->
      <div class="w-11/12 mx-auto md:w-3/4 ">
        <div
          class="px-6 py-8 border rounded-lg bg-neutral-50 border-neutral-200 md:px-10 md:py-10"
        >
          <div
            class="prose cet-content max-w-none"
            v-html="aboutData?.content"
          ></div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { doc } from 'firebase/firestore'
import { useDocument, useFirestore } from 'vuefire'

const db = useFirestore()

// about_sections > the_college
const { data: aboutData } = useDocument(
  doc(db, 'about_sections', 'the_college'),
)

// ✅ true only when there is a video URL
const hasVideo = computed(() => !!aboutData.value?.videoUrl)

// Convert normal YouTube links to embed format
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

<script lang="ts">
definePageMeta({
  layout: 'custom',
})
</script>