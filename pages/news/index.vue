<template>
  <main>
    <!-- Cover -->
    <div class="relative flex items-center w-full font-playfair">
      <img
        src="/images/cet.jpg"
        alt="Research Cover"
        class="object-cover w-full h-44 md:h-128"
      />
      <div
        class="absolute top-16 md:top-40 left-6 md:left-[120px] md:px-4 md:py-4 px-2 py-2 bg-red-900/80"
      >
        <span class="text-xl text-white md:text-6xl">News</span>
      </div>
    </div>

    <!-- Heading -->
    <div class="mx-auto mt-8 text-center md:mb-8">
      <span
        class="text-2xl font-extrabold tracking-wide text-red-900 uppercase font-playfair md:text-5xl"
      >
        Faculty News
      </span>
    </div>

    <div class="max-w-7xl px-4 pt-5 pb-8 mx-auto md:py-8 md:my-7">
      <!-- Wrapper for list + pagination -->
      <div v-if="totalNews > 0">
        <!-- News List -->
        <div
          class="grid grid-cols-1 gap-8 md:grid-cols-2"
        >
          <div
            v-for="news in paginatedNews"
            :key="news.id"
            class="flex flex-col p-6 space-y-4 bg-white border border-gray-200 shadow-xl rounded-xl h-full"
          >
            <!-- Title -->
            <h2 class="text-2xl font-bold text-maroon line-clamp-2">
              {{ news.title }}
            </h2>

            <!-- Author and Date -->
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span class="inline-flex items-center gap-1">
                <svg
                  class="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182l-9.56 9.56a4.5 4.5 0 0 1-1.636.975l-3.15.983.983-3.15a4.5 4.5 0 0 1 .975-1.636l9.206-9.206Z"
                  />
                </svg>
                Written by
                <span class="font-medium">
                  {{ news.author || 'Unknown' }}
                </span>
              </span>
              <span class="inline-flex items-center gap-1">
                <svg
                  class="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M8 7V3M16 7V3M4 11h16M5 21h14a2 2 0 0 0 2-2V7H3v12a2 2 0 0 0 2 2Z"
                  />
                </svg>
                Published:
                {{ formatDate(news.createdAt?.toDate?.()) }}
              </span>
            </div>

            <!-- Image + Description as growable middle content -->
            <div class="flex-1 space-y-3 overflow-hidden">
              <!-- Cover Image -->
              <img
                v-if="news.imageUrl"
                :src="news.imageUrl"
                class="object-cover w-full rounded cursor-pointer max-h-48"
                alt="News Cover Image"
                @click="openPhotoModal(news.imageUrl, news.title)"
              />

              <!-- Description (clamped) -->
              <p class="text-gray-700 text-justify line-clamp-3">
                {{ news.description }}
              </p>
            </div>

            <!-- Footer actions -->
            <div class="flex items-center justify-between pt-2">
              <UiButton
                @click="readMore(news.id)"
                class="inline-block px-2 py-1 text-xs font-semibold text-gray-800 transition bg-gray-200 rounded font-montserrat hover:scale-105 hover:bg-gray-300"
              >
                Read more...
              </UiButton>

              <ShareButton
                :item="{
                  id: news.id,
                  type: 'news',
                  title: news.title,
                  excerpt: news.description,
                }"
              />
            </div>
          </div>
        </div>

        <!-- Pagination (separate row, not part of grid) -->
        <div
          v-if="totalNews > PAGE_SIZE"
          class="flex flex-col items-center gap-10 mt-8"
        >
          <UiPagination
            v-model:page="currentPage"
            :total="totalNews"
            :items-per-page="PAGE_SIZE"
            :sibling-count="1"
            class="mx-auto"
          >
            <UiPaginationList
              v-slot="{ items }"
              class="gap-0 border rounded-lg"
            >
              <UiPaginationPrev
                class="h-full rounded-e-none"
                as-child
                icon="lucide:chevron-left"
              />
              <template v-for="(page, index) in items" :key="index">
                <UiPaginationItem
                  v-if="page.type === 'page'"
                  as-child
                  v-bind="page"
                >
                  <UiButton
                    class="size-9 rounded-none border-0 shadow-none data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground dark:bg-transparent dark:data-[selected=true]:bg-primary dark:data-[selected=true]:text-primary-foreground"
                    variant="outline"
                    size="icon-sm"
                  >
                    {{ page.value }}
                  </UiButton>
                </UiPaginationItem>
                <UiPaginationEllipsis
                  v-else-if="page.type === 'ellipsis'"
                  as-child
                  v-bind="page"
                  icon="lucide:ellipsis"
                />
              </template>
              <UiPaginationNext
                class="h-full rounded-s-none"
                as-child
                icon="lucide:chevron-right"
              />
            </UiPaginationList>
          </UiPagination>
        </div>
      </div>

      <!-- No news fallback -->
      <p v-else class="mt-10 text-center text-gray-500">
        No news found.
      </p>
    </div>

    <!-- 🔹 Photo modal should NOT be part of the grid -->
    <PhotoModal
      v-model="showPhotoModal"
      :src="photoModalSrc"
      :alt="photoModalAlt"
      @close="showPhotoModal = false"
    />
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'custom' })

import { ref, computed, watch } from 'vue'
import { useFirestore, useCollection } from 'vuefire'
import { collection, query, where, orderBy } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { UiButton } from '#components'

// 🔢 Pagination settings
const PAGE_SIZE = 4
const currentPage = ref(1)

// Firestore setup
const db = useFirestore()
const newsRef = collection(db, 'news')
const router = useRouter()

// Photo Modal state
const showPhotoModal = ref(false)
const photoModalSrc = ref('')
const photoModalAlt = ref('')

function openPhotoModal(src: string, alt?: string) {
  photoModalSrc.value = src
  photoModalAlt.value = alt || ''
  showPhotoModal.value = true
}

// Only show published, sorted by date descending
const newsQuery = query(
  newsRef,
  where('published', '==', true),
  orderBy('createdAt', 'desc'),
)

const newsCollection = useCollection(newsQuery)

// Transform documents with ID
const newsList = computed(
  () =>
    newsCollection.value?.map((doc: any) => ({
      ...doc,
      id: doc.id,
    })) ?? [],
)

// Total count
const totalNews = computed(() => newsList.value.length)

// Slice based on current page
const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return newsList.value.slice(start, start + PAGE_SIZE)
})

// Ensure currentPage stays valid if items change
watch(
  totalNews,
  (total) => {
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
    }
  },
)

// Optional: scroll to top on page change
watch(currentPage, () => {
  if (process.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

function readMore(id: string) {
  router.push(`/news/${id}`)
}

function formatDate(date: Date | undefined) {
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped>
.text-maroon {
  color: #740505;
}
.bg-maroon {
  background-color: #740505;
}
</style>
