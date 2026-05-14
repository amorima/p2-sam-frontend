export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  return $fetch(`${config.backendBase}/telemetry/${id}`)
})
