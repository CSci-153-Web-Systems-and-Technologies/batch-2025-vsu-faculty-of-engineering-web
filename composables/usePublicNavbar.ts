// composables/usePublicNavbar.ts
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRoute, useRouter } from "#imports"
import { useCollection, useDocument, useFirestore } from "vuefire"
import { collection, doc, orderBy, query, getDocs } from "firebase/firestore"

/**
 * Convert Firestore values into a strict boolean.
 * Accepts: boolean, "true"/"false", 1/0
 * Default fallback: false (hidden unless explicitly enabled)
 */
function asBool(val: unknown, fallback = false) {
  if (typeof val === "boolean") return val
  if (typeof val === "string") {
    const v = val.trim().toLowerCase()
    if (v === "true") return true
    if (v === "false") return false
  }
  if (typeof val === "number") return val === 1
  return fallback
}

export function usePublicNavbar() {
  const route = useRoute()
  const router = useRouter()
  const db = useFirestore()

  // -----------------------------
  // Departments (Academics/About submenus)
  // -----------------------------
  // ✅ include id field directly (no manual map / no undefined doc.id)
  // ...
  const departments = ref<Array<{ id: string; name?: string }>>([])

  onMounted(async () => {
    const snap = await getDocs(query(collection(db, "departments"), orderBy("name", "asc")))
    departments.value = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }))
  })

  // -----------------------------
  // Search
  // -----------------------------
  const searchQuery = ref("")
  const submitSearch = async () => {
    const q = searchQuery.value.trim()
    if (!q) return
    await router.push({ path: "/search", query: { q } })
  }

  // -----------------------------
  // Extra Sections (ABOUT)
  // Source of truth:
  // - about_sections/extra_section_1 (title, isVisible)
  // - about_sections/extra_section_2 (title, isVisible)
  // - settings/public_flags (about_extra_section_1, about_extra_section_2)
  // Rule: show only if BOTH doc.isVisible and flag are true
  // -----------------------------
  const extra1Doc = useDocument(doc(db, "about_sections", "extra_section_1"))
  const extra2Doc = useDocument(doc(db, "about_sections", "extra_section_2"))

  const flagsRef = doc(db, "settings", "public_flags")
  const { data: flags } = useDocument<Record<string, any>>(flagsRef)

  const extra1Label = computed(() => {
    const t = extra1Doc.value?.title
    return t && String(t).trim().length ? String(t).trim() : "Extra Section"
  })
  const extra2Label = computed(() => {
    const t = extra2Doc.value?.title
    return t && String(t).trim().length ? String(t).trim() : "Extra Section"
  })

  const extra1HasTitle = computed(() => {
    const t = extra1Doc.value?.title
    return !!(t && String(t).trim().length)
  })
  const extra2HasTitle = computed(() => {
    const t = extra2Doc.value?.title
    return !!(t && String(t).trim().length)
  })

  const extra1Visible = computed(() => {
    const sectionVisible = asBool(extra1Doc.value?.isVisible, false)
    const flagVisible = asBool(flags.value?.about_extra_section_1, false)
    return sectionVisible && flagVisible
  })

  const extra2Visible = computed(() => {
    const sectionVisible = asBool(extra2Doc.value?.isVisible, false)
    const flagVisible = asBool(flags.value?.about_extra_section_2, false)
    return sectionVisible && flagVisible
  })

  // ✅ Use these in the navbar v-if
  const extra1ShouldShow = computed(() => extra1Visible.value && extra1HasTitle.value)
  const extra2ShouldShow = computed(() => extra2Visible.value && extra2HasTitle.value)

  // -----------------------------
  // Extra Sections (ADMISSION)
  // Source of truth:
  // - admission_sections/extra_section_1 (title, isVisible)
  // - admission_sections/extra_section_2 (title, isVisible)
  // - settings/public_flags (admission_extra_section_1, admission_extra_section_2)
  // -----------------------------
  const admExtra1Doc = useDocument(doc(db, "admission_sections", "extra_section_1"))
  const admExtra2Doc = useDocument(doc(db, "admission_sections", "extra_section_2"))

  const admExtra1Label = computed(() => {
    const t = admExtra1Doc.value?.title
    return t && String(t).trim().length ? String(t).trim() : "Extra Section"
  })
  const admExtra2Label = computed(() => {
    const t = admExtra2Doc.value?.title
    return t && String(t).trim().length ? String(t).trim() : "Extra Section"
  })

  const admExtra1HasTitle = computed(() => {
    const t = admExtra1Doc.value?.title
    return !!(t && String(t).trim().length)
  })
  const admExtra2HasTitle = computed(() => {
    const t = admExtra2Doc.value?.title
    return !!(t && String(t).trim().length)
  })

  const admExtra1Visible = computed(() => {
    const sectionVisible = asBool(admExtra1Doc.value?.isVisible, false)
    const flagVisible = asBool(flags.value?.admission_extra_section_1, false)
    return sectionVisible && flagVisible
  })

  const admExtra2Visible = computed(() => {
    const sectionVisible = asBool(admExtra2Doc.value?.isVisible, false)
    const flagVisible = asBool(flags.value?.admission_extra_section_2, false)
    return sectionVisible && flagVisible
  })

  const admExtra1ShouldShow = computed(() => admExtra1Visible.value && admExtra1HasTitle.value)
  const admExtra2ShouldShow = computed(() => admExtra2Visible.value && admExtra2HasTitle.value)

  // Undergrad toggle (keep as-is; wire to flags later if you want)
  const undergradVisible = ref(true)

  // -----------------------------
  // Tabs active state (route-driven)
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
    if (normalizedPath.value === target) return
    await router.push(target)
  }

  // -----------------------------
  // Hide nav on scroll
  // -----------------------------
  const hideNav = ref(false)
  const onScroll = () => {
    hideNav.value = window.scrollY > 20
  }

  onMounted(() => {
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", onScroll)
  })

  return {
    departments,

    searchQuery,
    submitSearch,

    // about extras (use ShouldShow in UI)
    extra1Label,
    extra2Label,
    extra1Visible,
    extra2Visible,
    extra1ShouldShow,
    extra2ShouldShow,

    // admission extras
    admExtra1Label,
    admExtra2Label,
    admExtra1ShouldShow,
    admExtra2ShouldShow,
    undergradVisible,

    visualTab,
    handleTabChange,
    hideNav,
  }
}
