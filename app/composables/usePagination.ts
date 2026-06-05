export type SortDir = 'asc' | 'desc'

export function usePagination(key: string, limit = 25) {
  const offset = useState<number>(`${key}.offset`, () => 0)
  const total = useState<number>(`${key}.total`, () => 0)
  const sortBy = useState<string>(`${key}.sortBy`, () => '')
  const sortDir = useState<SortDir>(`${key}.sortDir`, () => 'desc')

  const page = computed(() => Math.floor(offset.value / limit) + 1)

  function goToPage(p: number) {
    offset.value = (p - 1) * limit
  }

  function setSort(field: string, dir: SortDir) {
    sortBy.value = field
    sortDir.value = dir
    offset.value = 0
  }

  const sortQs = computed(() =>
    sortBy.value
      ? `&sort_by=${encodeURIComponent(sortBy.value)}&sort_dir=${sortDir.value}`
      : ''
  )

  return { offset, total, page, limit, goToPage, sortBy, sortDir, setSort, sortQs }
}
