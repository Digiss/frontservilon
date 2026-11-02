'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BookOpen, BriefcaseBusiness, ChevronRight, CirclePlus, Heart, Home, Leaf, MessageCircle, Monitor, Palette, Search, Scale, TrendingUp, UserRound, Wrench, MapPin, Clock3 } from 'lucide-react'
import { api, type ActiveProfile, type Alert, type CreateClientCommand, type HistoryEntry, type HistoryType, type ProviderProfile, type Service } from '@/lib/api'
import { PostSearchScreen } from './post-search-screen'
import { PostCreateForm } from './post-create-form'
import { PostDetailsScreen } from './post-details-screen'
import { InterestAreaPicker, InterestAreasProfile, InterestAreasSettings } from './interest-area-picker'
import { NegotiationsScreen } from './negotiations-screen'
import { formatPostPriceRange } from '@/lib/post-mapper'

type Role = 'cliente' | 'prestador'
const icons = { monitor: Monitor, 'trending-up': TrendingUp, 'book-open': BookOpen, leaf: Leaf, heart: Heart, scale: Scale, palette: Palette, wrench: Wrench }
function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded bg-current/10 ${className}`} /> }
function Avatar({ name, large = false, photoUrl }: { name: string; large?: boolean; photoUrl?: string | null }) { return <div className={`${large ? 'h-16 w-16 text-lg' : 'h-10 w-10 text-xs'} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-current/20 bg-gradient-to-br from-[#e5eee8] via-[#adbdb2] to-[#43564a] font-bold text-[#122018]`}>{photoUrl ? <img src={photoUrl} alt={name} className="h-full w-full object-cover" /> : name.split(' ').map(v => v[0]).join('')}</div> }
function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) { return <header className="mb-5 flex items-start justify-between border-b border-current/15 pb-4"><div><h1 className="text-[18px] font-extrabold tracking-tight">{title}</h1><p className="mt-1 text-[11px] opacity-65">{subtitle}</p></div>{action}</header> }
function BottomNav({ tab, onTab, role }: { tab: string; onTab: (tab: string) => void; role: Role }) { const items = [['home', Home], ['search', Search], ['create', CirclePlus], ['messages', MessageCircle], ['profile', UserRound] ] as const; return <nav className={`fixed bottom-0 left-1/2 z-30 flex h-14 w-full max-w-[900px] -translate-x-1/2 items-center justify-around border-t px-3 backdrop-blur ${role === 'cliente' ? 'border-black/10 bg-[#dff3e5]/95' : 'border-white/10 bg-[#030507]/95'}`}>{items.map(([key, Icon]) => <button key={key} onClick={() => onTab(key)} aria-label={key} className={`relative flex h-10 w-12 items-center justify-center rounded-2xl transition ${tab === key ? (role === 'cliente' ? 'bg-[#b9e5c8] text-[#0d7e3d]' : 'bg-[#111a29] text-[#35d878]') : 'opacity-65'}`}><Icon size={19} strokeWidth={1.7} /></button>)}</nav> }
function NotificationCard({ notification, onRead }: { notification: import('@/lib/api').Notification; onRead: () => void }) { return <button onClick={onRead} className="w-full border-b border-current/10 p-3 text-left"><div className="flex items-start justify-between gap-3"><div><strong className="block text-[11px]">{notification.title}</strong><p className="mt-1 text-[10px] opacity-70">{notification.message}</p></div><span className={`mt-1 h-2 w-2 rounded-full ${notification.read ? 'bg-current/20' : 'bg-[#35d878]'}`} /></div></button> }
function NotificationModal({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<import('@/lib/api').Notification[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getNotifications()
      .then(setNotifications)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as notificações.'))
  }, [])

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id)
      setNotifications(items => items?.map(item => item.id === id ? { ...item, read: true } : item) || [])
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar a notificação.')
    }
  }

  return <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"><div className="w-full max-w-[400px] rounded-2xl bg-[#effbf2] p-4 text-black shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-[15px] font-extrabold">Notificações</h2><button onClick={onClose} aria-label="Fechar" className="text-xl opacity-60">×</button></div>{error && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}<div className="mt-3 max-h-[60vh] overflow-y-auto">{notifications === null && !error ? <><Skeleton className="mb-2 h-14 rounded-xl" /><Skeleton className="h-14 rounded-xl" /></> : notifications?.length ? notifications.map(item => <NotificationCard key={item.id} notification={item} onRead={() => { void markRead(item.id) }} />) : !error && <p className="p-6 text-center text-[11px] opacity-60">Nenhuma notificação nova.</p>}</div></div></div>
}
function HistoryScreen({ type, onBack, onJob }: { type: HistoryType; onBack: () => void; onJob: (job: import('@/lib/api').Job) => void }) {
  const labels: Record<HistoryType, string> = { concluidos: 'Serviços concluídos', andamento: 'Em andamento', avaliacoes: 'Avaliações', profissionais: 'Profissionais contratados', criados: 'Serviços criados' }
  const [selectedType, setSelectedType] = useState(type)
  const [items, setItems] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setItems(null)
    setError('')
    api.getHistory(selectedType).then(setItems).catch(reason => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o histórico.'))
  }, [selectedType])
  return <>
    <Header title="Histórico" subtitle={labels[selectedType]} action={<button onClick={onBack} className="text-[11px] font-bold text-[#087a39]">Voltar</button>} />
    <div className="mb-4 grid grid-cols-2 gap-2">{(Object.keys(labels) as HistoryType[]).map(item => <button key={item} onClick={() => setSelectedType(item)} className={`rounded-xl p-3 text-[10px] font-bold ${item === selectedType ? 'bg-[#087a39] text-white' : 'bg-black/5'}`}>{labels[item]}</button>)}</div>
    {items === null && !error ? <Skeleton className="h-24 rounded-2xl" /> : error ? <p className="rounded-xl bg-red-500/10 p-4 text-[11px] text-red-600">{error}</p> : items?.length ? items.map((item, index) => (
      <article key={'title' in item ? item.id : 'rating' in item ? item.id : `${item.providerId}-${index}`} className="mb-2 rounded-2xl border border-black/10 bg-[#effbf2] p-4 text-[11px]">
        {'title' in item ? <button onClick={() => onJob(item)} className="w-full text-left"><strong>{item.title}</strong><p className="mt-1 opacity-65">{item.category} · {item.status} · {formatPostPriceRange(item.salaryMin, item.salaryMax)}</p>{item.provider && <p className="mt-1 opacity-65">Prestador: {item.provider}</p>}</button> :
          'rating' in item ? <><strong>{'comment' in item && item.comment ? item.comment : 'Avaliação enviada'}</strong><p className="mt-1 text-[#087a39]">{'★'.repeat(item.rating)} · {new Date(item.createdAt).toLocaleDateString('pt-BR')}</p></> :
            <><strong>{item.provider}</strong><p className="mt-1 opacity-65">{item.completedJobs} serviço(s) concluído(s)</p></>}
      </article>
    )) : <div className="rounded-2xl border border-dashed border-black/20 p-8 text-center text-[11px] opacity-60">Nenhum registro encontrado.</div>}
  </>
}
function HomeScreen({ role, onTab, user, onNotifications, onJob, onProvider }: { role: Role; onTab: (tab: string) => void; user: import('@/lib/api').AppUser; onNotifications: () => void; onJob: (job: import('@/lib/api').Job, canCancel: boolean) => void; onProvider: (provider: ProviderProfile) => void }) {
  const [jobs, setJobs] = useState<import('@/lib/api').Job[] | null>(null)
  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [receivedReviews, setReceivedReviews] = useState<import('@/lib/api').Review[]>([])
  const [providerStats, setProviderStats] = useState<import('@/lib/api').ProviderDashboardStats | null>(null)
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    const jobsRequest = role === 'prestador'
      ? Promise.all([api.getJobFeed(), api.getOwnJobs()]).then(([feed, own]) => [...feed, ...own])
      : api.getOwnJobs()
    Promise.all([
      jobsRequest,
      api.getProviders(),
      role === 'prestador' ? api.getHistory('avaliacoes') : Promise.resolve([]),
      role === 'prestador' ? api.getProviderDashboard() : Promise.resolve(null),
    ])
      .then(([loadedJobs, loadedProviders, loadedReviews, stats]) => {
        setJobs(loadedJobs)
        setProviders(loadedProviders)
        setReceivedReviews(loadedReviews.filter((entry): entry is import('@/lib/api').Review => 'rating' in entry))
        setProviderStats(stats)
      })
      .catch(reason => setLoadError(reason instanceof Error ? reason.message : 'Não foi possível carregar o painel.'))
  }, [role])
  const activeJobs = jobs?.filter(job => !['Concluído', 'Recusado', 'Cancelado', 'Excluído'].includes(job.status)).length || 0
  const completedJobs = jobs?.filter(job => Boolean(job.clientConfirmedAt)).length || 0
  return role === 'prestador' ? <>
    <Header title="Painel do Prestador" subtitle={user.name} />
    <div className="mb-3 flex justify-end"><button onClick={onNotifications} aria-label="Abrir notificações" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#111827] text-[#35d878]"><Bell size={18} /></button></div>
    <div className="grid grid-cols-3 gap-2"><Metric value={String(jobs?.filter(job => job.status === 'Não iniciado' || job.status === 'Em análise').length || 0)} label="Disponíveis" /><Metric value={String(jobs?.filter(job => job.status === 'Em andamento' || job.status === 'Em planejamento' || job.status === 'Pausado').length || 0)} label="Em execução" /><Metric value={String(completedJobs)} label="Concluídos" /></div>
    {loadError && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-300">{loadError}</p>}
    <section className="mt-5 rounded-2xl border border-white/10 bg-[#111827] p-4"><h2 className="text-[12px] font-bold text-[#35d878]">Entregas nos próximos 7 dias</h2><div className="mt-3 flex gap-2 overflow-x-auto">{Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); const dateKey = date.toLocaleDateString('sv-SE'); const dueJobs = (jobs || []).filter(job => job.providerUserId && ['Em planejamento', 'Em andamento', 'Pausado'].includes(job.status) && (job.dueDate || job.duration).slice(0, 10) === dateKey); return <div key={dateKey} className="min-w-[72px] rounded-xl bg-white/5 p-2 text-center"><small className="block text-[9px] opacity-60">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</small><strong className="block text-[12px]">{date.toLocaleDateString('pt-BR', { day: '2-digit' })}</strong><span className="text-[9px] text-[#35d878]">{dueJobs.length} entrega(s)</span></div> })}</div></section>
    <div className="mt-3 grid grid-cols-2 gap-2"><Metric value={`R$ ${(providerStats?.averagePrice || 0).toLocaleString('pt-BR')}`} label="Preço médio do nicho" /><Metric value={`${providerStats?.averageDeliveryDays || 0} dias`} label="Prazo médio" /><Metric value={String(providerStats?.availableJobs || 0)} label="Oportunidades compatíveis" /><Metric value={String(providerStats?.activeAssignments || 0)} label="Trabalhos em execução" /><Metric value={String(providerStats?.providerCount || providers.length)} label="Prestadores na plataforma" /></div>
    <h2 className="mb-2 mt-7 text-[13px] font-bold text-[#35d878]">Avaliações recebidas</h2>
    {receivedReviews.length ? receivedReviews.slice(0, 3).map(review => <article key={review.id} className="mb-2 rounded-2xl border border-white/10 bg-[#111827] p-3"><div className="flex items-start gap-3"><Avatar name={review.clientName || 'Cliente'} /><div><strong className="text-[11px]">{review.clientName || 'Cliente'} · {'★'.repeat(review.rating)}</strong><p className="mt-1 text-[10px] opacity-65">{review.comment || 'Sem comentário.'}</p></div></div></article>) : <p className="rounded-xl bg-[#111827] p-4 text-[10px] opacity-65">Você ainda não recebeu avaliações.</p>}
    <h2 className="mb-2 mt-8 text-[13px] font-bold text-[#35d878]">Trabalhos disponíveis</h2>
    {jobs?.filter(job => job.status === 'Em análise' || job.status === 'Não iniciado').slice(0, 3).map(job => <button key={job.id} onClick={() => onJob(job, false)} className="mb-2 block w-full rounded-2xl border border-white/10 bg-[#111827] p-4 text-left"><strong className="block text-[12px]">{job.title}</strong><span className="mt-1 block text-[10px] opacity-65">{job.category} · {formatPostPriceRange(job.salaryMin, job.salaryMax)}</span></button>)}
    {!jobs?.some(job => job.status === 'Em análise' || job.status === 'Não iniciado') && <p className="rounded-xl bg-[#111827] p-4 text-[11px] opacity-65">Nenhum trabalho disponível no momento.</p>}
  </> : <>
    <div className="home-welcome mb-5"><p className="text-[12px] opacity-70">Bem-vindo,</p><h1 className="text-[21px] font-extrabold">{user.name}</h1></div>
    <div className="rounded-2xl border border-black/10 bg-[#effbf2] p-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#35d878] text-black">{activeJobs}</span><div><b className="block text-[11px]">{activeJobs} trabalho(s) em andamento</b><small className="text-[9px] opacity-65">{completedJobs} concluído(s)</small></div></div></div>
    <div className="mb-3 mt-4 flex justify-end"><button onClick={onNotifications} aria-label="Abrir notificações" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#effbf2] text-[#087a39]"><Bell size={18} /></button></div>
    {loadError && <p className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{loadError}</p>}
    <h2 className="mb-2 mt-6 text-[13px] font-bold text-[#087a39]">Prestadores</h2>
    <div className="flex gap-2 overflow-x-auto">{providers.slice(0, 4).map(provider => <button key={provider.id} onClick={() => onProvider(provider)} className="min-w-[126px] rounded-2xl border border-black/10 bg-[#effbf2] p-3 text-center"><Avatar name={provider.name} photoUrl={provider.photoUrl} /><b className="mt-2 block text-[11px]">{provider.name}</b><small className="block truncate text-[9px] opacity-60">{provider.role}</small><strong className="text-[11px] text-[#087a39]">★ {provider.rating.toFixed(1)}</strong></button>)}</div>
    <h2 className="mb-2 mt-7 text-[13px] font-bold">Meus trabalhos</h2>
    {jobs?.slice(0, 3).map(job => <button key={job.id} onClick={() => onJob(job, true)} className="mb-2 w-full rounded-2xl border border-black/10 bg-[#effbf2] p-4 text-left"><div className="flex justify-between gap-2"><b className="text-[12px]">{job.title}</b><span className="text-[10px] text-[#087a39]">{job.status}</span></div><p className="mt-2 text-[10px] opacity-60">{job.provider || 'A definir'} · {formatPostPriceRange(job.salaryMin, job.salaryMax)}</p></button>)}
    {jobs?.length === 0 && <p className="rounded-xl border border-dashed border-black/20 p-5 text-center text-[11px] opacity-60">Você ainda não publicou nenhum trabalho.</p>}
  </>
}
function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-white/10 bg-[#111827] p-3"><b className="block text-[14px] text-[#35d878]">{value}</b><small className="text-[9px] opacity-60">{label}</small></div> }
function JobDetailScreen({ job, onBack, role, canCancel, onChat }: { job: import('@/lib/api').Job; onBack: () => void; role: Role; canCancel: boolean; onChat: () => void }) {
  const dark = role === 'prestador'
  const card = dark ? 'border-white/10 bg-[#111827]' : 'border-[#a8cdb4] bg-[#effbf2] text-black'
  const accent = dark ? 'text-[#35d878]' : 'text-[#087a39]'
  const [status, setStatus] = useState(job.status)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applicationSent, setApplicationSent] = useState(false)
  const cancelPost = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar este trabalho?')) return
    setUpdating(true)
    setError('')
    try {
      await api.cancelPost(job.id)
      setStatus('Cancelado')
      setNotice('Trabalho cancelado.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível cancelar o trabalho.')
    } finally {
      setUpdating(false)
    }
  }
  const apply = async () => {
    setUpdating(true)
    setError('')
    try {
      await api.applyToJob({ jobId: job.id, message: applicationMessage })
      setApplicationSent(true)
      setNotice('Candidatura enviada. Você receberá uma notificação quando o cliente responder.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a candidatura.')
    } finally {
      setUpdating(false)
    }
  }
  return <>
    <Header title="Detalhes do post" subtitle="Confira as informações do trabalho" action={<button onClick={onBack} className={`text-[11px] font-bold ${accent}`}>Voltar</button>} />
    <article className={`rounded-2xl border p-4 ${card}`}>
      <div className="flex items-start justify-between"><div><span className={`text-[10px] font-bold ${accent}`}>{job.category} · {job.subSector}</span><h1 className="mt-1 text-[17px] font-bold">{job.title}</h1></div><span className="rounded-full bg-[#123f2c] px-2 py-1 text-[9px] text-[#35d878]">{status}</span></div>
      {notice && <p className="mt-3 rounded-xl bg-[#123f2c] px-3 py-2 text-[10px] text-[#35d878]">{notice}</p>}
      {error && <p className={`mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[10px] ${dark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>}
      <p className="mt-4 text-[11px] leading-relaxed opacity-75">{job.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><Metric value={`R$ ${job.salaryMin.toLocaleString('pt-BR')}–${job.salaryMax.toLocaleString('pt-BR')}`} label="Faixa de orçamento" /><Metric value={job.duration} label="Prazo" /><Metric value={job.remote ? 'Remoto' : job.location || 'A combinar'} label="Formato" /><Metric value={job.negotiable ? 'Sim' : 'Não'} label="Negociável" /></div>
      {role === 'prestador' && !canCancel && <div className="mt-4 space-y-2"><label className="block text-[10px] font-bold text-[#35d878]">Mensagem para o cliente (opcional)<textarea value={applicationMessage} onChange={event => setApplicationMessage(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-white outline-none focus:border-[#35d878]" /></label><button disabled={updating || applicationSent} onClick={() => { void apply() }} className="w-full rounded-xl bg-[#35d878] px-3 py-3 text-[11px] font-bold text-black disabled:opacity-50">{updating ? 'Enviando...' : applicationSent ? 'Candidatura enviada' : 'Enviar candidatura'}</button><button onClick={onChat} className="w-full rounded-xl border border-[#35d878] px-3 py-3 text-[11px] font-bold text-[#35d878]">Ir ao chat</button></div>}
      {canCancel && !['Concluído', 'Cancelado', 'Excluído', 'Recusado'].includes(status) && <button disabled={updating} onClick={() => { void cancelPost() }} className="mt-4 w-full rounded-xl border border-red-500/40 px-3 py-3 text-[11px] font-bold text-red-600 disabled:opacity-50">{updating ? 'Cancelando...' : 'Cancelar trabalho'}</button>}
      <div className="mt-4"><h2 className="text-[12px] font-bold">Cliente</h2><p className="mt-1 text-[11px] opacity-70">{job.clientName || 'Cliente'}{job.clientRating ? ` · ★ ${job.clientRating.toFixed(1)}` : ''}</p></div>
      <div className="mt-4"><h2 className="text-[12px] font-bold">Requisitos</h2><ul className="mt-2 space-y-1 text-[11px] opacity-70">{(job.requirements || job.skills).map(item => <li key={item}>• {item}</li>)}</ul></div>
    </article>
  </>
}
function SearchScreen({ role, onPost }: { role: Role; onPost: (post: import('@/lib/api').Job) => void }) {
  return <PostSearchScreen role={role} onJob={onPost} />
}
function ServiceCard({ service, dark }: { service: Service; dark?: boolean }) { return <article className={`rounded-2xl border p-4 ${dark ? 'border-white/10 bg-[#111827]' : 'border-[#a8cdb4] bg-[#effbf2] text-black'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-[13px] font-bold leading-tight">{service.title}</h3><p className="mt-1 text-[10px] opacity-60">{service.category}</p></div><span className="rounded-full border border-[#35d878] bg-[#123f2c] px-2 py-1 text-[9px] font-bold text-[#35d878]">{service.status.toUpperCase()}</span></div><p className="mt-3 line-clamp-2 text-[11px] leading-relaxed opacity-65">{service.description}</p><div className="mt-3 flex items-center justify-between border-t border-current/10 pt-3"><span className="text-[10px] opacity-60">{service.duration}</span><strong className="text-[13px] text-[#087a39]">R$ {service.price.toLocaleString('pt-BR')}</strong></div></article> }
function ClientServicesScreen({ onCreated, onJob }: { onCreated: (job: import('@/lib/api').Job) => void; onJob?: (job: import('@/lib/api').Job) => void }) {
  const [creating, setCreating] = useState(false)
  if (creating) return <PostCreateForm role="cliente" onCancel={() => setCreating(false)} onCreated={job => { setCreating(false); onCreated(job) }} />
  return <><button onClick={() => setCreating(true)} className="mb-5 w-full rounded-2xl border-2 border-dashed border-[#087a39] bg-[#effbf2] px-4 py-4 text-[12px] font-extrabold text-[#087a39]">+ Criar trabalho</button><ClientServicesLegacy onJob={onJob} /></>
}
function ClientServicesLegacy({ onJob }: { onJob?: (job: import('@/lib/api').Job) => void }) {
  const [services, setServices] = useState<import('@/lib/api').Job[] | null>(null)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<Service['status'] | null>(null)
  useEffect(() => {
    api.getOwnJobs()
      .then(setServices)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar seus trabalhos.'))
  }, [])
  const statusCounts = [
    ['Não iniciado', 'Não atribuídos'],
    ['Em planejamento', 'Em planejamento'],
    ['Em andamento', 'Em andamento'],
    ['Pausado', 'Pausados'],
    ['Concluído', 'Concluídos'],
    ['Cancelado', 'Cancelados'],
  ] as const
  const visibleServices = services?.filter(service => selectedStatus === null || service.status === selectedStatus)
  return <>
    <Header title="Meus trabalhos" subtitle="Acompanhe suas solicitações" />
    {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
    {services === null && !error
      ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div>
      : services?.length
        ? <>
          <div className="mb-5 grid grid-cols-2 gap-2">{statusCounts.map(([status, label]) => <button key={status} onClick={() => setSelectedStatus(current => current === status ? null : status)} aria-pressed={selectedStatus === status} className={`rounded-xl border px-2 py-3 text-center text-black ${selectedStatus === status ? 'border-[#087a39] bg-[#d5f2dd]' : 'border-[#a8cdb4] bg-[#effbf2]'}`}><strong className="block text-lg text-[#087a39]">{services.filter(service => service.status === status).length}</strong><small className="text-[9px] opacity-60">{label}</small></button>)}</div>
          <div className="space-y-2">{visibleServices?.map(service => <button key={service.id} type="button" onClick={() => onJob?.(service)} className="block w-full text-left"><ServiceCard service={service} /></button>)}{visibleServices?.length === 0 && <p className="rounded-xl border border-dashed border-black/20 p-6 text-center text-[11px] opacity-60">Nenhum trabalho neste status.</p>}</div>
        </>
        : !error && <p className="rounded-xl border border-dashed border-black/20 p-6 text-center text-[11px] opacity-60">Você ainda não publicou nenhum trabalho.</p>}
  </>
}
function ProviderServicesScreen({ onJob }: { onJob?: (job: import('@/lib/api').Job, canCancel: boolean) => void }) {
  const [availableJobs, setAvailableJobs] = useState<import('@/lib/api').Job[] | null>(null)
  const [ownJobs, setOwnJobs] = useState<import('@/lib/api').Job[] | null>(null)
  const [interestAreas, setInterestAreas] = useState<import('@/lib/api').InterestArea[] | null>(null)
  const [serviceTypes, setServiceTypes] = useState<import('@/lib/api').ServiceType[] | null>(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState<'disponiveis' | 'meus'>('disponiveis')
  const [selectedStatus, setSelectedStatus] = useState<import('@/lib/api').Job['status'] | null>(null)
  const [selectedInterestServiceTypeId, setSelectedInterestServiceTypeId] = useState<number | null>(null)
  useEffect(() => {
    Promise.allSettled([
      api.getJobFeed(),
      api.getOwnJobs(),
      api.getInterestAreas(),
      api.getServiceTypes(),
    ]).then(([feedResult, ownResult, interestAreasResult, serviceTypesResult]) => {
      if (feedResult.status === 'fulfilled') setAvailableJobs(feedResult.value)
      else setError(feedResult.reason instanceof Error ? feedResult.reason.message : 'Não foi possível carregar o feed de trabalhos.')
      if (ownResult.status === 'fulfilled') setOwnJobs(ownResult.value)
      else setError(current => current
        ? `${current} Não foi possível carregar seus serviços.`
        : ownResult.reason instanceof Error ? ownResult.reason.message : 'Não foi possível carregar seus serviços.')
      if (interestAreasResult.status === 'fulfilled') setInterestAreas(interestAreasResult.value)
      else setError(current => current
        ? `${current} Não foi possível carregar suas áreas de interesse.`
        : interestAreasResult.reason instanceof Error ? interestAreasResult.reason.message : 'Não foi possível carregar suas áreas de interesse.')
      if (serviceTypesResult.status === 'fulfilled') setServiceTypes(serviceTypesResult.value)
      else setError(current => current
        ? `${current} Não foi possível carregar os tipos de serviço.`
        : serviceTypesResult.reason instanceof Error ? serviceTypesResult.reason.message : 'Não foi possível carregar os tipos de serviço.')
    })
  }, [])
  const currentJobs = view === 'disponiveis' ? availableJobs : ownJobs
  const visibleJobs = currentJobs?.filter(job => view === 'disponiveis'
    ? (job.status === 'Não iniciado' || job.status === 'Em análise') &&
      (selectedInterestServiceTypeId === null || job.serviceTypeId === selectedInterestServiceTypeId)
    : selectedStatus === null || job.status === selectedStatus)
  const statusCounts = [
    ['Não iniciado', 'Não iniciados'],
    ['Em planejamento', 'Em planejamento'],
    ['Em andamento', 'Em andamento'],
    ['Pausado', 'Pausados'],
    ['Concluído', 'Concluídos'],
    ['Cancelado', 'Cancelados'],
  ] as const
  if (creating) return <PostCreateForm
    role="prestador"
    onCancel={() => setCreating(false)}
    onCreated={job => {
      setOwnJobs(current => [job, ...(current || [])])
      setCreating(false)
      setView('meus')
      setError('')
    }}
  />
  return <>
    <Header title={view === 'disponiveis' ? 'Trabalhos disponíveis' : 'Meus serviços'} subtitle={view === 'disponiveis' ? 'Oportunidades abertas para você' : 'Posts de serviços publicados por você'} action={<Bell size={18} className="text-[#35d878]" />} />
    <div className="mb-4 grid grid-cols-2 gap-2"><button onClick={() => { setView('disponiveis'); setSelectedStatus(null) }} className={`rounded-xl p-3 text-[10px] font-bold ${view === 'disponiveis' ? 'bg-[#35d878] text-black' : 'bg-[#111827]'}`}>Disponíveis</button><button onClick={() => { setView('meus'); setSelectedStatus(null) }} className={`rounded-xl p-3 text-[10px] font-bold ${view === 'meus' ? 'bg-[#35d878] text-black' : 'bg-[#111827]'}`}>Meus serviços ({ownJobs?.length || 0})</button></div>
    {view === 'meus' && <button onClick={() => setCreating(true)} className="mb-4 w-full rounded-2xl border-2 border-dashed border-[#35d878] bg-[#111827] px-4 py-4 text-[12px] font-extrabold text-[#35d878]">+ Criar serviço</button>}
    {view === 'disponiveis' && <div className="mb-4 space-y-3">
      {interestAreas?.length ? <label className="block text-[10px] font-bold text-[#35d878]">Filtrar por área de interesse
        <select
          value={selectedInterestServiceTypeId ?? ''}
          onChange={event => setSelectedInterestServiceTypeId(event.target.value ? Number(event.target.value) : null)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-[11px] text-white"
        >
          <option value="">Todas as minhas áreas</option>
          {interestAreas.map(area => {
            const serviceType = serviceTypes?.find(item => item.id === area.serviceTypeId)
            return <option key={area.id} value={area.serviceTypeId}>{serviceType?.name || `Tipo ${area.serviceTypeId}`}</option>
          })}
        </select>
      </label> : interestAreas && <p className="rounded-xl bg-[#111827] p-3 text-[10px] text-white/65">Cadastre de 1 a 3 áreas em Perfil → Configurações para receber trabalhos no feed.</p>}
    </div>}
    {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-300">{error}</p>}
    {view === 'meus' && ownJobs?.length ? <div className="mb-4 grid grid-cols-2 gap-2">{statusCounts.map(([status, label]) => <button key={status} onClick={() => setSelectedStatus(current => current === status ? null : status)} aria-pressed={selectedStatus === status} className={`rounded-xl border px-2 py-3 text-center ${selectedStatus === status ? 'border-[#35d878] bg-[#123f2c]' : 'border-white/10 bg-[#111827]'}`}><strong className="block text-lg text-[#35d878]">{ownJobs.filter(job => job.status === status).length}</strong><small className="text-[9px] opacity-60">{label}</small></button>)}</div> : null}
    <div className="space-y-3">{currentJobs === null ? <Skeleton className="h-56 rounded-2xl" /> : visibleJobs?.length ? visibleJobs.map(job => <article key={job.id} onClick={() => onJob?.(job, view === 'meus')} className="cursor-pointer rounded-2xl border border-white/10 bg-[#111827] p-4"><div className="flex items-start justify-between"><div><span className="text-[9px] font-bold text-[#35d878]">{job.subSector} · {job.remote ? 'Remoto' : job.location || 'A combinar'}</span><h3 className="mt-1 text-[14px] font-bold">{job.title}</h3></div><span className="rounded-full bg-[#123f2c] px-2 py-1 text-[9px] text-[#35d878]">{view === 'meus' ? job.status : job.urgency}</span></div><p className="mt-3 text-[11px] leading-relaxed opacity-65">{job.description}</p>{view === 'meus' && <p className="mt-2 text-[10px] text-[#35d878]">Prazo: {job.dueDate || job.duration || 'A combinar'}</p>}<div className="mt-3 flex flex-wrap gap-2">{job.skills.map(skill => <span key={skill} className="rounded-full bg-black px-2 py-1 text-[9px]">{skill}</span>)}</div><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><div><strong className="text-[13px] text-[#35d878]">{formatPostPriceRange(job.salaryMin, job.salaryMax)}</strong><small className="ml-2 text-[9px] opacity-60">{view === 'meus' ? 'Faixa de preço' : job.negotiable ? 'Negociável' : 'Faixa de orçamento'}</small></div><button onClick={event => { event.stopPropagation(); onJob?.(job, view === 'meus') }} className="rounded-xl bg-[#35d878] px-4 py-2 text-[10px] font-extrabold text-black">Ver detalhes</button></div></article>) : !error && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-[11px] opacity-60">{view === 'meus' ? 'Você ainda não publicou nenhum serviço.' : 'Nenhum trabalho aberto para este valor mínimo.'}</p>}</div>
  </>
}
function AuthScreen({ onLogin }: { onLogin: (user: import('@/lib/api').AppUser) => void }) {
  type AuthForm = { Identifier: string; UserName: string; Email: string; Password: string; ConfirmPassword: string; Name: string; PhoneNumber: string; PhotoUrl: string; BirthDate: string; Address: string; Description: string; CPF: string }
  type AuthStage = 'welcome' | 'identifier' | 'login' | 'register-account' | 'register-details' | 'simplified'
  const [stage, setStage] = useState<AuthStage>('welcome')
  const [form, setForm] = useState<AuthForm>({ Identifier: '', UserName: '', Email: '', Password: '', ConfirmPassword: '', Name: '', PhoneNumber: '', PhotoUrl: '', BirthDate: '', Address: '', Description: '', CPF: '' })
  const [profile, setProfile] = useState<ActiveProfile>('Client')
  const [userId, setUserId] = useState<number | null>(null)
  const [interestServiceTypeIds, setInterestServiceTypeIds] = useState<number[]>([])
  const [pendingRegisteredUser, setPendingRegisteredUser] = useState<import('@/lib/api').AppUser | null>(null)
  const [savedInterestServiceTypeIds, setSavedInterestServiceTypeIds] = useState<number[]>([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const update = (key: keyof AuthForm, value: string) => setForm(current => ({ ...current, [key]: value }))
  const isProvider = profile === 'FreeLancer'
  const profileLabel = isProvider ? 'prestador' : 'cliente'
  const inputClassName = 'mt-1 w-full rounded-xl border border-[#a8cdb4] bg-white/70 px-3 py-3 text-[11px] text-black outline-none focus:border-[#087a39]'
  const input = (key: keyof AuthForm, label: string, required = false, type = 'text', autoComplete?: string) =>
    <label className="block text-[10px] font-bold text-[#087a39]">{label}{required && ' *'}<input required={required} type={type} autoComplete={autoComplete} value={form[key]} onChange={event => update(key, event.target.value)} className={inputClassName} /></label>
  const chooseProfile = (nextProfile: ActiveProfile) => {
    setProfile(nextProfile)
    window.sessionStorage.setItem('servilon-auth-profile', nextProfile === 'Client' ? '1' : '2')
    setStage('identifier')
    setError('')
    setInfo('')
  }
  useEffect(() => {
    const savedProfile = window.sessionStorage.getItem('servilon-auth-profile')
    if (savedProfile === '1' || savedProfile === '2') {
      setProfile(savedProfile === '1' ? 'Client' : 'FreeLancer')
    }
  }, [])
  const finishAuthentication = (user: import('@/lib/api').AppUser) => {
    window.sessionStorage.removeItem('servilon-auth-profile')
    onLogin(user)
  }
  const saveProviderInterests = async (user: import('@/lib/api').AppUser) => {
    let savedIds = savedInterestServiceTypeIds
    for (const serviceTypeId of interestServiceTypeIds) {
      if (savedIds.includes(serviceTypeId)) continue
      await api.createInterestArea(serviceTypeId)
      savedIds = [...savedIds, serviceTypeId]
      setSavedInterestServiceTypeIds(savedIds)
    }
    finishAuthentication(user)
  }
  const checkIdentifier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const identifier = form.Identifier.trim()
    if (!identifier) {
      setError('Informe seu e-mail ou nome de usuário.')
      return
    }
    setSubmitting(true)
    setError('')
    setInfo('')
    try {
      const result = await api.userExists(identifier, profile)
      const idValue = typeof result === 'number'
        ? result
        : result && typeof result === 'object'
          ? ('userId' in result ? result.userId : 'UserId' in result ? result.UserId : 'id' in result ? result.id : 'Id' in result ? result.Id : undefined)
          : undefined
      if (typeof idValue !== 'number' || !Number.isInteger(idValue) || idValue < 1) {
        throw new Error('A API encontrou o usuário, mas não retornou um identificador válido.')
      }
      // Conta existe mas ainda não tem o perfil escolhido: completa o cadastro desse perfil.
      setUserId(idValue)
      setInfo(`Sua conta já existe. Complete seu perfil de ${profileLabel} para continuar.`)
      setStage('simplified')
    } catch (reason) {
      if (reason instanceof Error && 'status' in reason && reason.status === 404) {
        // Conta não existe: cadastro completo do perfil escolhido.
        setForm(current => identifier.includes('@')
          ? { ...current, Email: identifier }
          : { ...current, UserName: identifier })
        setInfo(`Não encontramos essa conta. Vamos criar seu perfil de ${profileLabel}.`)
        setStage('register-account')
        return
      }
      if (reason instanceof Error && 'status' in reason && reason.status === 409) {
        // Conta já tem o perfil escolhido: só falta entrar.
        setInfo(`Encontramos sua conta de ${profileLabel}. Confirme sua senha para continuar.`)
        setStage('login')
        return
      }
      setError(reason instanceof Error ? reason.message : 'Não foi possível verificar o usuário.')
    } finally {
      setSubmitting(false)
    }
  }
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (stage === 'login') {
        const identifier = form.Identifier.trim()
        const user = await api.login({
          UserName: identifier.includes('@') ? null : identifier,
          Email: identifier.includes('@') ? identifier : null,
          Password: form.Password,
          Profile: profile,
        })
        finishAuthentication(user)
        return
      }

      if (stage === 'register-account') {
        if (form.Password !== form.ConfirmPassword) {
          throw new Error('As senhas não coincidem.')
        }
        setInfo('')
        setStage('register-details')
        return
      }

      if (stage === 'register-details') {
        if (isProvider && (interestServiceTypeIds.length < 1 || interestServiceTypeIds.length > 3)) {
          throw new Error('Selecione de 1 a 3 áreas de interesse.')
        }
        if (isProvider && pendingRegisteredUser) {
          await saveProviderInterests(pendingRegisteredUser)
          return
        }
        const account = {
          UserName: form.UserName,
          Email: form.Email,
          PasswordHash: form.Password,
          Name: form.Name,
          PhoneNumber: form.PhoneNumber,
          PhotoUrl: form.PhotoUrl || null,
          Description: form.Description || null,
          BirthDate: form.BirthDate,
        }
        const user = isProvider
          ? await api.register('FreeLancer', { ...account, CPF: form.CPF.replace(/\D/g, '') })
          : await api.register('Client', { ...account, Address: form.Address || null })
        if (isProvider) {
          setPendingRegisteredUser(user)
          await saveProviderInterests(user)
        } else {
          finishAuthentication(user)
        }
        return
      }

      if (stage === 'simplified') {
        if (isProvider && (interestServiceTypeIds.length < 1 || interestServiceTypeIds.length > 3)) {
          throw new Error('Selecione de 1 a 3 áreas de interesse.')
        }
        if (isProvider && pendingRegisteredUser) {
          await saveProviderInterests(pendingRegisteredUser)
          return
        }
        if (userId === null) throw new Error('Não foi possível recuperar o identificador do usuário.')
        const user = isProvider
          ? await api.registerSimplifiedFreeLancer(userId, form.CPF.replace(/\D/g, ''))
          : await api.registerSimplifiedClient(userId, form.Address || null)
        if (isProvider) {
          setPendingRegisteredUser(user)
          await saveProviderInterests(user)
        } else {
          finishAuthentication(user)
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a solicitação.')
    } finally {
      setSubmitting(false)
    }
  }

  const back = () => {
    setError('')
    setInfo('')
    if (stage === 'identifier') setStage('welcome')
    else if (stage === 'register-account' || stage === 'login' || stage === 'simplified') setStage('identifier')
    else if (stage === 'register-details') setStage('register-account')
  }
  const title = stage === 'welcome' ? 'Bem vindo ao Servilon'
    : stage === 'identifier' ? 'Vamos começar'
      : stage === 'login' ? 'Entre para continuar'
        : stage === 'simplified' ? `Complete seu perfil de ${profileLabel}`
          : stage === 'register-account' ? 'Crie sua conta'
            : 'Conte um pouco sobre você'
  const description = stage === 'welcome' ? 'Escolha como você quer usar o Servilon.'
    : stage === 'identifier' ? 'Informe seu e-mail ou nome de usuário.'
      : stage === 'login' ? `Acesse sua conta de ${profileLabel}.`
        : stage === 'simplified' ? `Precisamos de mais alguns dados para ativar seu perfil de ${profileLabel}.`
          : 'Seus dados serão usados para criar seu perfil.'
  const showForm = ['identifier', 'login', 'register-account', 'register-details', 'simplified'].includes(stage)

  return <main className="servilon-auth flex min-h-screen items-center px-5 py-10 text-black">
    <div className="mx-auto w-full max-w-[430px]">
      <div className="mb-8 text-center">
        <p className="text-[12px] font-bold text-[#087a39]">ServiLon</p>
        <h1 className="mt-3 text-[27px] font-extrabold">{title}</h1>
        <p className="mt-2 text-[12px] opacity-65">{description}</p>
        {stage !== 'welcome' && <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#087a39]">{profileLabel} · perfil {profile === 'Client' ? '1' : '2'}</p>}
      </div>

      {stage === 'welcome' && <div className="space-y-3">
        <button type="button" onClick={() => chooseProfile('Client')} className="w-full rounded-xl bg-[#087a39] px-4 py-4 text-[12px] font-extrabold text-white">Sou cliente</button>
        <button type="button" onClick={() => chooseProfile('FreeLancer')} className="w-full rounded-xl bg-[#747b77] px-4 py-4 text-[12px] font-extrabold text-white">Sou prestador</button>
      </div>}

      {info && <p role="status" className="mb-4 rounded-xl bg-[#e3faf2] p-3 text-[10px] leading-relaxed text-[#087a39]">{info}</p>}

      {showForm && <form onSubmit={event => { void (stage === 'identifier' ? checkIdentifier(event) : submit(event)) }} className="space-y-3">
        {stage === 'identifier' && input('Identifier', 'E-mail ou nome de usuário', true, 'text', 'username')}
        {stage === 'login' && input('Password', 'Senha', true, 'password', 'current-password')}
        {stage === 'register-account' && <>
          {input('UserName', 'Nome de usuário', true, 'text', 'username')}
          {input('Email', 'E-mail', true, 'email', 'email')}
          {input('Password', 'Senha', true, 'password', 'new-password')}
          {input('ConfirmPassword', 'Confirmar senha', true, 'password', 'new-password')}
        </>}
        {stage === 'register-details' && <>
          {input('Name', 'Nome completo', true, 'text', 'name')}
          {input('PhoneNumber', 'Telefone', true, 'tel', 'tel')}
          {input('BirthDate', 'Data de nascimento', true, 'date')}
          {isProvider && input('CPF', 'CPF', true, 'text')}
          {!isProvider && input('Address', 'Endereço')}
          {input('PhotoUrl', 'URL da foto', false, 'url')}
          {input('Description', 'Sobre você')}
          {isProvider && <>
            <InterestAreaPicker
              selectedIds={interestServiceTypeIds}
              onChange={setInterestServiceTypeIds}
              disabled={submitting || pendingRegisteredUser !== null}
            />
            {pendingRegisteredUser && <p className="text-[10px] text-[#795700]">Seu perfil foi criado. Salve as áreas selecionadas para concluir o cadastro.</p>}
          </>}
        </>}
        {stage === 'simplified' && (isProvider
          ? <>
            {input('CPF', 'CPF', true, 'text')}
            <InterestAreaPicker
              selectedIds={interestServiceTypeIds}
              onChange={setInterestServiceTypeIds}
              disabled={submitting || pendingRegisteredUser !== null}
            />
            {pendingRegisteredUser && <p className="text-[10px] text-[#795700]">Seu perfil foi criado. Salve as áreas selecionadas para concluir o cadastro.</p>}
          </>
          : input('Address', 'Endereço'))}
        {error && <p role="alert" className="rounded-xl bg-[#fff4d6] p-3 text-[10px] text-[#795700]">{error}</p>}
        <button
          type="submit"
          disabled={submitting || (isProvider && ['register-details', 'simplified'].includes(stage) && interestServiceTypeIds.length < 1)}
          className="w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-extrabold text-white disabled:opacity-50"
        >
          {submitting ? 'Aguarde...' : stage === 'identifier' ? 'Continuar' : stage === 'login' ? 'Entrar' : stage === 'register-account' ? 'Continuar' : pendingRegisteredUser ? 'Salvar áreas e entrar' : stage === 'register-details' || stage === 'simplified' ? 'Criar perfil e entrar' : 'Continuar'}
        </button>
      </form>}

      {stage !== 'welcome' && <button type="button" onClick={back} disabled={submitting || pendingRegisteredUser !== null} className="mt-4 w-full py-2 text-[10px] font-bold text-[#087a39] disabled:opacity-50">Voltar</button>}
    </div>
  </main>
}
function ProfileActions({ user, onLogout, onHistory, onBecomeProvider, onSwitchToClient, onSettingsUpdated }: { user: import('@/lib/api').AppUser; onLogout: () => Promise<void>; onHistory: (type: HistoryType) => void; onBecomeProvider: (cpf: string, interestServiceTypeIds: number[]) => Promise<void>; onSwitchToClient: () => Promise<void>; onSettingsUpdated: (settings: import('@/lib/api').UserSettings) => void }) {
  const [message, setMessage] = useState('')
  const [cpf, setCpf] = useState('')
  const [interestServiceTypeIds, setInterestServiceTypeIds] = useState<number[]>([])
  const [conversionOpen, setConversionOpen] = useState(false)
  const [converting, setConverting] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settings, setSettings] = useState<import('@/lib/api').UserSettings>(user.settings || { theme: 'claro', notificationsEnabled: true, privateJobs: false })
  useEffect(() => {
    let savedSettings: Partial<import('@/lib/api').UserSettings> = {}
    try {
      savedSettings = JSON.parse(localStorage.getItem('servilon-preferences') || '{}') as Partial<import('@/lib/api').UserSettings>
    } catch (reason) {
      console.error('Não foi possível ler as preferências locais do ServiLon.', reason)
    }
    setSettings({
      theme: 'claro',
      notificationsEnabled: true,
      privateJobs: false,
      ...user.settings,
      ...savedSettings,
    })
  }, [user.id, user.settings])
  const share = async () => {
    try {
      const url = window.location.href
      if (navigator.share) await navigator.share({ title: `Perfil de ${user.name}`, url })
      else {
        await navigator.clipboard.writeText(url)
        setMessage('Link copiado.')
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível compartilhar o perfil.')
    }
  }
  const logout = async () => {
    try {
      await onLogout()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível encerrar a sessão.')
    }
  }
  const becomeProvider = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    if (interestServiceTypeIds.length < 1 || interestServiceTypeIds.length > 3) {
      setMessage('Selecione de 1 a 3 áreas de interesse.')
      return
    }
    setConverting(true)
    try {
      await onBecomeProvider(cpf, interestServiceTypeIds)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível ativar o perfil de prestador.')
    } finally {
      setConverting(false)
    }
  }
  const returnToProviderView = async () => {
    setMessage('')
    setConverting(true)
    try {
      await onBecomeProvider('', [])
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível voltar à visão de prestador.')
    } finally {
      setConverting(false)
    }
  }
  const returnToClientView = async () => {
    setMessage('')
    setSwitchingRole(true)
    try {
      await onSwitchToClient()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível voltar à visão de cliente.')
    } finally {
      setSwitchingRole(false)
    }
  }
  const saveSettings = async () => {
    setSavingSettings(true)
    setSettingsError('')
    try {
      const saved = await api.updateSettings(settings)
      onSettingsUpdated(saved)
      setSettingsOpen(false)
    } catch (reason) {
      setSettingsError(reason instanceof Error ? reason.message : 'Não foi possível salvar as configurações.')
    } finally {
      setSavingSettings(false)
    }
  }
  return <div className="mt-5 space-y-2">
    <button onClick={() => document.getElementById('profile-edit')?.scrollIntoView({ behavior: 'smooth' })} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Personalização <span className="float-right opacity-50">›</span></button>
    <button onClick={() => { setSettingsError(''); setSettingsOpen(true) }} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Configurações <span className="float-right opacity-50">›</span></button>
    <button onClick={() => onHistory('criados')} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Histórico de serviços criados <span className="float-right opacity-50">›</span></button>
    <button onClick={() => onHistory('concluidos')} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Histórico de serviços concluídos <span className="float-right opacity-50">›</span></button>
    {user.role === 'cliente' && user.hasProviderProfile && <button disabled={converting} onClick={() => { void returnToProviderView() }} className="w-full rounded-2xl border border-[#008254] bg-[#effcf8] p-4 text-left text-[12px] font-bold text-[#008254] disabled:opacity-50">{converting ? 'Voltando...' : 'Voltar para visão de prestador'} <span className="float-right opacity-60">›</span></button>}
    {user.role === 'cliente' && !user.hasProviderProfile && !conversionOpen && <button onClick={() => { setMessage(''); setConversionOpen(true) }} className="w-full rounded-2xl border border-[#008254] bg-[#effcf8] p-4 text-left text-[12px] font-bold text-[#008254]">Ativar perfil de prestador <span className="float-right opacity-60">›</span></button>}
    {user.role === 'cliente' && !user.hasProviderProfile && conversionOpen && <form onSubmit={event => { void becomeProvider(event) }} className="space-y-3 rounded-lg border border-[#d8d9da] bg-white p-4">
      <label className="block text-[12px] font-bold text-[#3d4045]">CPF para cadastro de prestador
        <input required inputMode="numeric" autoComplete="off" maxLength={11} value={cpf} onChange={event => setCpf(event.target.value.replace(/\D/g, '').slice(0, 11))} className="mt-2 w-full rounded border border-[#d8d9da] bg-white px-3 py-3 text-[14px] text-black outline-none focus:border-[#008254]" />
      </label>
      <InterestAreaPicker selectedIds={interestServiceTypeIds} onChange={setInterestServiceTypeIds} disabled={converting} />
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={converting || interestServiceTypeIds.length < 1} className="flex-1 rounded bg-[#008254] px-3 py-3 text-[12px] font-bold text-white disabled:opacity-50">{converting ? 'Ativando...' : 'Confirmar perfil prestador'}</button>
        <button type="button" onClick={() => { setConversionOpen(false); setInterestServiceTypeIds([]) }} disabled={converting} className="rounded border border-[#d8d9da] bg-[#f7f7f7] px-3 py-3 text-[12px] font-bold text-[#006642] disabled:opacity-50">Cancelar</button>
      </div>
    </form>}
    {user.role === 'prestador' && <button onClick={() => onHistory('avaliacoes')} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Minhas avaliações <span className="float-right text-[#35d878]">★ {user.rating.toFixed(1)} · {user.reviews}</span></button>}
    {user.role === 'prestador' && <button onClick={() => { void share() }} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Compartilhar perfil <span className="float-right opacity-50">↗</span></button>}
    {user.role === 'prestador' && <button disabled={switchingRole} onClick={() => { void returnToClientView() }} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold disabled:opacity-50">{switchingRole ? 'Voltando...' : 'Voltar para visão de cliente'} <span className="float-right opacity-50">›</span></button>}
    <button onClick={() => { void logout() }} className="w-full rounded-2xl border border-red-500/20 p-4 text-left text-[12px] font-bold text-red-500">Sair da conta</button>
    {message && <p role="status" className="text-center text-[10px] text-[#087a39]">{message}</p>}
    {settingsOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-[#effbf2] p-5 text-black shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="text-[15px] font-extrabold">Configurações</h2>
          <button onClick={() => setSettingsOpen(false)} aria-label="Fechar" className="text-xl opacity-60">×</button>
        </div>
        <label className="mt-4 block text-[11px] font-bold">Tema
          <select value={settings.theme} onChange={event => setSettings(current => ({ ...current, theme: event.target.value === 'escuro' ? 'escuro' : 'claro' }))} className="mt-2 w-full rounded-xl border border-black/15 bg-white p-3 text-[11px]">
            <option value="claro">Claro</option><option value="escuro">Escuro</option>
          </select>
        </label>
        <label className="mt-4 flex items-center gap-2 text-[11px]"><input type="checkbox" checked={settings.notificationsEnabled} onChange={event => setSettings(current => ({ ...current, notificationsEnabled: event.target.checked }))} /> Receber notificações</label>
        {user.role === 'cliente' && <label className="mt-4 flex items-start gap-2 text-[11px]"><input type="checkbox" checked={settings.privateJobs} onChange={event => setSettings(current => ({ ...current, privateJobs: event.target.checked }))} /> <span>Manter meus trabalhos privados. Prestadores não poderão vê-los nem se candidatar; convites continuam disponíveis.</span></label>}
        {user.role === 'prestador' && <InterestAreasSettings />}
        {settingsError && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{settingsError}</p>}
        <button disabled={savingSettings} onClick={() => { void saveSettings() }} className="mt-5 w-full rounded-xl bg-[#087a39] p-3 text-[11px] font-bold text-white disabled:opacity-50">{savingSettings ? 'Salvando...' : 'Salvar configurações'}</button>
      </section>
    </div>}
  </div>
}
function ProfileScreen({ user, onUpdated }: { user: import('@/lib/api').AppUser; onUpdated: (user: import('@/lib/api').AppUser) => void }) {
  type Draft = { location: string; photoUrl: string }
  const provider = user.role === 'prestador'
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Draft>({
    location: user.location,
    photoUrl: user.photoUrl || '',
  })
  const update = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }))
  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const updatedUser = await api.updateProfile({
        ...(provider ? {} : { location: draft.location }),
        photoUrl: draft.photoUrl.trim() || null,
      })
      onUpdated(updatedUser)
      setEditing(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o perfil.')
    } finally {
      setSaving(false)
    }
  }
  const input = (key: keyof Draft, label: string, type = 'text') => <label className="block text-[10px] font-bold">{label}<input type={type} value={draft[key]} onChange={event => update(key, event.target.value)} className="mt-1 w-full rounded-xl border border-current/15 bg-transparent px-3 py-2 text-[11px] outline-none focus:border-[#087a39]" /></label>
  return <>
    <Header title="Meu perfil" subtitle="Suas informações e preferências" />
    <section className="flex items-center gap-4"><Avatar name={user.name} large photoUrl={user.photoUrl} /><div><h1 className="text-[17px] font-bold">{user.name}</h1><p className="text-[11px] opacity-60">{user.location || 'Localização não informada'}</p>{provider && <p className="mt-1 text-[11px] text-[#35d878]">★ {user.rating.toFixed(1)} ({user.reviews} avaliações)</p>}</div></section>
    <section className="mt-5 rounded-2xl border border-current/10 bg-current/5 p-4"><h2 className="text-[13px] font-bold">Perfil</h2><p className="mt-1 text-[10px] opacity-60">{provider ? 'Perfil de prestador' : 'Perfil de cliente'} · {user.email}</p></section>
    {provider && <InterestAreasProfile />}
    {!editing ? <button id="profile-edit" onClick={() => setEditing(true)} className="mt-4 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white">Editar perfil</button> : <section id="profile-edit" className="mt-4 space-y-3 rounded-2xl border border-current/10 bg-current/5 p-4"><h2 className="text-[13px] font-bold">Editar perfil</h2><p className="text-[10px] opacity-60">O nome não pode ser alterado.</p>{!provider && input('location', 'Localização')}{input('photoUrl', 'URL da foto', 'url')}{error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}<div className="grid grid-cols-2 gap-2"><button disabled={saving} onClick={() => { void save() }} className="rounded-xl bg-[#087a39] px-3 py-3 text-[11px] font-bold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button><button disabled={saving} onClick={() => { setEditing(false); setError('') }} className="rounded-xl border border-current/20 px-3 py-3 text-[11px] font-bold">Cancelar</button></div></section>}
  </>
}
function ProviderProfileScreen({ provider, role, onBack, onCreateJob }: { provider: ProviderProfile; role: Role; onBack: () => void; onCreateJob: () => void }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [jobs, setJobs] = useState<import('@/lib/api').Job[] | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [inviteError, setInviteError] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [reviewEntries, setReviewEntries] = useState<Pick<import('@/lib/api').Review, 'id' | 'rating' | 'comment' | 'createdAt' | 'clientName'>[] | null>(null)
  const [reviewError, setReviewError] = useState('')
  const card = role === 'cliente' ? 'border-[#a8cdb4] bg-[#effbf2] text-black' : 'border-white/10 bg-[#111827]'
  useEffect(() => {
    api.getProviderReviews(provider.id)
      .then(setReviewEntries)
      .catch(reason => setReviewError(reason instanceof Error ? reason.message : 'Não foi possível carregar as avaliações.'))
  }, [provider.id])
  const openInvitations = async () => {
    setInviteError('')
    setInviteMessage('')
    setInviteOpen(true)
    try {
      const clientJobs = await api.getOwnJobs()
      setJobs(clientJobs.filter(job => job.status === 'Não iniciado' || job.status === 'Em análise'))
    } catch (reason) {
      setInviteError(reason instanceof Error ? reason.message : 'Não foi possível carregar seus trabalhos.')
    }
  }
  const sendInvitation = async () => {
    if (selectedJobId === null) return
    setSendingInvite(true)
    setInviteError('')
    try {
      await api.createInvitation(selectedJobId, provider.id)
      setInviteMessage('Convite enviado. O prestador receberá uma notificação.')
      setInviteOpen(false)
    } catch (reason) {
      setInviteError(reason instanceof Error ? reason.message : 'Não foi possível enviar o convite.')
    } finally {
      setSendingInvite(false)
    }
  }
  return <>
    <Header title="Perfil do prestador" subtitle="Confira experiência e serviços" action={<button onClick={onBack} className="text-[11px] font-bold text-[#087a39]">Voltar</button>} />
    <section className="flex items-center gap-4"><Avatar name={provider.name} large photoUrl={provider.photoUrl} /><div><h1 className="text-[17px] font-bold">{provider.name}</h1><p className="text-[11px] opacity-60">{provider.role}</p><p className="text-[11px] text-[#087a39]">★ {provider.rating.toFixed(1)} <span className="opacity-60">({provider.reviews} avaliações)</span></p></div></section>
    <div className="mt-4 grid grid-cols-3 gap-2"><Metric value={String(provider.completed)} label="Concluídos" /><Metric value={provider.experience} label="Experiência" /><Metric value={provider.responseTime.replace('Responde em até ', '')} label="Resposta" /></div>
    <section className={`mt-4 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Sobre o profissional</h2><p className="mt-2 text-[11px] leading-relaxed opacity-70">{provider.bio}</p></section>
    <section className={`mt-3 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Habilidades</h2><div className="mt-3 flex flex-wrap gap-2">{provider.skills.length ? provider.skills.map(item => <span key={item} className="rounded-full bg-[#123f2c] px-2.5 py-1 text-[10px] text-[#35d878]">{item}</span>) : <span className="text-[11px] opacity-60">Nenhuma habilidade cadastrada.</span>}</div></section>
    <section className={`mt-3 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Serviços oferecidos</h2><div className="mt-3 space-y-2">{provider.services.length ? provider.services.map(item => <div key={item} className="flex items-center justify-between border-b border-current/10 pb-2 text-[11px]"><span>{item}</span><ChevronRight size={14} className="text-[#087a39]" /></div>) : <span className="text-[11px] opacity-60">Nenhum serviço cadastrado.</span>}</div></section>
    <section className={`mt-3 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Avaliações</h2>{reviewError ? <p role="alert" className="mt-2 text-[10px] text-red-600">{reviewError}</p> : reviewEntries === null ? <Skeleton className="mt-3 h-12 rounded-xl" /> : reviewEntries.length ? <div className="mt-3 space-y-3">{reviewEntries.map(review => <article key={review.id} className="border-b border-current/10 pb-3 last:border-0"><strong className="text-[11px]">{review.clientName || 'Cliente'} · {'★'.repeat(review.rating)}</strong><p className="mt-1 text-[10px] opacity-70">{review.comment || 'Sem comentário.'}</p><small className="mt-1 block text-[9px] opacity-50">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</small></article>)}</div> : <p className="mt-2 text-[11px] opacity-60">Nenhuma avaliação publicada.</p>}</section>
    <section className={`mt-3 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Disponibilidade e atendimento</h2><p className="mt-2 text-[11px] opacity-70">{provider.availability || 'Disponibilidade a combinar'} · {provider.serviceFormat || 'Formato a combinar'}</p>{provider.links?.length ? <><h2 className="mt-4 text-[13px] font-bold">Links</h2><div className="mt-2 flex flex-wrap gap-2">{provider.links.slice(0, 2).map(link => <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="text-[11px] text-[#087a39] underline">{link.label}</a>)}</div></> : null}</section>
    {inviteMessage && <p role="status" className="mt-3 rounded-xl bg-[#123f2c] p-3 text-[11px] text-[#35d878]">{inviteMessage}</p>}
    {inviteError && !inviteOpen && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{inviteError}</p>}
    {role === 'cliente' && <button onClick={() => { void openInvitations() }} className="mt-4 w-full rounded-2xl bg-[#35d878] px-4 py-3 text-[12px] font-extrabold text-black">Convidar para um trabalho</button>}
    {inviteOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="invite-title" className="w-full max-w-[420px] rounded-2xl bg-[#effbf2] p-5 text-black shadow-2xl"><div className="flex items-center justify-between"><h2 id="invite-title" className="text-[15px] font-extrabold">Escolher trabalho</h2><button onClick={() => setInviteOpen(false)} aria-label="Fechar" className="text-xl opacity-60">×</button></div>{inviteError && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{inviteError}</p>}{jobs === null && !inviteError ? <Skeleton className="mt-4 h-20 rounded-xl" /> : jobs?.length ? <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto">{jobs.map(item => <button key={item.id} onClick={() => setSelectedJobId(item.id)} className={`w-full rounded-xl border p-3 text-left ${selectedJobId === item.id ? 'border-[#087a39] bg-[#d5f2dd]' : 'border-black/10 bg-white'}`}><strong className="block text-[12px]">{item.title}</strong><span className="text-[10px] opacity-65">{item.category} · {formatPostPriceRange(item.salaryMin, item.salaryMax)}</span></button>)}</div> : !inviteError && <><p className="mt-4 text-[11px] opacity-70">Você ainda não tem trabalhos disponíveis para convite.</p><button onClick={onCreateJob} className="mt-4 w-full rounded-xl bg-[#087a39] p-3 text-[11px] font-bold text-white">Publicar trabalho</button></>}{jobs?.length ? <button disabled={selectedJobId === null || sendingInvite} onClick={() => { void sendInvitation() }} className="mt-4 w-full rounded-xl bg-[#087a39] p-3 text-[11px] font-bold text-white disabled:opacity-40">{sendingInvite ? 'Enviando...' : 'Confirmar convite'}</button> : null}</section></div>}
  </>
}
export default function ServilonApp() {
  const [session, setSession] = useState<import('@/lib/api').AppUser | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [tab, setTab] = useState('home')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [historyType, setHistoryType] = useState<HistoryType | null>(null)
  const [role, setRole] = useState<Role>('cliente')
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [job, setJob] = useState<import('@/lib/api').Job | null>(null)
  const [jobCanCancel, setJobCanCancel] = useState(false)
  const [selectedPost, setSelectedPost] = useState<import('@/lib/api').Job | null>(null)
  const [pendingNegotiationId, setPendingNegotiationId] = useState<number | null>(null)
  const [pendingNegotiationError, setPendingNegotiationError] = useState('')

  useEffect(() => {
    let active = true
    api.getSession()
      .then(user => {
        if (!active) return
        setSession(user)
        if (user) setRole(user.role)
      })
      .catch(reason => {
        if (active) setSessionError(reason instanceof Error ? reason.message : 'Não foi possível restaurar a sessão.')
      })
      .finally(() => {
        if (active) setSessionLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!session) return

    let active = true
    let checking = false
    const timer = window.setInterval(() => {
      if (checking) return
      checking = true
      api.getSession()
        .then(user => {
          if (!active) return
          if (!user) {
            setSession(null)
            setRole('cliente')
            setTab('home')
            return
          }
          setSession(current => current
            ? {
              ...user,
              ...current,
              role: user.role,
              hasProviderProfile: current.hasProviderProfile || user.hasProviderProfile || current.role === 'prestador',
            }
            : user)
          setRole(user.role)
          setSessionError('')
        })
        .catch(reason => {
          if (active) setSessionError(reason instanceof Error ? reason.message : 'Não foi possível verificar a sessão.')
        })
        .finally(() => {
          checking = false
        })
    }, 30_000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [session?.id])

  const onInitialNegotiationOpened = useCallback(() => setPendingNegotiationId(null), [])
  const onInitialNegotiationErrorShown = useCallback(() => setPendingNegotiationError(''), [])

  const logout = async () => {
    await api.logout()
    setSession(null)
    setRole('cliente')
    setTab('home')
  }
  if (sessionLoading) return <main className="servilon-auth min-h-screen p-8 text-center text-[#087a39]">Loading session...</main>
  if (!session) return <>{sessionError && <p className="fixed inset-x-4 top-3 z-50 mx-auto max-w-[430px] rounded-xl bg-red-100 p-3 text-center text-[11px] text-red-700">{sessionError}</p>}<AuthScreen onLogin={user => { setSession(user); setRole(user.role); setSessionError('') }} /></>

  const isProvider = role === 'prestador'
  const navigate = (nextTab: string) => {
    setHistoryType(null)
    setNotificationsOpen(false)
    setProvider(null)
    setJob(null)
    setJobCanCancel(false)
    setSelectedPost(null)
    setPendingNegotiationId(null)
    setPendingNegotiationError('')
    setTab(nextTab)
  }
  const openJob = (nextJob: import('@/lib/api').Job, canCancel = false) => {
    setProvider(null)
    setSelectedPost(null)
    setJob(nextJob)
    setJobCanCancel(canCancel)
  }
  const sendIntroductoryMessage = async (post: import('@/lib/api').Job, message: string) => {
    const existing = (await api.getNegotiations()).find(item => item.postId === post.id)
    const negotiationId = existing?.id ?? await api.createNegotiation(post.id)
    let introductoryMessageError = ''
    if (!existing) {
      try {
        await api.sendNegotiationMessage(negotiationId, message)
      } catch (reason) {
        introductoryMessageError = reason instanceof Error
          ? `A negociação foi criada, mas a mensagem não foi enviada: ${reason.message}`
          : 'A negociação foi criada, mas não foi possível enviar a mensagem introdutória.'
      }
    }
    setHistoryType(null)
    setPendingNegotiationError(introductoryMessageError)
    setPendingNegotiationId(negotiationId)
    setSelectedPost(null)
    setTab('messages')
  }
  const content = historyType
    ? <HistoryScreen type={historyType} onBack={() => setHistoryType(null)} onJob={openJob} />
    : selectedPost
      ? <PostDetailsScreen post={selectedPost} role={role} onBack={() => setSelectedPost(null)} onStartNegotiation={sendIntroductoryMessage} />
      : job
      ? <JobDetailScreen job={job} role={role} canCancel={jobCanCancel} onBack={() => setJob(null)} onChat={() => { setJob(null); setTab('messages') }} />
      : provider
        ? <ProviderProfileScreen provider={provider} role={role} onBack={() => setProvider(null)} onCreateJob={() => { setProvider(null); setTab('create') }} />
        : tab === 'home'
          ? <HomeScreen role={role} onTab={navigate} user={session} onNotifications={() => setNotificationsOpen(true)} onJob={openJob} onProvider={setProvider} />
          : tab === 'search'
            ? <SearchScreen role={role} onPost={setSelectedPost} />
            : tab === 'create'
              ? (isProvider
                ? <ProviderServicesScreen onJob={openJob} />
                : <ClientServicesScreen onCreated={createdJob => { setJob(createdJob); setJobCanCancel(true); setTab('create') }} onJob={createdJob => openJob(createdJob, true)} />)
              : tab === 'messages'
                ? <NegotiationsScreen
                  role={role}
                  initialNegotiationId={pendingNegotiationId}
                  initialError={pendingNegotiationError}
                  onInitialNegotiationOpened={onInitialNegotiationOpened}
                  onInitialErrorShown={onInitialNegotiationErrorShown}
                />
                : <><ProfileScreen user={session} onUpdated={setSession} /><ProfileActions user={session} onLogout={logout} onHistory={type => setHistoryType(type)} onSettingsUpdated={settings => setSession(current => current ? { ...current, settings } : current)} onSwitchToClient={async () => {
                  let updatedUser: import('@/lib/api').AppUser
                  try {
                    updatedUser = await api.switchProfile()
                  } catch (reason) {
                    const message = reason instanceof Error ? reason.message.toLowerCase() : ''
                    if (!message.includes('não possui outro perfil')) throw reason
                    updatedUser = await api.registerSimplifiedClient(Number(session.id))
                  }
                  updatedUser = { ...updatedUser, hasProviderProfile: true }
                  setSession(updatedUser)
                  setRole(updatedUser.role)
                  setTab('home')
                  setHistoryType(null)
                  setProvider(null)
                  setJob(null)
                }} onBecomeProvider={async (cpf, interestServiceTypeIds) => {
                  let updatedUser: import('@/lib/api').AppUser
                  let createdProviderProfile = false
                  if (cpf) {
                    try {
                      updatedUser = await api.switchProfile()
                    } catch (reason) {
                      const message = reason instanceof Error ? reason.message.toLowerCase() : ''
                      if (!message.includes('não possui outro perfil')) throw reason
                      updatedUser = await api.convertClientToProvider(Number(session.id), cpf)
                      createdProviderProfile = true
                    }
                  } else {
                    updatedUser = await api.switchProfile()
                  }
                  updatedUser = { ...updatedUser, hasProviderProfile: true }
                  setSession(updatedUser)
                  setRole(updatedUser.role)
                  if (createdProviderProfile) {
                    try {
                      await Promise.all(interestServiceTypeIds.map(id => api.createInterestArea(id)))
                    } catch (reason) {
                      const details = reason instanceof Error ? reason.message : 'Erro inesperado ao salvar as áreas.'
                      throw new Error(`O perfil foi criado, mas não foi possível salvar todas as áreas de interesse. Complete a configuração em Perfil → Configurações. ${details}`)
                    }
                  }
                  setTab('home')
                  setHistoryType(null)
                  setProvider(null)
                  setJob(null)
                }} /></>

  return <main className={`servilon-app min-h-screen ${session.settings?.theme === 'escuro' ? 'bg-[#030507] text-white' : 'bg-[#f7f7f7] text-[#3d4045]'}`}>
    {notificationsOpen && <NotificationModal onClose={() => setNotificationsOpen(false)} />}
    <div className="mx-auto min-h-screen w-full max-w-[900px] px-5 pb-24 pt-9">{content}</div>
    <BottomNav tab={tab} onTab={navigate} role={role} />
  </main>
}
