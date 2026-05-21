type UserRole = 'admin' | 'patron' | 'institution' | 'business'

export default defineEventHandler(async (event) => {
  const { nif_nipc, password, role } = await readBody<{ nif_nipc: string, password: string, role: string }>(event)
  const config = useRuntimeConfig()

  if (!nif_nipc || !role) {
    throw createError({ statusCode: 400, statusMessage: 'NIF/NIPC e tipo são obrigatórios.' })
  }

  if (role === 'admin') {
    const adminNif = process.env.ADMIN_NIF ?? '000001'
    const adminPass = process.env.ADMIN_PASSWORD ?? 'TDW'
    if (nif_nipc === adminNif && password === adminPass) {
      return { role: 'admin' as UserRole, nif: '', name: 'Administrador SAM' }
    }
    throw createError({ statusCode: 401, statusMessage: 'Credenciais de administrador inválidas.' })
  }

  const endpointMap: Record<string, string> = {
    patron: 'patrons',
    institution: 'institutions',
    business: 'business'
  }

  const endpoint = endpointMap[role]
  if (!endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de utilizador inválido.' })
  }

  let entity: { email_login?: string; nome_entidade?: string }
  try {
    entity = await $fetch<any>(`${config.backendBase}/${endpoint}/${nif_nipc}`)
  } catch (err: any) {
    const status = err?.response?.status ?? err?.statusCode
    if (status === 404) {
      throw createError({ statusCode: 401, statusMessage: 'NIF/NIPC não encontrado. Verifique os dados ou registe-se.' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Erro ao verificar credenciais. Tente novamente.' })
  }

  if (!entity.email_login) {
    throw createError({ statusCode: 500, statusMessage: 'Dados de login não disponíveis.' })
  }

  // Verify password via backend JWT auth
  let accessToken: string | undefined
  let refreshToken: string | undefined
  try {
    const authResult = await $fetch<{ accessToken: string; refreshToken: string }>(
      `${config.backendBase}/auth/login`,
      { method: 'POST', body: { email_login: entity.email_login, password } }
    )
    accessToken = authResult.accessToken
    refreshToken = authResult.refreshToken
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas.' })
  }

  return {
    role: role as UserRole,
    nif: nif_nipc,
    name: entity.nome_entidade ?? nif_nipc,
    accessToken,
    refreshToken
  }
})
