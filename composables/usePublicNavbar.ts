// composables/usePublicNavbar.ts
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRoute, useRouter } from "#imports"
import { useCollection, useFirestore } from "vuefire"
import { collection, orderBy, query } from "firebase/firestore"

/**
 * Public navbar state + routing logic
 * Returns ALL fields used by components/Navbar/Main.vue
 */
export function usePublicNavbar() {
  const route = useRoute()
  const router = useRouter()

  // -----------------------------
  // Departments (Academics/About submenus)
  // -----------------------------
  const db = useFirestore()

  // Ensures each item has `id` field (used in v-for :key="dept.id")
  const departmentsData = useCollection(
    query(collection(db, "departments"), orderBy("name", "asc"))
  )

  const departments = computed(() =>
    departmentsData.value.map((doc: any) => ({ id: doc.id, ...doc }))
  )

  // -----------------------------
  // Search
  // -----------------------------
  const searchQuery = ref("")

  const submitSearch = async () => {
    const q = searchQuery.value.trim()
    if (!q) return

    // Adjust this route if your search page path differs
    await router.push({ path: "/search", query: { q } })
  }

  // -----------------------------
  // Optional dynamic menu items (placeholders with sane defaults)
  // If you already load these from Firestore, keep your loading logic
  // but DO NOT remove these refs/computeds or TS will break again.
  // -----------------------------
  const extra1Label = ref("Extra 1")
  const extra2Label = ref("Extra 2")
  const extra1Visible = ref(false)
  const extra2Visible = ref(false)

  const admExtra1Label = ref("Extra 1")
  const admExtra2Label = ref("Extra 2")
  const admExtra1Visible = ref(false)
  const admExtra2Visible = ref(false)

  // Undergrad toggle
  const undergradVisible = ref(true)

  // Computeds used in your template
  const admExtra1ShouldShow = computed(
    () => admExtra1Visible.value && !!admExtra1Label.value?.trim()
  )
  const admExtra2ShouldShow = computed(
    () => admExtra2Visible.value && !!admExtra2Label.value?.trim()
  )

  // -----------------------------
  // Tabs active state (fixes the yellow flashing / indicator mismatch)
  // Normalize trailing slashes and use startsWith for sub-routes.
  // -----------------------------
  const normalizedPath = computed(() => {
    const p = route.path.replace(/\/+$/, "")
    return p === "" ? "/" : p
  })

  const visualTab = computed(() => {
    const p = normalizedPath.value

    if (p === "/") return "home"
    if (p.startsWith("/about")) return "about"
    if (p.startsWith("/academics")) return "academics"
    if (p.startsWith("/admission")) return "admission"
    if (p.startsWith("/research")) return "research"
    if (p.startsWith("/news")) return "news"
    if (p.startsWith("/download")) return "download"
    if (p.startsWith("/obe")) return "obe"

    return "home"
  })

  const handleTabChange = async (val: string) => {
    const map: Record<string, string> = {
      home: "/",
      about: "/about/faculty",
      academics: "/academics/academic_calendar",
      admission: "/admission/why_choose_cet",
      research: "/research",
      news: "/news",
      download: "/download",
      obe: "/obe",
    }

    const target = map[val]
    if (!target) return

    // Prevent redundant navigation = less flicker
    if (normalizedPath.value === target) return

    await router.push(target)
  }

  // -----------------------------
  // Hide nav on scroll
  // -----------------------------
  const hideNav = ref(false)

  const onScroll = () => {
    // tweak threshold if you want
    hideNav.value = window.scrollY > 20
  }

  onMounted(() => {
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", onScroll)
  })

  // IMPORTANT: return everything the Navbar/Main.vue destructures
  return {
    // data
    departments,

    // search
    searchQuery,
    submitSearch,

    // about extras
    extra1Label,
    extra2Label,
    extra1Visible,
    extra2Visible,

    // admission extras
    admExtra1Label,
    admExtra2Label,
    admExtra1ShouldShow,
    admExtra2ShouldShow,
    undergradVisible,

    // tabs + nav behavior
    visualTab,
    handleTabChange,
    hideNav,
  }
}
