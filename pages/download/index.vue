<template>
  <main class="bg-white">
     <div class="relative flex items-center w-full font-playfair">
      <img
        :src="coverImageUrl"
        alt="Offices and Administration cover"
        class="object-cover w-full h-44 md:h-128"
      />
      <div
        class="absolute top-16 md:top-40 left-6 md:left-[120px] md:px-4 md:py-4 px-2 py-2 bg-red-900/80"
      >
        <span class="text-xl text-white md:text-6xl">Download</span>
      </div>
    </div>
    <div class="max-w-5xl px-4 py-8 mx-auto">
      <!-- Page title -->
      <div class="mx-auto mt-8 text-center md:mb-8">
      <span
        class="text-2xl font-extrabold tracking-wide text-red-900 uppercase font-playfair md:text-5xl"
      >
        FACULTY DOWNLOADS
      </span>
    </div>
  
      <!-- Empty / loading states -->
      <div v-if="!downloads" class="p-6 text-gray-500 bg-white border rounded">
        Loading downloads…
      </div>
      <div v-else-if="downloads.length === 0" class="p-10 text-center text-gray-500 bg-white border rounded">
        No downloads yet.
      </div>
  
      <!-- List all download entries -->
      <div v-else class="space-y-8">
        <article
          v-for="item in downloads"
          :key="item.id"
          class="p-5 bg-white border rounded-lg shadow-sm"
        >
          <!-- Title -->
          <span class="text-2xl font-bold text-red-900">
            {{ item.title }}
          </span>
  
          <!-- Byline -->
          <div class="mt-1 text-sm text-gray-600">
            By {{ item.author || '—' }}
            <span class="mx-2 text-gray-300">•</span>
            {{ formatDate(item.createdAt) }}
          </div>
  
          <!-- Rich content (tables/links) -->
          <div class="mt-4 prose max-w-none">
            <!-- force links to open in a new tab -->
            <div v-html="externalizedLinks(item.content)"></div>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
/**
 * Public Downloads page
 * - Lists all docs from `downloads` (no read-more).
 * - Renders stored HTML (tables/links) with nice styles.
 */
import { useFirestore, useCollection } from 'vuefire'
import { collection, orderBy, query, Timestamp, doc, onSnapshot } from 'firebase/firestore'
definePageMeta({
    layout: 'custom',
})
const db = useFirestore()
const q = query(collection(db, 'downloads'), orderBy('createdAt', 'desc'))
const downloads = useCollection(q)
const coverImageUrl = ref('/images/cet_administration.jpg')

// 🔹 Fetch cover image from Firestore: page_covers / office_admin
const fetchCoverImage = () => {
  const coverRef = doc(db, 'page_covers', 'downloads')
  onSnapshot(coverRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data()
      coverImageUrl.value =
        data.coverImageUrl || data.imageUrl || coverImageUrl.value
    }
  })
}
onMounted(() => {
  fetchCoverImage()
})

/** Friendly date */
function formatDate(ts?: Timestamp) {
  try {
    if (!ts) return '—'
    return ts.toDate().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
  } catch {
    return '—'
  }
}

/** Ensure all anchors open in a new tab and are safe */
function externalizedLinks(html = '') {
  return html.replaceAll('<a ', '<a target="_blank" rel="noopener" ')
}
</script>

<!-- <style scoped>
/* fallback if your utility isn't globally present */
.text-maroon { color: #740505; }

/* Tidy prose & table styling for rendered content */
:deep(.prose a) {
  color: #740505;
  text-decoration: underline;
  cursor: pointer;
}
:deep(.prose a:hover) {
  text-underline-offset: 2px;
  text-decoration-thickness: 2px;
}

/* Tables from the editor */
:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
}
:deep(.prose th),
:deep(.prose td) {
  border: 1px solid #e5e7eb; /* gray-200 */
  padding: 8px;
  vertical-align: top;
}
:deep(.prose thead th) {
  background: #f9fafb; /* gray-50 */
  font-weight: 700;
  text-align: left;
}

/* Make selections inside tables subtle (prevents “all blue” look) */
:deep(.prose ::selection) { background: rgba(160,195,255,.28); }

/* If your editor left any TipTap selection classes, keep them unobtrusive here */
:deep(.prose .selectedCell) { background: transparent; }
:deep(.prose .selectedCell::after) { content: none; }
</style> -->