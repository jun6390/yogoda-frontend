import { useAuthStore } from "@/stores/useAuthStore";

export function useAuthHydrated() {
  return useAuthStore((state) => state.isReady);
}
