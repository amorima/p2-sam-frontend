export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const nif_nipc = getRouterParam(event, 'nif_nipc')
  const body = await readBody(event)

  const response = await $fetch(
    `${config.backendBase}/patrons/${nif_nipc}/donations`,
    {
      method: 'POST',
      body
    }
  )

  return response
})
