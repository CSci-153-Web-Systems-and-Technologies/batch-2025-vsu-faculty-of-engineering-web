<template>
  <main class="p-8">
    <!-- Page title -->
    <div class="flex flex-col">
      <span class="text-4xl font-bold text-red-900 font-montserrat">
        Department Faculty & Staff Management
      </span>
      <span class="text-xs font-montserrat">
        Manage faculty and staff members within the department
      </span>
    </div>

    <!-- Cover image manager -->
    <DeptCoverImageUpload
      v-if="departmentId"
      v-model="personnelCoverUrl"
      :storage-path="`departments/${departmentId}/faculty_staff_cover`"
    />

    <!-- Add Faculty/Staff Button -->
    <div class="flex justify-end">
      <UiButton
        @click="showAddModal = true"
        class="px-4 py-2 text-white bg-red-900 rounded shadow hover:bg-red-800 hover:scale-105"
      >
        <UserPlus class="size-5" />
        Add Faculty and Staff
      </UiButton>
    </div>

    <!-- Department Head Section -->
    <div class="mt-8" v-if="departmentHead">
      <span class="text-xl font-bold font-trajan">Department Head</span>
      <div class="grid grid-cols-3 mt-3 mb-10 gap-x-6">
        <div
          class="flex justify-start h-32 pl-4 space-x-6 text-black rounded shadow-xl cursor-pointer bg-neutral-100"
          @click="showProfilePreview(departmentHead)"
        >
          <div class="flex items-center">
            <img
              :src="departmentHead?.photo || '/placeholder.png'"
              alt="Department Head"
              class="object-cover rounded-full size-28"
            />
          </div>
          <div class="flex flex-col items-start justify-center">
            <p class="text-lg font-semibold font-montserrat">
              {{ departmentHead ? departmentHead.name : 'No Head Assigned' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff Section -->
    <span class="text-xl font-bold font-trajan">Staff</span>
    <div
      class="grid grid-cols-3 mt-3 mb-10 gap-y-6 gap-x-6"
      v-if="departmentStaff.length"
    >
      <div
        v-for="staff in departmentStaff"
        :key="staff.id"
        class="flex justify-start h-32 pl-4 space-x-6 text-black rounded shadow-xl cursor-pointer bg-neutral-100"
        @click="showProfilePreview(staff)"
      >
        <div class="flex items-center">
          <img
            :src="staff.photo || '/placeholder.png'"
            alt="Staff"
            class="object-cover rounded-full size-28"
          />
        </div>
        <div class="flex flex-col items-start justify-center">
          <p class="text-lg font-semibold font-montserrat">
            {{ staff ? staff.name : 'No Staff Assigned' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Profile Preview Modal -->
    <ProfilePreviewModal
      v-if="showProfilePreviewModal"
      :profile="selectedProfile"
      :showDelete="true"
      @close="closeProfilePreviewModal"
      @remove="removeUserFromDepartment"
      @request-delete="openDeleteModal"
    />

    <!-- Delete confirmation modal -->
    <UiModal v-if="showDelete" @close="showDelete = false">
      <template #header>Delete member</template>
      <template #default>
        Are you sure you want to remove
        <strong>{{ profilePendingDelete?.name }}</strong>
        from this department? This will unassign their department role and
        cannot be undone here.
      </template>
      <template #footer>
        <UiButton class="bg-gray-200" @click="showDelete = false">
          Cancel
        </UiButton>
        <UiButton
          class="text-white bg-red-600"
          :disabled="busy"
          @click="doDelete"
        >
          <span v-if="busy">Removing…</span>
          <span v-else>Delete</span>
        </UiButton>
      </template>
    </UiModal>

    <!-- Add Faculty/Staff Modal -->
    <HeadFacultyModal
      :show="showAddModal"
      :department-id="departmentId || ''"
      :users="users"
      :designations="designations"
      @close="showAddModal = false"
      @added="onMemberAdded"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProfilePreviewModal from '@/components/ProfilePreviewModal.vue'
import HeadFacultyModal from '@/components/Admin/HeadFacultyModal.vue'
import DeptCoverImageUpload from '@/components/Admin/DeptCoverImageUpload.vue'
import { UserPlus } from 'lucide-vue-next'
import { useDepartmentFacultyStaff } from '@/composables/useDepartmentFacultyStaff'

definePageMeta({
  middleware: 'auth',
  layout: 'head-admin',
})

/**
 * Composable handles:
 * - figuring out departmentId from current user
 * - subscribing to department doc (head + staff + cover image)
 * - subscribing to users collection
 * - merging profile data for preview
 * - delete flow (openDeleteModal / doDelete / removeUserFromDepartment)
 */
const {
  departmentId,
  departmentHead,
  departmentStaff,
  personnelCoverUrl,
  users,

  selectedProfile,
  showProfilePreviewModal,

  showDelete,
  busy,
  profilePendingDelete,

  showProfilePreview,
  closeProfilePreviewModal,
  openDeleteModal,
  doDelete,
  removeUserFromDepartment,
} = useDepartmentFacultyStaff()

// Local UI state
const showAddModal = ref(false)

/** Designations passed to the modal (edit as needed) */
const designations = [
  'Instructor I',
  'Instructor II',
  'Instructor III',
  'Assistant Professor I',
  'Assistant Professor II',
  'Assistant Professor III',
  'Assistant Professor IV',
  'Associate Professor I',
  'Associate Professor II',
  'Associate Professor III',
  'Associate Professor IV',
  'Associate Professor V',
  'Professor I',
  'Professor II',
  'Professor III',
  'Part-time Instructor',
]


const onMemberAdded = () => {
  showAddModal.value = false
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
