import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const router = useRouter()

  defineShortcuts({
    'g-i': () => router.push('/'),
    'g-n': () => router.push('/inbox'),
    'g-u': () => router.push('/customers'),
    'g-d': () => router.push('/settings')
  })
}

export const useDashboard = createSharedComposable(_useDashboard)
