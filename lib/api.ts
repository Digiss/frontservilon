export type Role = 'cliente' | 'prestador'
export type ActiveProfile = 'Client' | 'FreeLancer'

export type CreateClientCommand = {
  UserName: string
  Email: string
  PasswordHash: string
  Name: string
  PhoneNumber: string
  PhotoUrl: string | null
  BirthDate: string
  Address: string | null
}

export type CreateClientSimplifiedCommand = { UserId: number; Address: string | null }
export type CreateFreeLancerCommand = Omit<CreateClientCommand, 'Address'> & { CPF: string }
export type CreateFreeLancerSimplifiedCommand = { UserId: number; CPF: string }
export type CreateUserCommand = Omit<CreateClientCommand, 'Address'>

export type CreatePostCommand = {
  Title: string
  Description: string
  Price: number
  DeliveryDays: string
  DeliveryHours: string
  SectorId: number
  ServiceTypeId: number
}

export type LoginCommand = {
  UserName: string | null
  Email: string | null
  Password: string
  Profile: ActiveProfile
}

export type RefreshTokenCommand = { OldRefreshToken: string }
export type SwitchProfileCommand = { UserId: number; RefreshToken: string }

export type AppUser = {
  id: string
  username: string
  name: string
  email: string
  role: Role
  location: string
  bio: string
  skills: string[]
  certifications: string[]
  history: string[]
  availability: string
  serviceFormat: string
  links: { label: string; url: string }[]
  rating: number
  reviews: number
}

export type Application = { id: string; jobId: number; applicantId: string; clientId: string; message: string; status: 'pending' | 'accepted' | 'declined'; createdAt: string }
export type Review = { id: string; jobId: number; providerId: number; providerUserId?: string; clientId: string; rating: number; comment: string; createdAt: string }

export type Service = {
  id: number
  title: string
  category: string
  description: string
  price: number
  duration: string
  status: 'Fazendo' | 'Em análise' | 'Em planejamento' | 'Em andamento' | 'Concluído' | 'Recusado'
  provider: string
  rating: number
}

export type Alert = Service & { urgency: 'ALTA' | 'MÉDIA'; postedAt: string; skills: string[] }

export type Job = Alert & {
  invitedProviderId?: number
  invitedProviderName?: string
  subSector: string
  location?: string
  remote: boolean
  negotiable: boolean
  salaryMin: number
  salaryMax: number
  clientName?: string
  clientRating?: number
  clientId?: string
  providerId?: number
  providerUserId?: string
  deliveryHours?: string
  sectorId?: number
  serviceTypeId?: number
  providerCompletedAt?: string
  clientConfirmedAt?: string
  reviewPending?: boolean
  reviewId?: string
  attachments?: string[]
  requirements?: string[]
  dueDate?: string
}

export type ChatMessage = { id: string; conversationId: string; sender: string; text: string; attachment?: { name: string; url: string }; createdAt: string; status: 'sent' | 'received' | 'read' | 'pending' }
export type ContactRequest = { jobId: number; providerName: string; clientName: string; message: string }
export type Notification = { id: string; type: 'success' | 'error' | 'info'; title: string; message: string; read: boolean; createdAt: string }
export type Favorite = { userId: string; jobId: number; createdAt: string }
export type JobFilters = { query?: string; category?: string; subSector?: string; page?: number; pageSize?: number }
export type Category = { id: number; name: string; count: number; icon: string; serviceTypes: string[] }

export type ProviderProfile = {
  id: number
  userId?: string
  name: string
  role: string
  city: string
  rating: number
  reviews: number
  photo: string
  bio: string
  skills: string[]
  certifications: string[]
  experience: string
  services: string[]
  sectors: string[]
  completed: number
  responseTime: string
  links?: { label: string; url: string }[]
  availability?: string
  serviceFormat?: string
}

export type HistoryType = 'concluidos' | 'andamento' | 'avaliacoes' | 'profissionais'
export type HistoryEntry = Job | Review | { provider: string; providerId: number; completedJobs: number }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!response.ok) {
    let message = `Falha na solicitação (${response.status}).`
    try {
      const body = await response.json() as { error?: string }
      if (body.error) message = body.error
    } catch {
      throw new Error(message)
    }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  login: (payload: LoginCommand) => request<{ user: AppUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }).then(response => response.user),
  register: (profile: ActiveProfile, payload: CreateClientCommand | CreateFreeLancerCommand) =>
    request<{ user: AppUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ profile, payload }) }).then(response => response.user),
  getSession: () => request<{ user: AppUser | null }>('/api/auth/session').then(response => response.user),
  convertClientToProvider: (CPF: string) =>
    request<{ user: AppUser }>('/api/perfil/prestador', { method: 'POST', body: JSON.stringify({ CPF }) }).then(response => response.user),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getCategories: () => request<Category[]>('/api/categorias'),
  getServices: (type?: string) => request<Service[]>(`/api/servicos${type ? `?tipo=${encodeURIComponent(type)}` : ''}`),
  getAlerts: () => request<Alert[]>('/api/servicos/alertas'),
  getJobs: async (filters?: JobFilters) => {
    const jobs = await request<Job[]>(`/api/jobs?page=${filters?.page || 1}&pageSize=${filters?.pageSize || 50}`)
    const query = filters?.query?.toLowerCase() || ''
    return jobs.filter(job =>
      (!query || `${job.title} ${job.description} ${job.subSector} ${job.skills.join(' ')}`.toLowerCase().includes(query)) &&
      (!filters?.category || job.category === filters.category) &&
      (!filters?.subSector || job.subSector === filters.subSector),
    )
  },
  getFavoriteJobIds: () => request<number[]>('/api/favoritos'),
  setFavoriteJob: (jobId: number, favorite: boolean) => request('/api/favoritos', {
    method: favorite ? 'POST' : 'DELETE',
    body: JSON.stringify({ jobId }),
  }),
  getNotifications: (_userId?: string) => request<Notification[]>('/api/notificacoes'),
  markNotificationRead: (id: string) => request<Notification>(`/api/notificacoes/${encodeURIComponent(id)}`, { method: 'PATCH' }),
  createJob: (payload: CreatePostCommand) => request<Job>('/api/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  getProviders: (sector?: string, subSector?: string) => request<ProviderProfile[]>(
    `/api/prestadores${sector ? `?setor=${encodeURIComponent(sector)}${subSector ? `&subsetor=${encodeURIComponent(subSector)}` : ''}` : ''}`,
  ),
  getProvider: (id: number) => request<ProviderProfile>(`/api/prestadores/${id}`),
  createService: (payload: CreatePostCommand) => request<Service>('/api/servicos', { method: 'POST', body: JSON.stringify(payload) }),
  acceptService: (id: number) => request<Job>(`/api/servicos/${id}/aceitar`, { method: 'POST' }),
  updateJobStatus: (id: number, status: Job['status']) =>
    request<Job>(`/api/jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  markReviewPending: (jobId: number) => request<Job>('/api/avaliacoes/pendente', { method: 'POST', body: JSON.stringify({ jobId }) }),
  confirmClientCompletion: (jobId: number) => request<Job>(`/api/jobs/${jobId}/complete`, { method: 'POST' }),
  submitReview: (payload: Omit<Review, 'id' | 'createdAt'>) =>
    request<Review>('/api/avaliacoes', { method: 'POST', body: JSON.stringify(payload) }),
  getHistory: (type: HistoryType) => request<HistoryEntry[]>(`/api/historico?tipo=${type}`),
  getMessages: (conversationId: string) => request<ChatMessage[]>(`/api/chat/mensagens?conversationId=${encodeURIComponent(conversationId)}`),
  sendMessage: (payload: Omit<ChatMessage, 'id' | 'createdAt' | 'status'>) =>
    request<ChatMessage>('/api/chat/mensagens', { method: 'POST', body: JSON.stringify(payload) }),
  requestContact: (payload: ContactRequest) =>
    request('/api/chat/solicitacoes', { method: 'POST', body: JSON.stringify(payload) }),
  applyToJob: (payload: Omit<Application, 'id' | 'createdAt' | 'status'>) =>
    request<Application>('/api/candidaturas', { method: 'POST', body: JSON.stringify(payload) }),
  getApplications: (_userId?: string) => request<Application[]>('/api/candidaturas'),
}
