// composables/useDepartmentFacultyStaff.ts
import { ref, onMounted, watch } from 'vue'
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  arrayRemove,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// 👇 describe what a user looks like (at least the fields we care about)
interface DeptUser {
  id: string
  name: string
  role?: string
  [key: string]: any // allow extra Firestore fields
}

export function useDepartmentFacultyStaff() {
  const db = getFirestore()
  const auth = getAuth()

  const departmentId = ref<string | null>(null)
  const departmentHead = ref<any | null>(null)
  const departmentStaff = ref<any[]>([])
  const personnelCoverUrl = ref('')

  // 👇 use the typed user array
  const users = ref<DeptUser[]>([])

  const selectedProfile = ref<any | null>(null)
  const showProfilePreviewModal = ref(false)

  const showDelete = ref(false)
  const busy = ref(false)
  const profilePendingDelete = ref<any | null>(null)

  /* ---------- helpers ---------- */

  const buildMergedProfile = (profile: any, user: DeptUser | undefined) => {
    if (!user) return profile

    return {
      ...profile,
      // identity
      fullName: profile.fullName || profile.name || user.fullName || user.name || '',
      name: profile.name || user.fullName || user.name || profile.fullName || '',
      photo: (user as any).photo ?? profile.photo,

      // academics / contact
      specialization: (user as any).specialization ?? profile.specialization ?? '',
      contact: (user as any).contact ?? profile.contact ?? '',
      personalEmail: (user as any).personalEmail ?? profile.personalEmail ?? '',
      educationHtml:
        (user as any).educationHtml ??
        (user as any).education ??
        profile.educationHtml ??
        profile.education ??
        '',
      websites: (user as any).websites ?? profile.websites ?? [],

      // misc
      memberType: (user as any).memberType ?? profile.memberType,
      homeDepartment: (user as any).homeDepartment ?? profile.homeDepartment,
      designation: (user as any).designation ?? profile.designation,
    }
  }

  /* ---------- subscriptions ---------- */

  const subscribeDepartmentDoc = () => {
    if (!departmentId.value) return
    const depRef = doc(db, 'departments', departmentId.value)
    onSnapshot(depRef, (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      departmentHead.value = data.headAdmin || null
      departmentStaff.value = data.staff || []
      personnelCoverUrl.value = data.personnelCoverUrl || ''
    })
  }

  const subscribeUsers = () => {
    const usersRef = collection(db, 'users')
    onSnapshot(usersRef, (snap) => {
      const mapped: DeptUser[] = snap.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          ...data,
          name: data.fullName || 'Unnamed',
        }
      })

      // ✅ now TS knows `role` exists (optional) on DeptUser
      users.value = mapped.filter((u) => u.role !== 'Super Admin')
    })
  }

  // keep cover image in sync with Firestore
  watch(personnelCoverUrl, async (newUrl) => {
    if (!departmentId.value) return
    const depRef = doc(db, 'departments', departmentId.value)
    await updateDoc(depRef, { personnelCoverUrl: newUrl || '' })
  })

  /* ---------- actions ---------- */

  const showProfilePreview = async (profile: any) => {
    const user = users.value.find((u) => u.id === profile.id)
    selectedProfile.value = buildMergedProfile(profile, user)
    showProfilePreviewModal.value = true
  }

  const closeProfilePreviewModal = () => {
    showProfilePreviewModal.value = false
    selectedProfile.value = null
  }

  const openDeleteModal = (profile: any) => {
    profilePendingDelete.value = profile
    showDelete.value = true
  }

  const removeUserFromDepartment = async (user: any) => {
    if (!departmentId.value) return

    const depRef = doc(db, 'departments', departmentId.value)
    const depSnap = await getDoc(depRef)
    if (!depSnap.exists()) return

    const data = depSnap.data()
    const updates: any = {}

    if (data.headAdmin?.id === user.id) {
      updates.headAdmin = null
    } else {
      updates.staff = (data.staff || []).filter((s: any) => s.id !== user.id)
    }

    await updateDoc(depRef, updates)

    const userRef = doc(db, 'users', user.id)
    await updateDoc(userRef, {
      departments: arrayRemove(departmentId.value),
    })
  }

  const doDelete = async () => {
    if (!profilePendingDelete.value) return
    busy.value = true
    try {
      await removeUserFromDepartment(profilePendingDelete.value)
      showDelete.value = false
      showProfilePreviewModal.value = false
      profilePendingDelete.value = null
      alert('Member has been removed from the department.')
    } catch (err) {
      console.error('Failed to remove user from Department roles', err)
    } finally {
      busy.value = false
    }
  }

  /* ---------- init ---------- */

  const init = async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const userRef = doc(db, 'users', currentUser.uid)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return

    departmentId.value = (userSnap.data() as any).departmentId || null
    if (!departmentId.value) return

    subscribeDepartmentDoc()
    subscribeUsers()
  }

  onMounted(init)

  return {
    // state
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

    // actions
    showProfilePreview,
    closeProfilePreviewModal,
    openDeleteModal,
    doDelete,
    removeUserFromDepartment,
  }
}
