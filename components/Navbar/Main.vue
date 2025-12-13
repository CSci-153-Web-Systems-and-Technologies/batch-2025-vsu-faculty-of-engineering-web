<template>
  <header
    class="fixed z-20 w-full"
    :style="hideNav ? 'height: 120px;' : 'height: 30px;'"
  >
    <!-- Header Bar with Search and Social Icons -->
    <transition name="header-sticky">
      <div class="bg-white border-gray-200 header-bar-transition">
        <div
          class="relative mx-auto flex min-h-[88px] w-full max-w-screen-xl items-center justify-between px-4 py-3"
        >
          <!-- Left: Social Icons -->
          <div class="flex items-center space-x-6">
            <a
              v-for="it in socialItems"
              :key="it.key"
              :href="it.href"
              target="_blank"
              rel="noopener noreferrer"
              class="text-red-900 transition-opacity hover:opacity-80"
              :title="it.key"
              :aria-label="it.key"
            >
              <component
                :is="SOCIAL_ICONS[it.key] || Globe"
                class="text-red-900 size-5 fill-neutral-100 md:size-6"
              />
            </a>
          </div>

          <!-- Logo: ABSOLUTE CENTER (does not move when left/right change) -->
          <NuxtLink
            to="/"
            class="absolute inset-y-0 flex items-center justify-center -translate-x-1/2 left-1/2"
          >
            <HeaderMain />
          </NuxtLink>

          <!-- Right: Search Bar -->
          <div class="relative my-1 w-38">
            <UiInput
              id="search"
              type="text"
              v-model="searchQuery"
              @keydown.enter="submitSearch"
              placeholder="Search"
              class="w-full h-10 pl-10 text-sm border-2 border-red-900 rounded-full bg-neutral-100 font-montserrat placeholder:text-black focus:outline-black focus:ring-0"
            />
            <span class="absolute inset-y-0 flex items-center text-white left-3">
              <Search class="text-red-900 fill-white" />
            </span>
          </div>
        </div>
      </div>
    </transition>

    <!-- NAVBAR -->
    <transition name="nav-fade-up">
      <nav
        v-if="!hideNav"
        class="flex flex-col items-center w-full bg-red-900 shadow-md"
        :class="['flex w-full flex-col items-center', { 'nav-fixed': !hideNav }]"
      >
        <!-- IMPORTANT: value is derived from route (stable, no flicker) -->
        <UiTabs :value="visualTab" @update:value="handleTabChange">
          <UiTabsList
            class="relative flex items-stretch gap-1 px-2 text-white bg-transparent h-14 font-montserrat md:gap-2 md:px-4"
          >
            <!-- HOME -->
            <UiTabsTrigger value="home" :class="tabTriggerClass">
              <NuxtLink
                to="/"
                class="flex items-center gap-1 h-14 !text-inherit bg-transparent hover:bg-transparent"
              >
                <House />
                <span class="text-base md:text-lg">Home</span>
              </NuxtLink>
            </UiTabsTrigger>

            <!-- ABOUT -->
            <UiTabsTrigger value="about" :class="tabTriggerClass">
              <UiDropdownMenu>
                <UiDropdownMenuTrigger class="flex items-center gap-1 !text-inherit">
                  <BadgeInfo />
                  <span class="text-base md:text-lg">About</span>
                  <ChevronDown />
                </UiDropdownMenuTrigger>

                <UiDropdownMenuContent
                  :class="[dropdownContentClass, 'min-w-(--reka-dropdown-menu-trigger-width)']"
                >
                  <UiDropdownMenuItem :class="dropdownItemClass">
                    <NuxtLink to="/about/faculty" class="block w-full !text-inherit">
                      Faculty of Engineering
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuItem :class="dropdownItemClass">
                    <NuxtLink to="/about/facilities" class="block w-full !text-inherit">
                      Facilities
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuItem :class="dropdownItemClass">
                    <NuxtLink to="/about/history" class="block w-full !text-inherit">
                      History
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuSub>
                    <UiDropdownMenuSubTrigger :class="dropdownItemClass">
                      <NuxtLink
                        to="/about/administration"
                        class="flex w-full items-center justify-between !text-inherit"
                      >
                        <span>Offices and Administration</span>
                      </NuxtLink>
                    </UiDropdownMenuSubTrigger>

                    <UiDropdownMenuSubContent :class="dropdownContentClass">
                      <UiDropdownMenuItem
                        v-for="dept in departments"
                        :key="dept.id"
                        :class="dropdownItemClass"
                      >
                        <NuxtLink
                          :to="`/about/dept_personels/${dept.id}`"
                          class="block w-full !text-inherit"
                        >
                          {{ dept.name }}
                        </NuxtLink>
                      </UiDropdownMenuItem>
                    </UiDropdownMenuSubContent>
                  </UiDropdownMenuSub>

                  <UiDropdownMenuItem :class="dropdownItemClass">
                    <NuxtLink to="/about/map" class="block w-full !text-inherit">
                      Map and Location
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuItem v-if="extra1Visible" :class="dropdownItemClass">
                    <NuxtLink :to="`/about/extra1`" class="block w-full !text-inherit">
                      {{ extra1Label }}
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuItem v-if="extra2Visible" :class="dropdownItemClass">
                    <NuxtLink :to="`/about/extra2`" class="block w-full !text-inherit">
                      {{ extra2Label }}
                    </NuxtLink>
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </UiTabsTrigger>

            <!-- ACADEMICS -->
            <UiTabsTrigger value="academics" :class="tabTriggerClass">
              <UiDropdownMenu>
                <UiDropdownMenuTrigger class="flex items-center gap-1 !text-inherit">
                  <Users />
                  <span class="text-base md:text-lg">Academics</span>
                  <ChevronDown />
                </UiDropdownMenuTrigger>

                <UiDropdownMenuContent
                  :class="[dropdownContentClass, 'min-w-(--reka-dropdown-menu-trigger-width)']"
                >
                  <UiDropdownMenuSub>
                    <UiDropdownMenuSubTrigger :class="dropdownItemClass">
                      Degree Program
                    </UiDropdownMenuSubTrigger>
                    <UiDropdownMenuSubContent :class="dropdownContentClass">
                      <UiDropdownMenuItem
                        v-for="dept in departments"
                        :key="dept.id"
                        :class="dropdownItemClass"
                      >
                        <NuxtLink
                          :to="`/academics/departments/${dept.id}`"
                          class="block w-full !text-inherit"
                        >
                          {{ dept.name }}
                        </NuxtLink>
                      </UiDropdownMenuItem>
                    </UiDropdownMenuSubContent>
                  </UiDropdownMenuSub>

                  <UiDropdownMenuItem :class="dropdownItemClass">
                    <NuxtLink
                      to="/academics/academic_calendar"
                      class="block w-full !text-inherit"
                    >
                      Academic Calendar
                    </NuxtLink>
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </UiTabsTrigger>

            <!-- ADMISSION -->
            <UiTabsTrigger value="admission" :class="tabTriggerClass">
              <UiDropdownMenu>
                <UiDropdownMenuTrigger class="flex items-center gap-1 !text-inherit">
                  <Building />
                  <span class="text-base md:text-lg">Admission</span>
                  <ChevronDown />
                </UiDropdownMenuTrigger>

                <UiDropdownMenuContent
                  :class="[dropdownContentClass, 'min-w-(--reka-dropdown-menu-trigger-width)']"
                >
                  <UiDropdownMenuItem :class="dropdownItemClass">
                    <NuxtLink
                      to="/admission/why_choose_cet"
                      class="block w-full !text-inherit"
                    >
                      Why choose VSU?
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuItem v-if="undergradVisible" :class="dropdownItemClass">
                    <NuxtLink
                      to="/admission/undergraduate"
                      class="block w-full !text-inherit"
                    >
                      Undergraduate
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuItem :class="dropdownItemClass">
                    <NuxtLink to="/admission/graduate" class="block w-full !text-inherit">
                      Graduate
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuItem v-if="admExtra1ShouldShow" :class="dropdownItemClass">
                    <NuxtLink :to="`/admission/extra1`" class="block w-full !text-inherit">
                      {{ admExtra1Label }}
                    </NuxtLink>
                  </UiDropdownMenuItem>

                  <UiDropdownMenuItem v-if="admExtra2ShouldShow" :class="dropdownItemClass">
                    <NuxtLink :to="`/admission/extra2`" class="block w-full !text-inherit">
                      {{ admExtra2Label }}
                    </NuxtLink>
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </UiTabsTrigger>

            <!-- RESEARCH -->
            <UiTabsTrigger value="research" :class="tabTriggerClass">
              <NuxtLink
                to="/research"
                class="flex items-center gap-1 h-14 !text-inherit bg-transparent hover:bg-transparent"
              >
                <FlaskConical />
                <span class="text-base md:text-lg">Research</span>
              </NuxtLink>
            </UiTabsTrigger>

            <!-- NEWS -->
            <UiTabsTrigger value="news" :class="tabTriggerClass">
              <NuxtLink
                to="/news"
                class="flex items-center gap-1 h-14 !text-inherit bg-transparent hover:bg-transparent"
              >
                <Newspaper />
                <span class="text-base md:text-lg">News</span>
              </NuxtLink>
            </UiTabsTrigger>

            <!-- DOWNLOAD -->
            <UiTabsTrigger value="download" :class="tabTriggerClass">
              <NuxtLink
                to="/download"
                class="flex items-center gap-1 h-14 !text-inherit bg-transparent hover:bg-transparent"
              >
                <FileDown />
                <span class="text-base md:text-lg">Download</span>
              </NuxtLink>
            </UiTabsTrigger>

            <!-- OBE -->
            <UiTabsTrigger value="obe" :class="tabTriggerClass">
              <NuxtLink
                to="/obe"
                class="flex items-center gap-1 h-14 !text-inherit bg-transparent hover:bg-transparent"
              >
                <Award />
                <span class="text-base md:text-lg">OBE</span>
              </NuxtLink>
            </UiTabsTrigger>
          </UiTabsList>
        </UiTabs>
      </nav>
    </transition>
  </header>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { usePublicNavbar } from "@/composables/usePublicNavbar";
  import { useSocialLinks } from "@/composables/useSocialLinks";
  import {
    Award,
    BadgeInfo,
    Building,
    ChevronDown,
    Facebook,
    FileDown,
    FlaskConical,
    Globe,
    House,
    Instagram,
    Linkedin,
    Newspaper,
    Search,
    Twitter,
    Users,
    Youtube,
  } from "lucide-vue-next";

  const route = useRoute();
  const router = useRouter();

  const SOCIAL_ICONS: Record<string, any> = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
    website: Globe,
  };

  // Keep your existing composable for the other navbar data
  const navbar = usePublicNavbar();
  const {
    departments,
    searchQuery,
    submitSearch,
    extra1Label,
    extra2Label,
    extra1Visible,
    extra2Visible,
    admExtra1Label,
    admExtra2Label,
    admExtra1ShouldShow,
    admExtra2ShouldShow,
    undergradVisible,
    hideNav,
  } = navbar;

  const { items: socialItems } = useSocialLinks();

  /**
   * ✅ Route is the single source of truth.
   * This removes the "flash yellow then revert" problem entirely.
   */
  const visualTab = computed<string>(() => {
    const p = route.path;

    if (p === "/") return "home";
    if (p.startsWith("/about")) return "about";
    if (p.startsWith("/academics")) return "academics";
    if (p.startsWith("/admission")) return "admission";
    if (p.startsWith("/research")) return "research";
    if (p.startsWith("/news")) return "news";
    if (p.startsWith("/download")) return "download";
    if (p.startsWith("/obe")) return "obe";

    return "home";
  });

  /**
   * ✅ Only navigate for the tabs that are actual “single links”.
   * For dropdown tabs (about/academics/admission), we do nothing here
   * because the dropdown items are the real navigation.
   */
  const handleTabChange = async (val: string) => {
    const map: Record<string, string> = {
      home: "/",
      research: "/research/",
      news: "/news/",
      download: "/download/",
      obe: "/obe/",
    };

    if (map[val]) await router.push(map[val]);
  };

  /**
   * ✅ Active styling comes from Tabs state (data-[state=active])
   * No more manual "visualTab === x" flicker classes.
   */
  const tabTriggerClass =
    "relative cursor-pointer flex items-center h-full px-5 md:px-6 font-normal " +
    "text-base md:text-lg transition-colors duration-150 rounded-none " +
    "text-white hover:bg-red-800 hover:text-yellow-300 " +
    "data-[state=active]:bg-transparent data-[state=active]:text-yellow-300 " +
    "data-[state=active]:shadow-none data-[state=active]:border-none " +
    "data-[state=active]:hover:bg-transparent data-[state=active]:hover:text-yellow-300";

  const dropdownContentClass =
    "bg-white text-neutral-900 border border-red-900 rounded-xl shadow-lg py-2 font-montserrat";

  const dropdownItemClass =
    "px-4 py-2 text-sm md:text-base font-montserrat text-neutral-900 " +
    "hover:bg-neutral-100 focus:bg-neutral-100 cursor-pointer";
</script>

<style scoped>
  .js-tabs-indicator {
    will-change: transform, width, opacity;
  }

  /* HEADER (remains visible, no leave transition) */
  .header-sticky-enter-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .header-sticky-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }
  .header-sticky-enter-to {
    opacity: 1;
    transform: translateY(0);
  }

  /* NAVBAR fade up and disappear */
  .nav-fade-up-enter-active,
  .nav-fade-up-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .nav-fade-up-enter-from {
    opacity: 0;
    transform: translateY(-20px);
  }
  .nav-fade-up-enter-to {
    opacity: 1;
    transform: translateY(0);
  }
  .nav-fade-up-leave-from {
    opacity: 1;
    transform: translateY(0);
  }
  .nav-fade-up-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }
</style>
