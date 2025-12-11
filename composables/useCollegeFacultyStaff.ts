// composables/useCollegeFacultyStaff.ts
import { ref, onMounted } from 'vue'
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
} from 'firebase/firestore'

/** Shape of a user doc we care about for college-wide display */
interface CollegeUser {
  id: string
  role?: string
  fullName?: string
  photo?: string
  email?: string
  specialization?: string
  education?: string
  educationHtml?: string
  websites?: string[]
  status?: any
  contact?: string
  personalEmail?: string
  memberType?: string
  homeDepartment?: string
  departmentId?: string
}

export function useCollegeFacultyStaff() {
  const db = getFirestore()

  const collegeDean = ref<any | null>(null)
  const collegeSecretary = ref<any | null>(null)
  const departmentHeads = ref<any[]>([])
  const adminStaff = ref<any[]>([])
  const users = ref<CollegeUser[]>([])

  const selectedProfile = ref<any | null>(null)
  const showProfilePreviewModal = ref(false)

  /* ---------- Helpers ---------- */

  const syncUserData = (entry: any, updatedUsers: CollegeUser[]) => {
    if (!entry?.id) return entry
    const matchedUser = updatedUsers.find((user) => user.id === entry.id)
    if (!matchedUser) return entry

    return {
      ...entry,
      // identity
      name: matchedUser.fullName || entry.name,
      fullName: matchedUser.fullName || entry.fullName || entry.name,

      photo: matchedUser.photo || entry.photo,
      email: matchedUser.email || entry.email,

      // academic info
      specialization: matchedUser.specialization || entry.specialization,
      education: matchedUser.education || entry.education,
      educationHtml:
        matchedUser.educationHtml ||
        matchedUser.education ||
        entry.educationHtml ||
        entry.education,

      // contact details ✅
      contact: matchedUser.contact || entry.contact,
      personalEmail: matchedUser.personalEmail || entry.personalEmail,

      // misc
      websites: matchedUser.websites || entry.websites,
      status: matchedUser.status ?? entry.status,
      memberType: matchedUser.memberType || entry.memberType,
      homeDepartment: matchedUser.homeDepartment || entry.homeDepartment,
    }
  }

  const buildMergedProfile = (
    profile: any,
    user: CollegeUser | undefined,
    extra: any = {},
  ) => {
    return {
      ...profile,
      ...extra,
      fullName: profile.fullName || profile.name || user?.fullName || '',
      name: profile.name || user?.fullName || profile.fullName || '',
      specialization: user?.specialization ?? profile.specialization ?? '',
      contact: user?.contact ?? profile.contact ?? '',
      personalEmail: user?.personalEmail ?? profile.personalEmail ?? '',
      educationHtml:
        user?.educationHtml ??
        user?.education ??
        profile.educationHtml ??
        profile.education ??
        '',
      websites: user?.websites ?? profile.websites ?? [],
      memberType: user?.memberType ?? profile.memberType,
      homeDepartment: user?.homeDepartment ?? profile.homeDepartment,
    }
  }

  /* ---------- Subscriptions (college-wide doc + users) ---------- */

  const subscribeCollegeFacultyStaff = () => {
    const docRef = doc(db, 'college_faculty_staff', 'college-wide')
    onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return
      const data = docSnap.data()
      collegeDean.value = data.collegeDean || null
      collegeSecretary.value = data.collegeSecretary || null
      departmentHeads.value = data.departmentHeads || []
      adminStaff.value = data.adminStaff || []
    })
  }

  const subscribeUsersAndSyncCollege = () => {
    const usersCollection = collection(db, 'users')

    onSnapshot(usersCollection, async (snapshot) => {
      const updatedUsers: CollegeUser[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CollegeUser, 'id'>),
      }))

      // expose to UI (for AddFacultyStaffModal, etc.)
      users.value = updatedUsers.filter((u) => u.role !== 'Super Admin')

      const collegeDocRef = doc(db, 'college_faculty_staff', 'college-wide')
      const collegeDoc = await getDoc(collegeDocRef)
      if (!collegeDoc.exists()) return

      const collegeData = collegeDoc.data()
      const updates: any = {}

      if (collegeData.collegeDean?.id) {
        updates.collegeDean = syncUserData(collegeData.collegeDean, updatedUsers)
      }

      if (collegeData.collegeSecretary?.id) {
        updates.collegeSecretary = syncUserData(
          collegeData.collegeSecretary,
          updatedUsers,
        )
      }

      if (Array.isArray(collegeData.departmentHeads)) {
        updates.departmentHeads = collegeData.departmentHeads.map((entry: any) =>
          syncUserData(entry, updatedUsers),
        )
      }

      if (Array.isArray(collegeData.adminStaff)) {
        updates.adminStaff = collegeData.adminStaff.map((entry: any) =>
          syncUserData(entry, updatedUsers),
        )
      }

      // Only hit Firestore if something actually changed
      if (Object.keys(updates).length > 0) {
        await updateDoc(collegeDocRef, updates)
      }
    })
  }

  /* ---------- Modal + preview logic ---------- */

  const showProfilePreview = async (profile: any) => {
    const user = users.value.find((u) => u.id === profile.id)

    // If Head Admin: attach department name
    if (user?.role === 'Head Admin' && user.departmentId) {
      try {
        const deptSnap = await getDoc(doc(db, 'departments', user.departmentId))
        if (deptSnap.exists()) {
          selectedProfile.value = buildMergedProfile(profile, user, {
            role: user.role,
            departmentName: deptSnap.data().name || '',
          })
        } else {
          selectedProfile.value = buildMergedProfile(profile, user)
        }
      } catch (err) {
        console.error('Error fetching department name:', err)
        selectedProfile.value = buildMergedProfile(profile, user)
      }
    } else {
      selectedProfile.value = buildMergedProfile(profile, user)
    }

    showProfilePreviewModal.value = true
  }

  const closeProfilePreviewModal = () => {
    showProfilePreviewModal.value = false
    selectedProfile.value = null
  }

  const removeUserFromCollege = async (user: any) => {
    const collegeDocRef = doc(db, 'college_faculty_staff', 'college-wide')
    const collegeDoc = await getDoc(collegeDocRef)
    if (!collegeDoc.exists()) return

    const collegeData = collegeDoc.data()
    const updates: any = {}

    if (collegeData.collegeDean?.id === user.id) {
      updates.collegeDean = null
    } else if (collegeData.collegeSecretary?.id === user.id) {
      updates.collegeSecretary = null
    } else if (
      Array.isArray(collegeData.departmentHeads) &&
      collegeData.departmentHeads.some((head: any) => head.id === user.id)
    ) {
      updates.departmentHeads = collegeData.departmentHeads.filter(
        (head: any) => head.id !== user.id,
      )
    } else if (
      Array.isArray(collegeData.adminStaff) &&
      collegeData.adminStaff.some((staff: any) => staff.id === user.id)
    ) {
      updates.adminStaff = collegeData.adminStaff.filter(
        (staff: any) => staff.id !== user.id,
      )
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(collegeDocRef, updates)
    }
  }

  /* ---------- Auto-init on mount ---------- */

  onMounted(() => {
    subscribeCollegeFacultyStaff()
    subscribeUsersAndSyncCollege()
  })

  return {
    // state
    collegeDean,
    collegeSecretary,
    departmentHeads,
    adminStaff,
    users,
    selectedProfile,
    showProfilePreviewModal,

    // actions
    showProfilePreview,
    closeProfilePreviewModal,
    removeUserFromCollege,
  }
}
