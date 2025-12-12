// composables/useCollegeFacultyStaff.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { useFirestore } from 'vuefire'
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  type Unsubscribe,
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

/** Safe stringify for shallow/deep compare */
const stableStringify = (v: any) => JSON.stringify(v ?? null)

/** Remove any keys whose value is undefined (deep). Firestore rejects undefined. */
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {

    return value.map(stripUndefinedDeep) as T
  }

  if (value && typeof value === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(value as any)) {
      if (v === undefined) continue
      out[k] = stripUndefinedDeep(v)
    }
    return out
  }

  return value
}

/**
 * Merge entry with latest user data AND return {changed}
 * so we only write when something is really different.
 */
const syncUserData = (entry: any, updatedUsers: CollegeUser[]) => {
  if (!entry?.id) return { merged: entry, changed: false }

  const matchedUser = updatedUsers.find((u) => u.id === entry.id)
  if (!matchedUser) return { merged: entry, changed: false }

  // Build merged payload (avoid introducing undefined)
  const merged = {
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

    // contact details
    contact: matchedUser.contact || entry.contact,
    personalEmail: matchedUser.personalEmail || entry.personalEmail,

    // misc
    websites: matchedUser.websites || entry.websites,
    status: matchedUser.status ?? entry.status,
    memberType: matchedUser.memberType || entry.memberType,
    homeDepartment: matchedUser.homeDepartment || entry.homeDepartment,
  }

  // Clean undefined before compare too (keeps compare stable)
  const cleanedMerged = stripUndefinedDeep(merged)
  const cleanedEntry = stripUndefinedDeep(entry)

  const changed =
    stableStringify(cleanedMerged) !== stableStringify(cleanedEntry)

  return { merged: cleanedMerged, changed }
}

const buildMergedProfile = (
  profile: any,
  user: CollegeUser | undefined,
  extra: any = {},
) => {
  // IMPORTANT: never return undefined fields (Firestore + UI safety)
  return stripUndefinedDeep({
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
  })
}

export function useCollegeFacultyStaff() {
  // ✅ VueFire instance (Nuxt-friendly)
  const db = useFirestore()

  const collegeDean = ref<any | null>(null)
  const collegeSecretary = ref<any | null>(null)
  const departmentHeads = ref<any[]>([])
  const adminStaff = ref<any[]>([])
  const users = ref<CollegeUser[]>([])

  const selectedProfile = ref<any | null>(null)
  const showProfilePreviewModal = ref(false)

  // Unsubscribe handles (avoid duplicated listeners on navigation)
  let unsubCollege: Unsubscribe | null = null
  let unsubUsers: Unsubscribe | null = null

  // Prevent re-entrant syncing (write spam)
  let syncing = false

  /* ---------- Subscriptions (college-wide doc + users) ---------- */

  const subscribeCollegeFacultyStaff = () => {
    const docRef = doc(db, 'college_faculty_staff', 'college-wide')

    unsubCollege = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) return
        const data = docSnap.data()

        collegeDean.value = data.collegeDean || null
        collegeSecretary.value = data.collegeSecretary || null
        departmentHeads.value = data.departmentHeads || []
        adminStaff.value = data.adminStaff || []
      },
      (err) => {
        // ✅ you will finally see the REAL snapshot error
        console.error('[college-wide snapshot error]', err)
      },
    )
  }

  const subscribeUsersAndSyncCollege = () => {
    const usersCollection = collection(db, 'users')

    unsubUsers = onSnapshot(
      usersCollection,
      async (snapshot) => {
        if (syncing) return
        syncing = true

        try {
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
          const updates: Record<string, any> = {}
          let anyChanged = false

          // Dean
          if (collegeData.collegeDean?.id) {
            const { merged, changed } = syncUserData(
              collegeData.collegeDean,
              updatedUsers,
            )
            if (changed) {
              updates.collegeDean = merged
              anyChanged = true
            }
          }

          // Secretary
          if (collegeData.collegeSecretary?.id) {
            const { merged, changed } = syncUserData(
              collegeData.collegeSecretary,
              updatedUsers,
            )
            if (changed) {
              updates.collegeSecretary = merged
              anyChanged = true
            }
          }

          // Department Heads
          if (Array.isArray(collegeData.departmentHeads)) {
            let changedHeads = false
            const mergedHeads = collegeData.departmentHeads.map((entry: any) => {
              const res = syncUserData(entry, updatedUsers)
              if (res.changed) changedHeads = true
              return res.merged
            })

            // Only write if truly different
            if (
              changedHeads &&
              stableStringify(stripUndefinedDeep(mergedHeads)) !==
                stableStringify(stripUndefinedDeep(collegeData.departmentHeads))
            ) {
              updates.departmentHeads = stripUndefinedDeep(mergedHeads)
              anyChanged = true
            }
          }

          // Admin Staff
          if (Array.isArray(collegeData.adminStaff)) {
            let changedStaff = false
            const mergedStaff = collegeData.adminStaff.map((entry: any) => {
              const res = syncUserData(entry, updatedUsers)
              if (res.changed) changedStaff = true
              return res.merged
            })

            if (
              changedStaff &&
              stableStringify(stripUndefinedDeep(mergedStaff)) !==
                stableStringify(stripUndefinedDeep(collegeData.adminStaff))
            ) {
              updates.adminStaff = stripUndefinedDeep(mergedStaff)
              anyChanged = true
            }
          }

          // ✅ sanitize updates before writing (Firestore rejects undefined anywhere)
          const cleanedUpdates = stripUndefinedDeep(updates)

          // ✅ Only hit Firestore if something actually changed AND still has fields
          if (anyChanged && Object.keys(cleanedUpdates).length > 0) {
            await updateDoc(collegeDocRef, cleanedUpdates)
          }
        } catch (err) {
          // ✅ if it’s permissions / undefined / quota, it will show here
          console.error('[college-wide sync update error]', err)
        } finally {
          syncing = false
        }
      },
      (err) => {
        // ✅ you will see the REAL users snapshot error
        console.error('[users snapshot error]', err)
      },
    )
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
    const updates: Record<string, any> = {}

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

    const cleanedUpdates = stripUndefinedDeep(updates)

    if (Object.keys(cleanedUpdates).length > 0) {
      await updateDoc(collegeDocRef, cleanedUpdates)
    }
  }

  /* ---------- Auto-init on mount ---------- */

  onMounted(() => {
    // ✅ In Nuxt SSR, Firestore should only run on client
    if (!import.meta.client) return

    subscribeCollegeFacultyStaff()
    subscribeUsersAndSyncCollege()
  })

  onUnmounted(() => {
    // ✅ prevent multiple listeners when page/component is revisited
    unsubCollege?.()
    unsubUsers?.()
    unsubCollege = null
    unsubUsers = null
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
