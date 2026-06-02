type UserRole = 'admin' | 'patron' | 'institution' | 'business'

interface BackendLoginResponse {
  accessToken: string
  refreshToken: string
  entity: {
    nif_nipc: string
    email_login: string
    nome_entidade: string
    role: UserRole
    profile_pic: string | null
  }
}

export default defineEventHandler(async (event) => {
  const { nif_nipc, password } = await readBody<{ nif_nipc: string, password: string }>(event)
  const config = useRuntimeConfig()

  if (!nif_nipc || !password) {
    throw createError({ statusCode: 400, statusMessage: 'NIF/NIPC e palavra-passe são obrigatórios.' })
  }

  let authResult: BackendLoginResponse
  try {
    authResult = await $fetch<BackendLoginResponse>(`${config.backendBase}/users/login`, {
      method: 'POST',
      body: { nif_nipc, password }
    })
  } catch (err: unknown) {
    const e = err as { response?: { status?: number }, statusCode?: number }
    const status = e?.response?.status ?? e?.statusCode
    if (status === 401) {
      throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas.' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Erro ao verificar credenciais. Tente novamente.' })
  }

  return {
    role: authResult.entity.role,
    nif: authResult.entity.nif_nipc,
    name: authResult.entity.nome_entidade ?? nif_nipc,
    accessToken: authResult.accessToken,
    refreshToken: authResult.refreshToken,
    profile_pic: authResult.entity.profile_pic ?? null
  }
})
