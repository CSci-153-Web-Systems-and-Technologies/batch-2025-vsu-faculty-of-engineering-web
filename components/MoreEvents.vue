<template>
  <div class="h-auto pb-6 border bg-neutral-50 rounded-xl">
    <!-- Header -->
    <div class="pt-4 pb-4 mx-auto text-white bg-red-900 rounded-t-xl">
      <div class="flex items-center justify-center text-lg font-semibold">
        <span class="ml-2 text-3xl font-semibold text-center font-montserrat">
          Recents
        </span>
      </div>
    </div>

    <!-- List -->
    <div v-if="oldEvents.length" class="mt-6">
      <ul class="pl-6 pr-6 mt-6 space-y-2">
        <li
          v-for="ev in oldEvents"
          :key="ev.id"
          class="border-b"
        >
          <UiButton
            @click="readMore(ev.id)"
            class="text-sm bg-transparent hover:bg-transparent hover:scale-105 font-medium text-center text-gray-800 truncate hover:text-red-900"
          >
            <!-- 🔹 Only the title now, no date shown -->
           
              {{ ev.title }}
            
          </UiButton>
        </li>
      </ul>

      <!-- See all (desktop) -->
      <div class="hidden mt-4 md:flex md:justify-end mr-5">
        <UiButton
          @click="goToMore"
          class="text-sm font-semibold text-white bg-red-900 hover:bg-red-950 hover:scale-105"
        >
          {{ props.seeAllLabel }} →
        </UiButton>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="px-6 py-8 text-center text-gray-500">
      <p>No additional items to display</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Timestamp } from 'firebase/firestore'

type EventDate = Timestamp | Date | string | number | null | undefined

export interface EventRecord {
  id: string
  title: string
  createdAt?: EventDate
  date?: EventDate
  status?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    items: EventRecord[]
    maxOldItems?: number
    seeAllLabel?: string
    seeAllRoute?: string
    itemRouteBase?: string
    /** 🔹 current type filter coming from index.vue */
    currentType?: string
  }>(),
  {
    maxOldItems: 10,
    seeAllLabel: '',
    seeAllRoute: '/events/moreEvents',
    itemRouteBase: '/events',
    currentType: 'all',
  },
)

const router = useRouter()

// 🔹 Convert various date formats to milliseconds
function msFrom(value: EventDate): number {
  if (!value && value !== 0) return 0
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') return new Date(value).getTime()

  if (
    typeof value === 'object' &&
    value &&
    'toDate' in value &&
    typeof (value as any).toDate === 'function'
  ) {
    return (value as Timestamp).toDate().getTime()
  }

  return 0
}

// 🔹 Only keep published items
const isPublishedStatus = (value: any) =>
  String(value || '').toLowerCase().trim() === 'published'

// 🔹 Sort items from latest → oldest using createdAt ?? date
const sortedByDateDesc = computed(() =>
  [...props.items]
    .filter((item: any) => isPublishedStatus(item.status))
    .sort((a, b) => {
      const aTime = msFrom(a.createdAt ?? a.date)
      const bTime = msFrom(b.createdAt ?? b.date)
      return bTime - aTime // DESC
    }),
)

const oldEvents = computed(() =>
  sortedByDateDesc.value.slice(0, props.maxOldItems),
)

function readMore(id: string) {
  router.push(`${props.itemRouteBase}/${id}`)
}

function goToMore() {
  const type = props.currentType ?? 'all'

  if (!props.seeAllRoute) return

  if (type === 'all') {
    router.push(props.seeAllRoute)
  } else {
    router.push({
      path: props.seeAllRoute,
      query: { type },
    })
  }
}
</script>

<style>
  /* *{
    outline: 1px solid red;
  } */
</style>
