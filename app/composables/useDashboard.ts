import { createSharedComposable } from "@vueuse/core";

const _useDashboard = () => {
  const route = useRoute();
  const router = useRouter();
  const isNotificationsSlideoverOpen = ref(false);

  defineShortcuts({
    "g-i": () => router.push("/"),
    "g-n": () => router.push("/inbox"),
    "g-u": () => router.push("/customers"),
    "g-d": () => router.push("/settings"),
    n: () =>
      (isNotificationsSlideoverOpen.value =
        !isNotificationsSlideoverOpen.value),
  });

  watch(
    () => route.fullPath,
    () => {
      isNotificationsSlideoverOpen.value = false;
    },
  );

  return {
    isNotificationsSlideoverOpen,
  };
};

export const useDashboard = createSharedComposable(_useDashboard);
