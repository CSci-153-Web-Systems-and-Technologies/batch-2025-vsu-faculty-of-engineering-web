<template>
  <!-- 🔁 outer bg is now WHITE -->
  <main class="relative pb-4 bg-white">
    <!-- Hero / Cover -->
    <div class="relative flex items-center w-full border-b-2 font-playfair">
      <img
        :src="coverImageUrl"
        alt="Offices and Administration cover"
        class="object-cover w-full h-44 md:h-128"
      />
      <div
        class="absolute top-16 md:top-40 left-6 md:left-[120px] px-4 py-4 bg-gray-700/90"
      >
        <span class="text-xl text-white md:text-6xl">
          Offices and Administration
        </span>
      </div>
    </div>

    <!-- main content wrapper (now grey card on white bg) -->
    <div class="mx-auto mb-12 flex w-full max-w-6xl justify-center px-4">
      <div
        class="mt-10 w-full rounded-3xl bg-neutral-100 pb-12 pt-8 shadow-md border border-gray-200 md:mt-14 md:px-10"
      >
        <!-- Title -->
        <div class="pb-5 text-center font-playfair font-bold md:pt-2">
          <span class="block text-2xl text-red-900 md:text-5xl">
            FACULTY OF ENGINEERING
          </span>
          <span class="block text-xl text-gray-800 md:text-2xl">
            Management Committee and Staff
          </span>
        </div>

        <!-- College Dean Section -->
        <div
          v-if="collegeDean"
          class="mt-10 flex flex-col items-center justify-center space-y-4 md:mt-14"
        >
          <span
            class="text-xl font-roboto_condensed font-bold text-green-950 md:text-3xl"
          >
            COLLEGE DEAN
          </span>

          <div class="w-[min(56vw,320px)]">
            <FacultyStaffCard
              :name="collegeDean.name || 'No Dean Assigned'"
              :photo="collegeDean.photo"
              :line1="collegeDean.designation || 'College Dean'"
              @click="showProfilePreview(collegeDean)"
            />
          </div>
        </div>

        <!-- College Secretary Section -->
        <div
          v-if="collegeSecretary"
          class="mt-10 flex flex-col items-center justify-center space-y-4 md:mt-14"
        >
          <span
            class="text-xl font-roboto_condensed font-bold text-green-950 md:text-3xl"
          >
            COLLEGE SECRETARY
          </span>

          <div class="w-[min(56vw,320px)]">
            <FacultyStaffCard
              :name="collegeSecretary.name || 'No Secretary Assigned'"
              :photo="collegeSecretary.photo"
              :line1="collegeSecretary.designation || 'College Secretary'"
              @click="showProfilePreview(collegeSecretary)"
            />
          </div>
        </div>

        <!-- Department Heads Section -->
        <section
          v-if="departmentHeads.length"
          class="mt-12 w-full px-2 md:px-4"
        >
          <div class="mb-6 flex justify-center">
            <span
              class="text-xl font-roboto_condensed font-bold text-green-950 md:text-3xl"
            >
              DEPARTMENT HEADS
            </span>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FacultyStaffCard
              v-for="head in departmentHeads"
              :key="head.id"
              :name="head.name || 'No Head Assigned'"
              :photo="head.photo"
              :line1="head.designation || 'Department Head'"
              @click="showProfilePreview(head)"
            />
          </div>
        </section>

        <!-- Administrative Staff Section -->
        <section
          v-if="adminStaff.length"
          class="mt-12 w-full px-2 md:px-4"
        >
          <div class="mb-6 flex justify-center">
            <span
              class="text-xl font-roboto_condensed font-bold text-green-950 md:text-3xl"
            >
              ADMINISTRATIVE STAFF
            </span>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FacultyStaffCard
              v-for="staff in adminStaff"
              :key="staff.id"
              :name="staff.name || 'No Staff Assigned'"
              :photo="staff.photo"
              :line1="staff.subDesignation || 'N/A'"
              :line2="staff.designation || 'Administrative Staff'"
              @click="showProfilePreview(staff)"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- Profile preview modal -->
    <div v-if="showProfilePreviewModal">
      <profile-preview-modal
        :profile="selectedProfile"
        @close="closeProfilePreviewModal"
      />
    </div>
  </main>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { getFirestore, doc, onSnapshot } from 'firebase/firestore'
import FacultyStaffCard from '@/components/FacultyStaffCard.vue'
import ProfilePreviewModal from '@/components/ProfilePreviewModal.vue'

definePageMeta({
  layout: 'custom',
})

const db = getFirestore()

const coverImageUrl = ref('/images/cet_administration.jpg')

const collegeDean = ref(null)
const collegeSecretary = ref(null)
const departmentHeads = ref([])
const adminStaff = ref([])

const showProfilePreviewModal = ref(false)
const selectedProfile = ref(null)

// 🔹 Fetch cover image from Firestore: page_covers / office_admin
const fetchCoverImage = () => {
  const coverRef = doc(db, 'page_covers', 'office_admin')
  onSnapshot(coverRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data()
      coverImageUrl.value =
        data.coverImageUrl || data.imageUrl || coverImageUrl.value
    }
  })
}

// Fetch real-time faculty & staff data
const fetchCollegeFacultyStaff = () => {
  const docRef = doc(db, 'college_faculty_staff', 'college-wide')
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      collegeDean.value = data.collegeDean || null
      collegeSecretary.value = data.collegeSecretary || null
      departmentHeads.value = data.departmentHeads || []
      adminStaff.value = data.adminStaff || []
    }
  })
}

// Show profile preview modal
const showProfilePreview = (profile) => {
  selectedProfile.value = profile
  showProfilePreviewModal.value = true
}

// Close profile preview modal
const closeProfilePreviewModal = () => {
  showProfilePreviewModal.value = false
  selectedProfile.value = null
}

onMounted(() => {
  fetchCoverImage()
  fetchCollegeFacultyStaff()
})
</script>
