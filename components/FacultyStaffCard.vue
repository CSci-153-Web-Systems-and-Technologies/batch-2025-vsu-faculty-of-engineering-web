<template>
  <div
    class="flex flex-col items-center justify-start p-2 md:p-6 bg-white rounded-lg shadow cursor-pointer transition hover:shadow-lg"
    @click="$emit('click')"
  >
    <img
      :src="photo || '/placeholder.png'"
      alt="Profile photo"
      class="mx-auto mb-4 size-24 rounded-full object-cover border-2 border-maroon"
    />

    <h3 class="text-lg font-semibold text-center text-maroon">
      {{ name }}
    </h3>

    <!-- First line under the name (e.g. Department Head – Geodetic Eng) -->
    <p
      v-if="line1"
      class="text-sm text-center text-gray-600"
    >
      {{ line1 }}
    </p>

    <!-- Second line (e.g. Assistant Professor I) -->
    <p
      v-if="line2"
      class="text-sm text-center text-gray-500"
    >
      {{ line2 }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  photo?: string
  line1?: string
  line2?: string
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<style scoped>
.text-maroon {
  color: #740505;
}
.border-maroon {
  border-color: #740505;
}
</style>
