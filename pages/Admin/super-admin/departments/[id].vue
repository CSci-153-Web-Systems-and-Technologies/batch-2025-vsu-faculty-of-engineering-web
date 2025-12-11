<template>
  <div class="p-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-maroon">
        {{ departmentName }} - Degree Programs
      </h1>

      <!-- Edit Toggle -->
      <button
        @click="toggleEditMode"
        class="flex items-center space-x-2 rounded border px-4 py-2 text-white"
        :class="editMode ? 'bg-red-500 hover:bg-red-600' : 'bg-maroon hover:bg-red-600'"
      >
        <Pen class="h-5 w-5" />
        <span>{{ editMode ? 'Done' : 'Edit' }}</span>
      </button>
    </div>

    <!-- 🧑 Department Head Display -->
    <div class="mb-6 flex items-center justify-between rounded bg-white p-4 shadow">
      <div class="flex items-center space-x-4">
        <img
          :src="departmentHead?.photo || '/placeholder.png'"
          alt="Head Admin"
          class="h-12 w-12 rounded-full object-cover"
        />
        <div>
          <p class="font-semibold">
            {{ departmentHead?.email || 'No Head Admin Assigned' }}
          </p>
          <span
            class="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
          >
            Department Head
          </span>
        </div>
      </div>
      <div class="flex space-x-2">
        <button
          v-if="departmentHead"
          @click="removeHeadAdmin"
          class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Remove
        </button>
        <button
          @click="showAssignModal = true"
          class="rounded bg-maroon px-4 py-2 text-white hover:bg-red-700"
        >
          Assign
        </button>
      </div>
    </div>

    <!-- Add Degree Program -->
    <button
      @click="showAddModal = true"
      class="mb-4 rounded bg-maroon px-4 py-2 text-white hover:bg-red-600"
    >
      + Add Degree Program
    </button>

    <!-- Degree Program Table -->
    <div class="rounded bg-white shadow-md">
      <table class="w-full table-auto border-collapse text-left">
        <thead>
          <tr class="border-b bg-gray-100">
            <th class="px-6 py-4">Program Name</th>
            <th v-if="editMode" class="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="program in degreePrograms"
            :key="program.id"
            class="border-b hover:bg-gray-50"
          >
            <td class="flex items-center px-6 py-4">
              <span
                v-if="!program.editing"
                class="flex cursor-pointer items-center text-maroon hover:underline"
              >
                {{ program.name }}
                <button
                  v-if="editMode"
                  @click="program.editing = true"
                  class="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <Pen class="h-4 w-4" />
                </button>
              </span>
              <input
                v-else
                v-model="program.newName"
                class="w-full rounded border px-2 py-1"
                @keyup.enter="updateProgramName(program)"
                @blur="program.editing = false"
              />
            </td>
            <td v-if="editMode" class="px-6 py-4">
              <button
                @click="confirmDelete(program.id)"
                class="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Program Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="w-96 rounded bg-white p-6 shadow-lg">
        <h2 class="mb-4 text-lg font-bold">Add Degree Program</h2>
        <input
          v-model="newProgram"
          type="text"
          class="mb-4 w-full rounded border px-3 py-2"
          placeholder="Enter Program Name"
        />
        <div class="flex justify-end space-x-2">
          <button
            @click="showAddModal = false"
            class="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            @click="addDegreeProgram"
            class="rounded bg-maroon px-4 py-2 text-white hover:bg-red-600"
          >
            Add
          </button>
        </div>
      </div>
    </div>

    <!-- Assign Head Admin using shared AddFacultyStaffModal -->
    <AddFacultyStaffModal
      v-model:open="showAssignModal"
      :users="users"
      mode="assign-head-admin"
      :department-id="departmentId"
      @saved="fetchDegreePrograms"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Pen from '@/components/Icons/Pen.vue'
import AddFacultyStaffModal from '@/components/Admin/AddFacultyStaffModal.vue'
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  deleteDoc,
  addDoc,
} from 'firebase/firestore'

definePageMeta({
  middleware: ['auth'],
  roles: ['super_admin'],
  layout: 'super-admin',
})

const db = getFirestore()
const route = useRoute()
const departmentId = route.params.id



const departmentName = ref('')
const degreePrograms = ref([])
const departmentHead = ref(null)

const showAddModal = ref(false)
const showAssignModal = ref(false)
const newProgram = ref('')
const editMode = ref(false)

const users = ref([])

const fetchDegreePrograms = async () => {
  const deptRef = doc(db, 'departments', departmentId)
  const deptSnap = await getDoc(deptRef)
  const deptData = deptSnap.data()
  departmentName.value = deptData.name
  departmentHead.value = deptData.headAdmin || null

  const programsSnapshot = await getDocs(
    collection(db, 'departments', departmentId, 'degreePrograms'),
  )
  degreePrograms.value = programsSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    name: docSnap.data().name,
    editing: false,
    newName: docSnap.data().name,
  }))

  const usersSnapshot = await getDocs(collection(db, 'users'))
  users.value = usersSnapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter(
      (user) =>
        user.role !== 'Super Admin' && // exclude Super Admins
        user.isActive !== false, // only active users
    )
}

const addDegreeProgram = async () => {
  if (!newProgram.value.trim()) return
  await addDoc(collection(db, 'departments', departmentId, 'degreePrograms'), {
    name: newProgram.value,
  })
  newProgram.value = ''
  showAddModal.value = false
  fetchDegreePrograms()
}

const updateProgramName = async (program) => {
  if (!program.newName.trim() || program.newName === program.name) return
  await updateDoc(
    doc(db, 'departments', departmentId, 'degreePrograms', program.id),
    { name: program.newName },
  )
  program.name = program.newName
  program.editing = false
}

const confirmDelete = async (programId) => {
  if (!window.confirm('Are you sure you want to delete this program?')) return
  await deleteDoc(
    doc(db, 'departments', departmentId, 'degreePrograms', programId),
  )
  fetchDegreePrograms()
}

const toggleEditMode = () => {
  editMode.value = !editMode.value
}

const removeHeadAdmin = async () => {
  if (!departmentHead.value?.id) return

  const userRef = doc(db, 'users', departmentHead.value.id)
  await updateDoc(userRef, { role: 'Faculty', departmentId: null })
  await updateDoc(doc(db, 'departments', departmentId), { headAdmin: null })
  fetchDegreePrograms()
}

onMounted(fetchDegreePrograms)
</script>

<style scoped>
.text-maroon {
  color: #740505;
}
.bg-maroon {
  background-color: #740505;
}
</style>
