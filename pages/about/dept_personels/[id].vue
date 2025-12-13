<template>
  <!-- 🔁 Outer background is now white -->
  <div class="min-h-screen mb-4 bg-white">
    <!-- Cover image (uses department personnelCoverUrl with fallback) -->
    <div class="relative flex items-center w-full font-playfair">
      <img
        :src="coverImage"
        :alt="`${dept?.name || 'Department'} cover`"
        class="object-cover w-full h-44 md:h-128"
      />
      <div
        class="absolute top-16 md:top-40 left-6 md:left-[120px] md:px-4 md:py-4 bg-gray-700/90 px-2 py-2"
      >
        <span class="text-xl text-white md:text-6xl">
          {{ dept?.name || 'Department' }}
        </span>
      </div>
    </div>

    <!-- Main content wrapper: grey panel on white page -->
    <div class="flex justify-center w-full max-w-6xl px-4 mx-auto mt-12">
      <div
        class="w-full pt-8 pb-12 border border-gray-200 rounded-3xl bg-neutral-50 md:px-10"
      >
        <!-- Head Admin -->
        <div v-if="dept?.headAdmin" class="flex flex-col mb-12 text-center">
          <span
            class="mb-6 text-2xl font-bold text-green-950 md:text-5xl font-playfair"
          >
            Department Head
          </span>

          <div class="w-full mx-auto sm:w-96">
            <FacultyStaffCard
              :name="dept.headAdmin.fullName || dept.headAdmin.name"
              :photo="dept.headAdmin.photo"
              :line1="`Department Head – ${dept.name}`"
              :line2="dept.headAdmin.designation || 'No designation'"
              @click="openProfile(dept.headAdmin, 'Head Admin')"
            />
          </div>
        </div>

        <!-- Staff -->
        <div v-if="dept?.staff?.length" class="max-w-6xl text-center">
          <span
            class="mb-6 text-2xl font-bold text-center text-green-950 md:text-5xl font-playfair"
          >
            Faculty and Staff
          </span>

          <div class="grid grid-cols-2 gap-6 mt-6 md:grid-cols-3">
            <template v-for="(staff, index) in dept.staff" :key="index">
              <FacultyStaffCard
                v-if="staff.status === 'active'"
                :name="staff.fullName || staff.name"
                :photo="staff.photo"
                :line1="staff.designation || 'No designation'"
                @click="openProfile(staff, 'Staff')"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Modal -->
    <ProfilePreviewModal
      v-if="showModal"
      :profile="selectedProfile"
      @close="showModal = false"
    />
  </div>
</template>


<script setup lang="ts">
definePageMeta({
  layout: 'custom',
})

import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { doc } from 'firebase/firestore'
import { useDocument, useFirestore } from 'vuefire'
import ProfilePreviewModal from '@/components/ProfilePreviewModal.vue'
import FacultyStaffCard from '@/components/FacultyStaffCard.vue'

const route = useRoute()
const deptId = route.params.id as string
const db = useFirestore()

const { data: dept } = useDocument(doc(db, 'departments', deptId))

// ✅ Use personnelCoverUrl saved by Head Admin, fallback to old static image
const coverImage = computed(
  () =>
    (dept.value?.personnelCoverUrl as string | undefined) || '/CET Faculty.jpg',
)

const showModal = ref(false)
const selectedProfile = ref<any>(null)

function openProfile(profile: any, role: string) {
  selectedProfile.value = {
    ...profile,
    role,
    departmentName: dept.value?.name || '',
  }
  showModal.value = true
}
</script>

<style scoped>
.text-maroon {
  color: #740505;
}
.border-maroon {
  border-color: #740505;
}
</style>
