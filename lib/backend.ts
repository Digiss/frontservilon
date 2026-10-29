import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  ActiveProfile,
  AppUser,
  Application,
  Category,
  ChatMessage,
  ContactRequest,
  CreateClientCommand,
  CreateFreeLancerCommand,
  CreatePostCommand,
  Favorite,
  Job,
  LoginCommand,
  Notification,
  ProviderProfile,
  Review,
  Role,
  Service,
} from './api'

type StoredUser = AppUser & {
  numericId: number
  passwordHash: string
  phoneNumber: string
  photoUrl: string | null
  birthDate: string
  address: string | null
  cpf: string | null
  providerProfileId: number | null
}

type StoredNotification = Notification & { userId: string }

type Database = {
  nextUserId: number
  nextProviderId: number
  nextJobId: number
  users: StoredUser[]
  providers: ProviderProfile[]
  categories: Category[]
  services: Service[]
  jobs: Job[]
  applications: Application[]
  reviews: Review[]
  favorites: Favorite[]
  notifications: StoredNotification[]
  messages: ChatMessage[]
  contactRequests: ContactRequest[]
}

export class BackendError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message)
    this.name = 'BackendError'
  }
}

const dataDirectory = path.join(process.cwd(), '.data')
const databasePath = path.join(dataDirectory, 'servilon.json')
const sessionCookie = 'servilon_user_id'
let writeQueue: Promise<void> = Promise.resolve()

const categorySeeds: Category[] = [
  { name: 'Tecnologia', count: 0, icon: 'monitor', id: 1, serviceTypes: ['Programação', 'Modelagem 3D', 'Cybersegurança', 'Dados e IA', 'Suporte técnico', 'Desenvolvimento mobile'] },
  { name: 'Finanças', count: 0, icon: 'trending-up', id: 2, serviceTypes: ['Contabilidade', 'Planejamento financeiro', 'Investimentos', 'Impostos', 'Auditoria', 'Finanças empresariais'] },
  { name: 'Educação', count: 0, icon: 'book-open', id: 3, serviceTypes: ['Idiomas', 'Reforço escolar', 'Preparação para provas', 'Música', 'Programação', 'Mentoria acadêmica'] },
  { name: 'Jardinagem', count: 0, icon: 'leaf', id: 4, serviceTypes: ['Paisagismo', 'Manutenção de jardins', 'Horta doméstica', 'Poda de árvores', 'Irrigação', 'Plantas ornamentais'] },
  { name: 'Saúde & Bem-estar', count: 0, icon: 'heart', id: 5, serviceTypes: ['Nutrição', 'Personal trainer', 'Yoga e meditação', 'Massoterapia', 'Psicologia', 'Fisioterapia'] },
  { name: 'Jurídico', count: 0, icon: 'scale', id: 6, serviceTypes: ['Direito trabalhista', 'Direito de família', 'Contratos', 'Direito empresarial', 'Imobiliário', 'Propriedade intelectual'] },
  { name: 'Design & Arte', count: 0, icon: 'palette', id: 7, serviceTypes: ['Identidade visual', 'UI/UX design', 'Ilustração', 'Fotografia', 'Vídeo e edição', '3D e animação'] },
  { name: 'Casa & Reforma', count: 0, icon: 'wrench', id: 8, serviceTypes: ['Elétrica', 'Hidráulica', 'Pintura', 'Marcenaria', 'Alvenaria', 'Montagem de móveis'] },
]

const providerSeeds: Omit<ProviderProfile, 'userId'>[] = [
  { id: 1, name: 'Carlos Mendes', role: 'Desenvolvedor Full-stack', city: 'São Paulo, SP', rating: 0, reviews: 0, photo: 'CM', bio: 'Desenvolvedor em busca de projetos de programação.', skills: ['React', 'TypeScript', 'Node.js'], certifications: ['Formação em Desenvolvimento Web'], experience: '5 anos', services: ['Desenvolvimento web', 'APIs REST'], sectors: ['Tecnologia'], completed: 0, responseTime: 'Responde em até 2h', availability: 'Disponível à noite e aos fins de semana', serviceFormat: 'Remoto e presencial' },
  { id: 2, name: 'Ana Souza', role: 'Consultora Financeira', city: 'São Paulo, SP', rating: 0, reviews: 0, photo: 'AS', bio: 'Consultora financeira focada em planejamento.', skills: ['Planejamento', 'Investimentos'], certifications: ['CPA-20'], experience: '8 anos', services: ['Planejamento financeiro'], sectors: ['Finanças'], completed: 0, responseTime: 'Responde em até 1h' },
  { id: 3, name: 'Pedro Costa', role: 'Professor de Inglês', city: 'Rio de Janeiro, RJ', rating: 0, reviews: 0, photo: 'PC', bio: 'Professor de inglês para negócios.', skills: ['Inglês', 'Conversação'], certifications: ['TESOL'], experience: '7 anos', services: ['Inglês corporativo'], sectors: ['Educação'], completed: 0, responseTime: 'Responde em até 3h' },
  { id: 4, name: 'Fernanda Lima', role: 'Designer UI/UX', city: 'Belo Horizonte, MG', rating: 0, reviews: 0, photo: 'FL', bio: 'Designer de experiências digitais.', skills: ['Figma', 'UI/UX'], certifications: ['Google UX Design'], experience: '6 anos', services: ['Identidade visual', 'Produtos digitais'], sectors: ['Design & Arte', 'Tecnologia'], completed: 0, responseTime: 'Responde em até 2h' },
]

function hashPassword(password: string): string {
  const salt = randomUUID()
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

function passwordMatches(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false
  const actual = scryptSync(password, salt, 64)
  const expected = Buffer.from(key, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function createSeedDatabase(): Database {
  const client: StoredUser = {
    id: 'teste1', numericId: 1, username: 'TESTE1', name: 'Joana Silva', email: 'teste1@servilon.dev',
    role: 'cliente', location: 'São Paulo, SP', bio: 'Cliente procurando profissionais confiáveis.',
    skills: [], certifications: [], history: [], availability: '', serviceFormat: 'Remoto', links: [],
    rating: 0, reviews: 0, passwordHash: hashPassword('123456'), phoneNumber: '11999990001',
    photoUrl: null, birthDate: '1990-01-01', address: 'São Paulo, SP', cpf: null, providerProfileId: null,
  }
  const provider: StoredUser = {
    id: 'teste2', numericId: 2, username: 'TESTE2', name: 'Carlos Mendes', email: 'teste2@servilon.dev',
    role: 'prestador', location: 'São Paulo, SP', bio: 'Desenvolvedor em busca de projetos de programação.',
    skills: ['React', 'TypeScript', 'Node.js'], certifications: ['Formação em Desenvolvimento Web'],
    history: [], availability: 'Disponível à noite e aos fins de semana', serviceFormat: 'Remoto e presencial',
    links: [], rating: 0, reviews: 0, passwordHash: hashPassword('123456'), phoneNumber: '11999990002',
    photoUrl: null, birthDate: '1990-01-01', address: null, cpf: '12345678901', providerProfileId: 1,
  }
  return {
    nextUserId: 3,
    nextProviderId: 5,
    nextJobId: 1,
    users: [client, provider],
    providers: providerSeeds.map(item => ({ ...item, userId: item.id === 1 ? provider.id : undefined })),
    categories: categorySeeds,
    services: [],
    jobs: [],
    applications: [],
    reviews: [],
    favorites: [],
    notifications: [],
    messages: [],
    contactRequests: [],
  }
}

async function readDatabase(): Promise<Database> {
  try {
    return JSON.parse(await readFile(databasePath, 'utf8')) as Database
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const seed = createSeedDatabase()
    await mkdir(dataDirectory, { recursive: true })
    await writeFile(databasePath, JSON.stringify(seed, null, 2), 'utf8')
    return seed
  }
}

async function saveDatabase(database: Database): Promise<void> {
  await mkdir(dataDirectory, { recursive: true })
  const temporaryPath = `${databasePath}.${randomUUID()}.tmp`
  await writeFile(temporaryPath, JSON.stringify(database, null, 2), 'utf8')
  await rename(temporaryPath, databasePath)
}

async function readState(): Promise<Database> {
  await writeQueue
  return readDatabase()
}

function updateState<T>(update: (database: Database) => T): Promise<T> {
  const operation = writeQueue.then(async () => {
    const database = await readDatabase()
    const result = update(database)
    await saveDatabase(database)
    return result
  })
  writeQueue = operation.then(() => undefined, () => undefined)
  return operation
}

export function getSessionUserId(request: Request): string | null {
  const cookie = request.headers.get('cookie') || ''
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${sessionCookie}=`))
  return value ? decodeURIComponent(value.slice(sessionCookie.length + 1)) : null
}

export function getSessionCookie(userId: string): string {
  return `${sessionCookie}=${encodeURIComponent(userId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
}

export function clearSessionCookie(): string {
  return `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function toAppUser(user: StoredUser): AppUser {
  const { passwordHash: _passwordHash, numericId: _numericId, cpf: _cpf, phoneNumber: _phoneNumber, photoUrl: _photoUrl, birthDate: _birthDate, address: _address, providerProfileId: _providerProfileId, ...publicUser } = user
  return publicUser
}

export async function getCurrentUser(request: Request): Promise<AppUser | null> {
  const id = getSessionUserId(request)
  if (!id) return null
  const database = await readState()
  const user = database.users.find(item => item.id === id)
  return user ? toAppUser(user) : null
}

function requireCurrentUser(database: Database, request: Request): StoredUser {
  const id = getSessionUserId(request)
  const user = database.users.find(item => item.id === id)
  if (!user) throw new BackendError('Faça login para continuar.', 401)
  return user
}

export async function login(payload: LoginCommand): Promise<AppUser> {
  if (!payload || typeof payload.Password !== 'string' || (!payload.Email && !payload.UserName) ||
    (payload.Profile !== 'Client' && payload.Profile !== 'FreeLancer')) {
    throw new BackendError('Informe usuário, senha e perfil.', 400)
  }
  const database = await readState()
  const user = database.users.find(item =>
    payload.Email
      ? item.email.toLowerCase() === payload.Email.toLowerCase()
      : item.username.toLowerCase() === (payload.UserName || '').toLowerCase(),
  )
  if (!user || !passwordMatches(payload.Password, user.passwordHash)) {
    throw new BackendError('Usuário ou senha inválidos.', 401)
  }
  const requestedRole: Role = payload.Profile === 'FreeLancer' ? 'prestador' : 'cliente'
  if (user.role !== requestedRole) throw new BackendError('Este usuário não possui o perfil selecionado.', 403)
  return toAppUser(user)
}

export async function register(payload: CreateClientCommand | CreateFreeLancerCommand, profile: ActiveProfile): Promise<AppUser> {
  return updateState(database => {
    if (!payload || (profile !== 'Client' && profile !== 'FreeLancer') ||
      [payload.UserName, payload.Email, payload.PasswordHash, payload.Name, payload.PhoneNumber, payload.BirthDate]
        .some(value => typeof value !== 'string' || !value.trim()) ||
      (payload.PhotoUrl !== null && typeof payload.PhotoUrl !== 'string')) {
      throw new BackendError('Preencha os campos obrigatórios do cadastro.', 400)
    }
    if (database.users.some(user => user.email.toLowerCase() === payload.Email.toLowerCase() || user.username.toLowerCase() === payload.UserName.toLowerCase())) {
      throw new BackendError('E-mail ou nome de usuário já cadastrado.', 409)
    }
    const isProvider = profile === 'FreeLancer'
    if (isProvider && !/^\d{11}$/.test((payload as CreateFreeLancerCommand).CPF)) {
      throw new BackendError('O CPF deve conter exatamente 11 dígitos.', 400)
    }
    const numericId = database.nextUserId++
    const providerProfileId = isProvider ? database.nextProviderId++ : null
    const address = 'Address' in payload ? payload.Address : null
    const user: StoredUser = {
      id: `user-${numericId}`,
      numericId,
      username: payload.UserName,
      email: payload.Email,
      name: payload.Name,
      role: isProvider ? 'prestador' : 'cliente',
      location: address || '',
      bio: '',
      skills: [],
      certifications: [],
      history: [],
      availability: '',
      serviceFormat: '',
      links: [],
      rating: 0,
      reviews: 0,
      passwordHash: hashPassword(payload.PasswordHash),
      phoneNumber: payload.PhoneNumber,
      photoUrl: payload.PhotoUrl,
      birthDate: payload.BirthDate,
      address: address || null,
      cpf: isProvider ? (payload as CreateFreeLancerCommand).CPF : null,
      providerProfileId,
    }
    database.users.push(user)
    if (isProvider && providerProfileId !== null) {
      database.providers.push({
        id: providerProfileId, userId: user.id, name: user.name, role: 'Prestador de serviços',
        city: user.location || 'Localização não informada', rating: 0, reviews: 0,
        photo: user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
        bio: user.bio, skills: [], certifications: [], experience: 'Não informado', services: [],
        sectors: [], completed: 0, responseTime: 'A combinar',
      })
    }
    return toAppUser(user)
  })
}

export async function convertClientToProvider(request: Request, cpf: string): Promise<AppUser> {
  return updateState(database => {
    const user = requireCurrentUser(database, request)
    if (user.role !== 'cliente') throw new BackendError('A conta já possui perfil de prestador.', 409)
    if (typeof cpf !== 'string' || !/^\d{11}$/.test(cpf)) {
      throw new BackendError('O CPF deve conter exatamente 11 dígitos.', 400)
    }

    const providerProfileId = database.nextProviderId++
    user.role = 'prestador'
    user.cpf = cpf
    user.providerProfileId = providerProfileId
    database.providers.push({
      id: providerProfileId,
      userId: user.id,
      name: user.name,
      role: 'Prestador de serviços',
      city: user.location || 'Localização não informada',
      rating: user.rating,
      reviews: user.reviews,
      photo: user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
      bio: user.bio,
      skills: [...user.skills],
      certifications: [...user.certifications],
      experience: 'Não informado',
      services: [],
      sectors: [],
      completed: 0,
      responseTime: 'A combinar',
      availability: user.availability || undefined,
      serviceFormat: user.serviceFormat || undefined,
      links: [...user.links],
    })

    return toAppUser(user)
  })
}

function notification(database: Database, userId: string, title: string, message: string, type: Notification['type'] = 'info'): void {
  database.notifications.unshift({
    id: randomUUID(), userId, type, title, message, read: false, createdAt: new Date().toISOString(),
  })
}

function mapJob(database: Database, payload: CreatePostCommand, client: StoredUser): Job {
  const sector = database.categories.find(category => category.id === payload.SectorId)
  const serviceType = sector?.serviceTypes?.[payload.ServiceTypeId - 1]
  if (!sector || !serviceType) throw new BackendError('Setor ou tipo de serviço não encontrado.', 400)
  const id = database.nextJobId++
  return {
    id,
    title: payload.Title,
    category: sector.name,
    description: payload.Description,
    price: payload.Price,
    duration: payload.DeliveryDays,
    status: 'Em análise',
    provider: 'A definir',
    rating: 0,
    urgency: 'MÉDIA',
    postedAt: new Date().toISOString(),
    skills: [],
    subSector: serviceType,
    remote: true,
    negotiable: false,
    salaryMin: payload.Price,
    salaryMax: payload.Price,
    clientName: client.name,
    clientRating: client.rating,
    clientId: client.id,
    deliveryHours: payload.DeliveryHours,
    sectorId: payload.SectorId,
    serviceTypeId: payload.ServiceTypeId,
  }
}

export async function listJobs(request: Request): Promise<Job[]> {
  const database = await readState()
  const currentUser = requireCurrentUser(database, request)
  if (currentUser.role === 'cliente') return database.jobs.filter(job => job.clientId === currentUser.id)
  return database.jobs.filter(job => job.status === 'Em análise' || job.providerUserId === currentUser.id)
}

export async function createJob(request: Request, payload: CreatePostCommand): Promise<Job> {
  return updateState(database => {
    const client = requireCurrentUser(database, request)
    if (!payload || typeof payload.Title !== 'string' || !payload.Title.trim() ||
      typeof payload.Description !== 'string' || !payload.Description.trim() ||
      typeof payload.DeliveryDays !== 'string' || typeof payload.DeliveryHours !== 'string' ||
      !Number.isFinite(payload.Price) || payload.Price <= 0 ||
      !Number.isInteger(payload.SectorId) || !Number.isInteger(payload.ServiceTypeId) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.DeliveryDays) || !/^\d{2}:\d{2}:\d{2}$/.test(payload.DeliveryHours)) {
      throw new BackendError('Os dados do trabalho são inválidos.', 400)
    }
    if (client.role !== 'cliente') throw new BackendError('Somente clientes podem publicar trabalhos.', 403)
    const job = mapJob(database, payload, client)
    const category = database.categories.find(item => item.id === payload.SectorId)
    if (category) category.count += 1
    database.jobs.unshift(job)
    return job
  })
}

export async function updateJobStatus(request: Request, jobId: number, status: Job['status']): Promise<Job> {
  return updateState(database => {
    const currentUser = requireCurrentUser(database, request)
    const job = database.jobs.find(item => item.id === jobId)
    if (!job) throw new BackendError('Trabalho não encontrado.', 404)
    if (status === 'Em andamento' && job.status === 'Em análise') {
      if (currentUser.role !== 'prestador') throw new BackendError('Somente um prestador pode aceitar este trabalho.', 403)
      job.providerUserId = currentUser.id
      job.providerId = currentUser.providerProfileId || currentUser.numericId
      job.provider = currentUser.name
      job.status = status
      notification(database, job.clientId || '', 'Trabalho aceito', `${currentUser.name} aceitou “${job.title}”.`, 'success')
      return job
    }
    if (job.providerUserId !== currentUser.id) throw new BackendError('Somente o prestador responsável pode atualizar este trabalho.', 403)
    if (status === 'Concluído') {
      if (job.status !== 'Em andamento') throw new BackendError('O trabalho precisa estar em andamento antes da conclusão.', 409)
      job.providerCompletedAt = new Date().toISOString()
      job.status = status
      notification(database, job.clientId || '', 'Trabalho concluído pelo prestador', `${currentUser.name} marcou “${job.title}” como concluído.`, 'success')
      return job
    }
    if (status === 'Recusado') {
      job.status = status
      job.providerUserId = undefined
      job.providerId = undefined
      job.provider = 'A definir'
      return job
    }
    if (status === 'Em planejamento' && job.status === 'Em andamento') {
      job.status = status
      return job
    }
    throw new BackendError('Transição de status inválida.', 409)
  })
}

export async function confirmJobCompletion(request: Request, jobId: number): Promise<Job> {
  return updateState(database => {
    const client = requireCurrentUser(database, request)
    const job = database.jobs.find(item => item.id === jobId)
    if (!job) throw new BackendError('Trabalho não encontrado.', 404)
    if (job.clientId !== client.id) throw new BackendError('Somente o cliente responsável pode confirmar a conclusão.', 403)
    if (!job.providerCompletedAt) throw new BackendError('O prestador ainda não concluiu o trabalho.', 409)
    if (job.clientConfirmedAt) throw new BackendError('A conclusão já foi confirmada.', 409)
    job.clientConfirmedAt = new Date().toISOString()
    job.reviewPending = true
    const provider = database.providers.find(item => item.userId === job.providerUserId)
    if (provider) provider.completed += 1
    return job
  })
}

export async function submitReview(request: Request, payload: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  return updateState(database => {
    const client = requireCurrentUser(database, request)
    const job = database.jobs.find(item => item.id === payload.jobId)
    if (!job) throw new BackendError('Trabalho não encontrado.', 404)
    if (job.clientId !== client.id || !job.clientConfirmedAt) throw new BackendError('Confirme a conclusão do trabalho antes de avaliar.', 409)
    if (database.reviews.some(review => review.jobId === job.id)) throw new BackendError('Este trabalho já foi avaliado.', 409)
    if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) throw new BackendError('A nota deve ser de 1 a 5.', 400)
    const review: Review = { ...payload, id: randomUUID(), createdAt: new Date().toISOString(), clientId: client.id, providerId: job.providerId || payload.providerId, providerUserId: job.providerUserId }
    database.reviews.unshift(review)
    job.reviewPending = false
    job.reviewId = review.id
    if (job.providerUserId) {
      const providerUser = database.users.find(user => user.id === job.providerUserId)
      if (providerUser) {
        providerUser.rating = (providerUser.rating * providerUser.reviews + review.rating) / (providerUser.reviews + 1)
        providerUser.reviews += 1
      }
      const providerProfile = database.providers.find(item => item.userId === job.providerUserId)
      if (providerProfile) {
        providerProfile.rating = (providerProfile.rating * providerProfile.reviews + review.rating) / (providerProfile.reviews + 1)
        providerProfile.reviews += 1
      }
    }
    notification(database, job.providerUserId || '', 'Nova avaliação', `Você recebeu uma avaliação de ${review.rating} estrelas em “${job.title}”.`, 'success')
    return review
  })
}

export async function listHistory(request: Request, type: string): Promise<Array<Job | Review | { provider: string; providerId: number; completedJobs: number }>> {
  const database = await readState()
  const user = requireCurrentUser(database, request)
  const userJobs = database.jobs.filter(job => user.role === 'cliente' ? job.clientId === user.id : job.providerUserId === user.id)
  if (type === 'avaliacoes') {
    return database.reviews.filter(review => user.role === 'cliente' ? review.clientId === user.id : review.providerUserId === user.id)
  }
  if (type === 'profissionais') {
    const completed = userJobs.filter(job => job.clientConfirmedAt && job.providerUserId)
    const unique = new Map<string, { provider: string; providerId: number; completedJobs: number }>()
    for (const job of completed) {
      const key = job.providerUserId!
      const entry = unique.get(key) || { provider: job.provider || 'Prestador', providerId: job.providerId || 0, completedJobs: 0 }
      entry.completedJobs += 1
      unique.set(key, entry)
    }
    return [...unique.values()]
  }
  if (type === 'andamento') return userJobs.filter(job => !job.clientConfirmedAt && job.status !== 'Recusado')
  return userJobs.filter(job => Boolean(job.clientConfirmedAt))
}

export async function getCategories(): Promise<Category[]> {
  return (await readState()).categories
}

export async function getServices(request: Request): Promise<Service[]> {
  const database = await readState()
  const user = requireCurrentUser(database, request)
  const jobs = user.role === 'cliente'
    ? database.jobs.filter(job => job.clientId === user.id)
    : database.jobs.filter(job => job.providerUserId === user.id)
  return jobs.map(job => ({
    id: job.id, title: job.title, category: job.category, description: job.description, price: job.price,
    duration: job.duration, status: job.status, provider: job.provider, rating: job.rating,
  }))
}

export async function createService(request: Request, payload: CreatePostCommand): Promise<Service> {
  const job = await createJob(request, payload)
  return {
    id: job.id, title: job.title, category: job.category, description: job.description, price: job.price,
    duration: job.duration, status: job.status, provider: job.provider, rating: job.rating,
  }
}

export async function getProviders(sector?: string, subSector?: string): Promise<ProviderProfile[]> {
  const database = await readState()
  return database.providers
    .filter(provider => (!sector || provider.sectors.includes(sector)) &&
      (!subSector || provider.skills.some(skill => skill.toLowerCase().includes(subSector.toLowerCase())) || provider.services.some(service => service.toLowerCase().includes(subSector.toLowerCase()))))
    .sort((left, right) => right.rating - left.rating)
}

export async function getProvider(id: number): Promise<ProviderProfile> {
  const provider = (await readState()).providers.find(item => item.id === id)
  if (!provider) throw new BackendError('Prestador não encontrado.', 404)
  return provider
}

export async function addFavorite(request: Request, jobId: number): Promise<Favorite> {
  return updateState(database => {
    const user = requireCurrentUser(database, request)
    if (!database.jobs.some(job => job.id === jobId)) throw new BackendError('Trabalho não encontrado.', 404)
    const favorite = database.favorites.find(item => item.userId === user.id && item.jobId === jobId)
    if (favorite) return favorite
    const created = { userId: user.id, jobId, createdAt: new Date().toISOString() }
    database.favorites.push(created)
    return created
  })
}

export async function removeFavorite(request: Request, jobId: number): Promise<void> {
  await updateState(database => {
    const user = requireCurrentUser(database, request)
    database.favorites = database.favorites.filter(item => !(item.userId === user.id && item.jobId === jobId))
  })
}

export async function listFavoriteIds(request: Request): Promise<number[]> {
  const database = await readState()
  const user = requireCurrentUser(database, request)
  return database.favorites.filter(item => item.userId === user.id).map(item => item.jobId)
}

export async function listNotifications(request: Request): Promise<Notification[]> {
  const user = await getCurrentUser(request)
  if (!user) throw new BackendError('Faça login para continuar.', 401)
  return (await readState()).notifications.filter(item => item.userId === user.id).map(({ userId: _userId, ...item }) => item)
}

export async function markNotificationRead(request: Request, id: string): Promise<Notification> {
  return updateState(database => {
    const user = requireCurrentUser(database, request)
    const item = database.notifications.find(notificationItem => notificationItem.id === id && notificationItem.userId === user.id)
    if (!item) throw new BackendError('Notificação não encontrada.', 404)
    item.read = true
    const { userId: _userId, ...result } = item
    return result
  })
}

export async function createApplication(request: Request, payload: Omit<Application, 'id' | 'createdAt' | 'status'>): Promise<Application> {
  return updateState(database => {
    const applicant = requireCurrentUser(database, request)
    const job = database.jobs.find(item => item.id === payload.jobId)
    if (!job || job.status !== 'Em análise') throw new BackendError('Trabalho indisponível para candidatura.', 409)
    if (applicant.role !== 'prestador') throw new BackendError('Somente prestadores podem se candidatar.', 403)
    const existing = database.applications.find(item => item.jobId === job.id && item.applicantId === applicant.id)
    if (existing) throw new BackendError('Você já se candidatou a este trabalho.', 409)
    const application: Application = { ...payload, id: randomUUID(), createdAt: new Date().toISOString(), status: 'pending', applicantId: applicant.id, clientId: job.clientId || '' }
    database.applications.push(application)
    notification(database, job.clientId || '', 'Nova candidatura', `${applicant.name} se candidatou a “${job.title}”.`)
    return application
  })
}

export async function listApplications(request: Request): Promise<Application[]> {
  const database = await readState()
  const user = requireCurrentUser(database, request)
  return database.applications.filter(item => item.clientId === user.id || item.applicantId === user.id)
}

function requireJobConversation(database: Database, request: Request, conversationId: string): { user: StoredUser; job: Job } {
  const user = requireCurrentUser(database, request)
  const jobId = Number(conversationId)
  if (!Number.isSafeInteger(jobId) || jobId <= 0) throw new BackendError('Identificador de conversa inválido.', 400)
  const job = database.jobs.find(item => item.id === jobId)
  if (!job) throw new BackendError('Trabalho não encontrado.', 404)
  if (job.providerUserId !== user.id && job.clientId !== user.id) throw new BackendError('Você não tem acesso a esta conversa.', 403)
  if (!job.providerUserId || (job.status !== 'Em andamento' && job.status !== 'Concluído')) {
    throw new BackendError('A conversa fica disponível depois que um prestador aceita o trabalho.', 409)
  }
  return { user, job }
}

export async function listMessages(request: Request, conversationId: string): Promise<ChatMessage[]> {
  const database = await readState()
  requireJobConversation(database, request, conversationId)
  return database.messages.filter(message => message.conversationId === conversationId)
}

export async function sendMessage(request: Request, payload: Omit<ChatMessage, 'id' | 'createdAt' | 'status'>): Promise<ChatMessage> {
  return updateState(database => {
    if (!payload.text?.trim()) throw new BackendError('A mensagem não pode ficar vazia.', 400)
    const { user } = requireJobConversation(database, request, payload.conversationId)
    const message: ChatMessage = { ...payload, id: randomUUID(), sender: user.name, createdAt: new Date().toISOString(), status: 'sent' }
    database.messages.push(message)
    return message
  })
}

export async function requestContact(request: Request, payload: ContactRequest): Promise<ContactRequest> {
  return updateState(database => {
    const job = database.jobs.find(item => item.id === payload.jobId)
    if (!job) throw new BackendError('Trabalho não encontrado.', 404)
    const { user } = requireJobConversation(database, request, String(payload.jobId))
    const contactRequest = {
      jobId: job.id,
      providerName: job.provider || user.name,
      clientName: job.clientName || 'Cliente',
      message: payload.message,
    }
    database.contactRequests.push(contactRequest)
    return contactRequest
  })
}

export async function listContactRequests(request: Request): Promise<ContactRequest[]> {
  const database = await readState()
  const user = requireCurrentUser(database, request)
  return database.contactRequests.filter(item => {
    const job = database.jobs.find(candidate => candidate.id === item.jobId)
    return job?.clientId === user.id || job?.providerUserId === user.id
  })
}

export async function listReviews(): Promise<Review[]> {
  return (await readState()).reviews
}

export async function markReviewPending(request: Request, jobId: number): Promise<Job> {
  const database = await readState()
  const job = database.jobs.find(item => item.id === jobId)
  if (!job || job.clientId !== getSessionUserId(request)) throw new BackendError('Trabalho não encontrado para este cliente.', 404)
  if (!job.clientConfirmedAt) throw new BackendError('Confirme a conclusão antes de avaliar.', 409)
  return job
}

export async function getJob(request: Request, jobId: number): Promise<Job> {
  const database = await readState()
  const user = requireCurrentUser(database, request)
  const job = database.jobs.find(item => item.id === jobId)
  if (!job) throw new BackendError('Trabalho não encontrado.', 404)
  if (user.id !== job.clientId && user.id !== job.providerUserId) {
    throw new BackendError('Você não tem acesso a este trabalho.', 403)
  }
  return job
}
