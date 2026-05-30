// Expose Vue's composition API as globals so Nuxt-style auto-imports inside the
// component's <script setup> resolve in the test environment.
import * as vue from 'vue'

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
