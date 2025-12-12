<template>
  <div class="p-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-maroon">
        {{ departmentName }} - Degree Programs
      </h1>

      <button
        @click="toggleEditMode"
        class="flex items-center space-x-2 rounded border px-4 py-2 text-white transition"
        :class="editMode ? 'bg-red-500 hover:bg-red-600' : 'bg-maroon hover:bg-red-600'"
        type="button"
      >
        <Pen class="h-5 w-5" />
        <span>{{ editMode ? 'Done' : 'Edit' }}</span>
      </button>
    </div>

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
          <span class="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Department Head
          </span>
        </div>
      </div>

      <div v-if="editMode" class="flex space-x-2">
        <button
          v-if="departmentHead"
          @click="removeHeadAdmin"
          class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          type="button"
        >
          Remove
        </button>

        <button
          @click="showAssignModal = true"
          class="rounded bg-maroon px-4 py-2 text-white hover:bg-red-700"
          type="button"
        >
          Assign
        </button>
      </div>
    </div>

    <button
      v-if="editMode"
      @click="showAddModal = true"
      class="mb-4 rounded bg-maroon px-4 py-2 text-white hover:bg-red-600"
      type="button"
    >
      + Add Degree Program
    </button>

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
                  @click="startInlineEdit(program)"
                  class="ml-2 text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  <Pen class="h-4 w-4" />
                </button>
              </span>

              <input
                v-else
                v-model="program.newName"
                class="w-full rounded border px-2 py-1"
                @keyup.enter="updateProgramName(program)"
                @keyup.esc="cancelInlineEdit(program)"
                @blur="cancelInlineEdit(program)"
              />
            </td>

            <td v-if="editMode" class="px-6 py-4">
              <button
                @click="confirmDelete(program.id)"
                class="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                type="button"
              >
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="degreePrograms.length === 0">
            <td class="px-6 py-6 text-sm text-gray-500" :colspan="editMode ? 2 : 1">
              No degree programs found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showAddModal && editMode"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
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
            @click="closeAddModal"
            class="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
            type="button"
          >
            Cancel
          </button>
          <button
            @click="addDegreeProgram"
            class="rounded bg-maroon px-4 py-2 text-white hover:bg-red-600"
            type="button"
          >
            Add
          </button>
        </div>
      </div>
    </div>

    <AddFacultyStaffModal
      v-model:open="showAssignModal"
      :users="users"
      mode="assign-head-admin"
      :department-id="departmentId"
      @saved="refreshAll"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFirestore } from 'vuefire'
import Pen from '@/components/Icons/Pen.vue'
import AddFacultyStaffModal from '@/components/Admin/AddFacultyStaffModal.vue'
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  deleteDoc,
  addDoc,
  query,
  where,
  limit,
} from 'firebase/firestore'

definePageMeta({
  middleware: ['auth'],
  roles: ['super_admin'],
  layout: 'super-admin',
})

type DepartmentHead = {
  id?: string
  email?: string
  photo?: string
}

type DegreeProgramRow = {
  id: string
  name: string
  editing: boolean
  newName: string
}

type AppUser = {
  id: string        // Firestore document ID
  uid?: string      // Auth UID (stored in the "id" field in your docs)
  role?: string
  isActive?: boolean
  email?: string
  photo?: string
  departmentId?: string | null
  [key: string]: any
}

const db = useFirestore()
const route = useRoute()
const departmentId = String(route.params.id)

const departmentName = ref('')
const degreePrograms = ref<DegreeProgramRow[]>([])
const departmentHead = ref<DepartmentHead | null>(null)

const showAddModal = ref(false)
const showAssignModal = ref(false)
const newProgram = ref('')
const editMode = ref(false)

const users = ref<AppUser[]>([])

const fetchDepartmentAndPrograms = async () => {
  const deptRef = doc(db, 'departments', departmentId)
  const deptSnap = await getDoc(deptRef)

  if (!deptSnap.exists()) {
    departmentName.value = '(Department not found)'
    departmentHead.value = null
    degreePrograms.value = []
    return
  }

  const deptData = deptSnap.data() as any
  departmentName.value = String(deptData?.name || '')
  departmentHead.value = (deptData?.headAdmin || null) as DepartmentHead | null

  const programsSnapshot = await getDocs(
    collection(db, 'departments', departmentId, 'degreePrograms'),
  )

  degreePrograms.value = programsSnapshot.docs.map((d) => {
    const data = d.data() as any
    const name = String(data?.name || '')
    return { id: d.id, name, editing: false, newName: name }
  })
}

const fetchUsers = async () => {
  const snap = await getDocs(collection(db, 'users'))

  const mapped: AppUser[] = snap.docs.map((d) => {
    const data = d.data() as any
    return {
      ...data,
      id: d.id,
      uid: data?.id ?? data?.uid ?? undefined,
    }
  })

  users.value = mapped.filter((u) => u.role !== 'Super Admin' && u.isActive !== false)
}

const refreshAll = async () => {
  await Promise.all([fetchDepartmentAndPrograms(), fetchUsers()])
}

const closeAddModal = () => {
  showAddModal.value = false
  newProgram.value = ''
}

const addDegreeProgram = async () => {
  if (!editMode.value) return
  const name = newProgram.value.trim()
  if (!name) return

  await addDoc(collection(db, 'departments', departmentId, 'degreePrograms'), { name })

  closeAddModal()
  await fetchDepartmentAndPrograms()
}

const startInlineEdit = (program: DegreeProgramRow) => {
  if (!editMode.value) return
  program.editing = true
  program.newName = program.name
}

const cancelInlineEdit = (program: DegreeProgramRow) => {
  program.editing = false
  program.newName = program.name
}

const updateProgramName = async (program: DegreeProgramRow) => {
  if (!editMode.value) return
  const name = program.newName.trim()

  if (!name || name === program.name) {
    cancelInlineEdit(program)
    return
  }

  await updateDoc(doc(db, 'departments', departmentId, 'degreePrograms', program.id), {
    name,
  })

  program.name = name
  program.editing = false
}

const confirmDelete = async (programId: string) => {
  if (!editMode.value) return
  if (!window.confirm('Are you sure you want to delete this program?')) return

  await deleteDoc(doc(db, 'departments', departmentId, 'degreePrograms', programId))
  await fetchDepartmentAndPrograms()
}

const toggleEditMode = () => {
  editMode.value = !editMode.value

  if (!editMode.value) {
    showAddModal.value = false
    showAssignModal.value = false
    newProgram.value = ''
    degreePrograms.value = degreePrograms.value.map((p) => ({
      ...p,
      editing: false,
      newName: p.name,
    }))
  }
}

watch(editMode, (isOn) => {
  if (!isOn) showAssignModal.value = false
})

const resolveHeadUserDocId = async (): Promise<string | null> => {
  const head = departmentHead.value
  if (!head) return null

  const maybeDocId = head.id?.trim()
  if (maybeDocId) {
    const byDocId = await getDoc(doc(db, 'users', maybeDocId))
    if (byDocId.exists()) return maybeDocId

    const qUid = query(collection(db, 'users'), where('id', '==', maybeDocId), limit(1))
    const sUid = await getDocs(qUid)
    if (!sUid.empty) return sUid.docs[0].id
  }

  const email = head.email?.trim()
  if (email) {
    const qEmail = query(collection(db, 'users'), where('email', '==', email), limit(1))
    const sEmail = await getDocs(qEmail)
    if (!sEmail.empty) return sEmail.docs[0].id
  }

  return null
}

const removeHeadAdmin = async () => {
  if (!editMode.value) return
  if (!departmentHead.value) return
  if (!window.confirm('Remove this Head Admin?')) return

  const headUserDocId = await resolveHeadUserDocId()

  if (headUserDocId) {
    await updateDoc(doc(db, 'users', headUserDocId), {
      role: 'Faculty',
      departmentId: null,
    })
  }

  await updateDoc(doc(db, 'departments', departmentId), { headAdmin: null })

  await fetchDepartmentAndPrograms()
}

onMounted(refreshAll)
</script>

<style scoped>
.text-maroon {
  color: #740505;
}
.bg-maroon {
  background-color: #740505;
}
</style>
