// Expose Vue's composition API as globals so Nuxt-style auto-imports inside
// components and composables resolve correctly in the test environment.
import * as vue from 'vue'
import { vi } from 'vitest'

Object.assign(globalThis, {
  ref: vue.ref,
  computed: vue.computed,
  reactive: vue.reactive,
  watch: vue.watch,
  watchEffect: vue.watchEffect,
  onMounted: vue.onMounted,
  onBeforeUnmount: vue.onBeforeUnmount,
  nextTick: vue.nextTick,
  toRef: vue.toRef,
  toRefs: vue.toRefs
})

// Per-test state store so each test starts with a fresh reactive state.
// Mirrors Nuxt's useState behaviour: same key → same ref within a request.
const _stateStore = new Map<string, ReturnType<typeof vue.ref>>()

Object.assign(globalThis, {
  // useState<T>(key, init?) → stable ref per key within the test run
  useState: <T>(key: string, init?: () => T) => {
    if (!_stateStore.has(key)) {
      _stateStore.set(key, vue.ref<T>(init ? init() : undefined as unknown as T))
    }
    return _stateStore.get(key)!
  },

  // useCookie — returns a plain ref (no HTTP cookie in test environment)
  useCookie: <T>(_key: string, opts?: { default?: () => T }) =>
    vue.ref<T>(opts?.default ? opts.default() : null as unknown as T),

  // useAsyncData — no-op in tests; data initialised to null
  useAsyncData: (_key: string, _fn: () => Promise<unknown>) => ({
    data: vue.ref(null),
    error: vue.ref(null),
    pending: vue.ref(false),
    execute: vi.fn()
  }),

  // $fetch — mocked; individual tests override as needed
  $fetch: vi.fn().mockResolvedValue({}),

  // Navigation stubs
  navigateTo: vi.fn(),

  // Lifecycle stubs
  onScopeDispose: vi.fn()
})

// Expose composables that Nuxt auto-imports but Vitest does not know about.
// Each composable that calls another (e.g. useNeeds → useAuth) needs its
// dependency available as a global so the module resolves correctly.
import { useAuth } from '../app/composables/useAuth'
Object.assign(globalThis, { useAuth })

// Reset shared state and mocks before every test to prevent cross-test bleed.
beforeEach(() => {
  _stateStore.clear()
  vi.clearAllMocks()
  ;(globalThis as Record<string, unknown>).$fetch = vi.fn().mockResolvedValue({})
})
