'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, BookOpen, BriefcaseBusiness, ChevronRight, CirclePlus, Heart, Home, Leaf, MessageCircle, Monitor, Palette, Search, Scale, TrendingUp, UserRound, Wrench, MapPin, Clock3 } from 'lucide-react'
import { api, type ActiveProfile, type Alert, type Category, type CreateClientCommand, type CreateFreeLancerCommand, type HistoryEntry, type HistoryType, type ProviderProfile, type Service } from '@/lib/api'
import { ProviderJobsScreen } from './provider-jobs-screen'
import { ClientServiceCompletion } from './client-service-completion'

type Role = 'cliente' | 'prestador'
const icons = { monitor: Monitor, 'trending-up': TrendingUp, 'book-open': BookOpen, leaf: Leaf, heart: Heart, scale: Scale, palette: Palette, wrench: Wrench }
function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded bg-current/10 ${className}`} /> }
function Avatar({ name, large = false }: { name: string; large?: boolean }) { return <div className={`${large ? 'h-16 w-16 text-lg' : 'h-10 w-10 text-xs'} flex shrink-0 items-center justify-center rounded-xl border border-current/20 bg-gradient-to-br from-[#e5eee8] via-[#adbdb2] to-[#43564a] font-bold text-[#122018]`}>{name.split(' ').map(v => v[0]).join('')}</div> }
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
function HistoryScreen({ type, onBack }: { type: HistoryType; onBack: () => void }) {
  const labels: Record<HistoryType, string> = { concluidos: 'Serviços concluídos', andamento: 'Em andamento', avaliacoes: 'Avaliações', profissionais: 'Profissionais contratados' }
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
        {'title' in item ? <><strong>{item.title}</strong><p className="mt-1 opacity-65">{item.category} · {item.status} · R$ {item.price.toLocaleString('pt-BR')}</p>{item.provider && <p className="mt-1 opacity-65">Prestador: {item.provider}</p>}</> :
          'rating' in item ? <><strong>{'comment' in item && item.comment ? item.comment : 'Avaliação enviada'}</strong><p className="mt-1 text-[#087a39]">{'★'.repeat(item.rating)} · {new Date(item.createdAt).toLocaleDateString('pt-BR')}</p></> :
            <><strong>{item.provider}</strong><p className="mt-1 opacity-65">{item.completedJobs} serviço(s) concluído(s)</p></>}
      </article>
    )) : <div className="rounded-2xl border border-dashed border-black/20 p-8 text-center text-[11px] opacity-60">Nenhum registro encontrado.</div>}
  </>
}
function HomeScreen({ role, onTab, user, onNotifications }: { role: Role; onTab: (tab: string) => void; user: import('@/lib/api').AppUser; onNotifications: () => void }) {
  const [jobs, setJobs] = useState<import('@/lib/api').Job[] | null>(null)
  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    Promise.all([api.getJobs(), api.getProviders()])
      .then(([loadedJobs, loadedProviders]) => { setJobs(loadedJobs); setProviders(loadedProviders) })
      .catch(reason => setLoadError(reason instanceof Error ? reason.message : 'Não foi possível carregar o painel.'))
  }, [])
  const activeJobs = jobs?.filter(job => job.status !== 'Concluído' && job.status !== 'Recusado').length || 0
  const completedJobs = jobs?.filter(job => Boolean(job.clientConfirmedAt)).length || 0
  return role === 'prestador' ? <>
    <div className="mb-3 flex justify-end"><button onClick={onNotifications} aria-label="Abrir notificações" className="rounded-xl border border-white/10 bg-[#111827] p-2 text-[#35d878]">Notificações</button></div>
    <Header title="Painel do Prestador" subtitle={user.name} />
    <div className="grid grid-cols-3 gap-2"><Metric value={String(jobs?.filter(job => job.status === 'Em análise').length || 0)} label="Disponíveis" /><Metric value={String(jobs?.filter(job => job.status === 'Em andamento').length || 0)} label="Em andamento" /><Metric value={String(completedJobs)} label="Concluídos" /></div>
    {loadError && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-300">{loadError}</p>}
    <h2 className="mb-2 mt-8 text-[13px] font-bold text-[#35d878]">Trabalhos disponíveis</h2>
    {jobs?.filter(job => job.status === 'Em análise').slice(0, 3).map(job => <button key={job.id} onClick={() => onTab('create')} className="mb-2 block w-full rounded-2xl border border-white/10 bg-[#111827] p-4 text-left"><strong className="block text-[12px]">{job.title}</strong><span className="mt-1 block text-[10px] opacity-65">{job.category} · R$ {job.price.toLocaleString('pt-BR')}</span></button>)}
    {!jobs?.some(job => job.status === 'Em análise') && <p className="rounded-xl bg-[#111827] p-4 text-[11px] opacity-65">Nenhum trabalho disponível no momento.</p>}
  </> : <>
    <div className="home-welcome mb-5"><p className="text-[12px] opacity-70">Bem-vindo,</p><h1 className="text-[21px] font-extrabold">{user.name}</h1></div>
    <div className="rounded-2xl border border-black/10 bg-[#effbf2] p-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#35d878] text-black">{activeJobs}</span><div><b className="block text-[11px]">{activeJobs} trabalho(s) em andamento</b><small className="text-[9px] opacity-65">{completedJobs} concluído(s)</small></div></div></div>
    <div className="mb-3 mt-4 flex justify-end"><button onClick={onNotifications} aria-label="Abrir notificações" className="rounded-xl border border-black/10 bg-[#effbf2] p-2 text-[10px] font-bold text-[#087a39]">Notificações</button></div>
    {loadError && <p className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{loadError}</p>}
    <h2 className="mb-2 mt-6 text-[13px] font-bold text-[#087a39]">Prestadores</h2>
    <div className="flex gap-2 overflow-x-auto">{providers.slice(0, 4).map(provider => <div key={provider.id} className="min-w-[126px] rounded-2xl border border-black/10 bg-[#effbf2] p-3 text-center"><Avatar name={provider.name} /><b className="mt-2 block text-[11px]">{provider.name}</b><small className="block truncate text-[9px] opacity-60">{provider.role}</small><strong className="text-[11px] text-[#087a39]">★ {provider.rating.toFixed(1)}</strong></div>)}</div>
    <h2 className="mb-2 mt-7 text-[13px] font-bold">Meus trabalhos</h2>
    {jobs?.slice(0, 3).map(job => <div key={job.id} className="mb-2 rounded-2xl border border-black/10 bg-[#effbf2] p-4"><div className="flex justify-between gap-2"><b className="text-[12px]">{job.title}</b><span className="text-[10px] text-[#087a39]">{job.status}</span></div><p className="mt-2 text-[10px] opacity-60">{job.provider || 'A definir'} · R$ {job.price.toLocaleString('pt-BR')}</p></div>)}
    {jobs?.length === 0 && <p className="rounded-xl border border-dashed border-black/20 p-5 text-center text-[11px] opacity-60">Você ainda não publicou nenhum trabalho.</p>}
  </>
}
function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-white/10 bg-[#111827] p-3"><b className="block text-[14px] text-[#35d878]">{value}</b><small className="text-[9px] opacity-60">{label}</small></div> }
function JobDetailScreen({ job, onBack, role }: { job: import('@/lib/api').Job; onBack: () => void; role: Role }) {
  const [status, setStatus] = useState(job.status)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const updateStatus = async (nextStatus: import('@/lib/api').Job['status']) => {
    setUpdating(true)
    try {
      const updatedJob = await api.updateJobStatus(job.id, nextStatus)
      setStatus(updatedJob.status)
      setNotice(nextStatus === 'Em andamento' ? 'Trabalho aceito. O cliente foi notificado.' : nextStatus === 'Concluído' ? 'Conclusão registrada. Agora o cliente pode confirmar e avaliar.' : 'Status atualizado.')
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o trabalho.')
    } finally {
      setUpdating(false)
    }
  }
  return <>
    <Header title="Detalhes do trabalho" subtitle="Confira os dados e atualize o andamento" action={<button onClick={onBack} className="text-[11px] font-bold text-[#35d878]">Voltar</button>} />
    <article className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-start justify-between"><div><span className="text-[10px] font-bold text-[#35d878]">{job.category} · {job.subSector}</span><h1 className="mt-1 text-[17px] font-bold">{job.title}</h1></div><span className="rounded-full bg-[#123f2c] px-2 py-1 text-[9px] text-[#35d878]">{status}</span></div>
      {notice && <p className="mt-3 rounded-xl bg-[#123f2c] px-3 py-2 text-[10px] text-[#35d878]">{notice}</p>}
      {error && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[10px] text-red-300">{error}</p>}
      <p className="mt-4 text-[11px] leading-relaxed opacity-75">{job.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><Metric value={`R$ ${job.salaryMin.toLocaleString('pt-BR')}–${job.salaryMax.toLocaleString('pt-BR')}`} label="Faixa de orçamento" /><Metric value={job.duration} label="Prazo" /><Metric value={job.remote ? 'Remoto' : job.location || 'A combinar'} label="Formato" /><Metric value={job.negotiable ? 'Sim' : 'Não'} label="Negociável" /></div>
      {role === 'prestador' && status === 'Em análise' && <button disabled={updating} onClick={() => { void updateStatus('Em andamento') }} className="mt-4 w-full rounded-xl bg-[#35d878] px-3 py-3 text-[11px] font-bold text-black disabled:opacity-50">{updating ? 'Aceitando...' : 'Aceitar e pegar trabalho'}</button>}
      {role === 'prestador' && status === 'Em andamento' && <button disabled={updating} onClick={() => { void updateStatus('Concluído') }} className="mt-4 w-full rounded-xl border border-[#35d878] px-3 py-3 text-[11px] font-bold text-[#35d878] disabled:opacity-50">{updating ? 'Atualizando...' : 'Marcar trabalho como concluído'}</button>}
      {role === 'prestador' && status === 'Concluído' && <p className="mt-4 rounded-xl bg-[#123f2c] px-3 py-2 text-[10px] text-[#35d878]">Aguardando o cliente confirmar a conclusão e enviar a avaliação.</p>}
      <div className="mt-4"><h2 className="text-[12px] font-bold">Cliente</h2><p className="mt-1 text-[11px] opacity-70">{job.clientName || 'Cliente'}{job.clientRating ? ` · ★ ${job.clientRating.toFixed(1)}` : ''}</p></div>
      <div className="mt-4"><h2 className="text-[12px] font-bold">Requisitos</h2><ul className="mt-2 space-y-1 text-[11px] opacity-70">{(job.requirements || job.skills).map(item => <li key={item}>• {item}</li>)}</ul></div>
    </article>
  </>
}
function SearchScreen({ role, onProvider, onJob }: { role: Role; onProvider: (provider: ProviderProfile) => void; onJob?: (job: import('@/lib/api').Job) => void }) {
  return role === 'prestador'
    ? <><Header title="Buscar trabalhos" subtitle="Encontre oportunidades abertas" /><ProviderJobsScreen onJob={onJob} /></>
    : <ClientSearchScreen onProvider={onProvider} />
}

function ClientSearchScreen({ onProvider }: { onProvider: (provider: ProviderProfile) => void }) {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [subSector, setSubSector] = useState<string | null>(null)
  const [providers, setProviders] = useState<ProviderProfile[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.getCategories().then(setCategories).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load categories.')) }, [])
  useEffect(() => {
    if (selected && subSector) api.getProviders(selected, subSector).then(setProviders).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load providers.'))
  }, [selected, subSector])
  const card = 'border-[#a8cdb4] bg-[#effbf2] text-black'
  if (selected && subSector) return <>
    <Header title={subSector} subtitle="Prestadores por setor" action={<button onClick={() => setSubSector(null)} className="text-[11px] font-bold text-[#087a39]">Voltar</button>} />
    {error && <p className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
    <div className="space-y-2.5">{providers ? providers.map(provider => <button key={provider.id} onClick={() => onProvider(provider)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${card}`}><Avatar name={provider.name} /><span className="min-w-0 flex-1"><strong className="block text-[13px]">{provider.name}</strong><small className="block text-[10px] opacity-60">{provider.role} - {provider.city}</small><span className="mt-1 block text-[11px] font-bold text-[#087a39]">Rating {provider.rating.toFixed(1)} ({provider.reviews} reviews)</span></span><ChevronRight size={14} className="opacity-60" /></button>) : <Skeleton className="h-20 rounded-2xl" />}</div>
  </>
  const category = categories?.find(item => item.name === selected)
  if (selected) return <>
    <Header title={selected} subtitle="Choose a service type" action={<button onClick={() => setSelected(null)} className="text-[11px] font-bold text-[#087a39]">Back</button>} />
    <div className="grid grid-cols-2 gap-2.5">{(category?.serviceTypes || []).map(item => <button key={item} onClick={() => setSubSector(item)} className={`min-h-20 rounded-2xl border p-4 text-left text-[12px] font-bold ${card}`}>{item}<ChevronRight size={14} className="mt-2 text-[#35d878]" /></button>)}</div>
  </>
  return <>
    <Header title="Search services" subtitle="Find the right professional" />
    {error && <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
    <div className="space-y-2.5">{categories ? categories.map(categoryItem => { const Icon = icons[categoryItem.icon as keyof typeof icons] || BriefcaseBusiness; return <button key={categoryItem.id} onClick={() => { setSelected(categoryItem.name); setProviders(null); setError('') }} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left ${card}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-[#35d878]"><Icon size={19} /></span><span className="flex-1"><strong className="block text-[13px]">{categoryItem.name}</strong><small className="text-[10px] opacity-60">{categoryItem.serviceTypes.length} service types</small></span><ChevronRight size={14} className="text-[#087a39]" /></button> }) : <Skeleton className="h-20 rounded-2xl" />}</div>
  </>
}
function ServiceCard({ service, dark }: { service: Service; dark?: boolean }) { return <article className={`rounded-2xl border p-4 ${dark ? 'border-white/10 bg-[#111827]' : 'border-[#a8cdb4] bg-[#effbf2] text-black'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-[13px] font-bold leading-tight">{service.title}</h3><p className="mt-1 text-[10px] opacity-60">{service.category}</p></div><span className="rounded-full border border-[#35d878] bg-[#123f2c] px-2 py-1 text-[9px] font-bold text-[#35d878]">{service.status.toUpperCase()}</span></div><p className="mt-3 line-clamp-2 text-[11px] leading-relaxed opacity-65">{service.description}</p><div className="mt-3 flex items-center justify-between border-t border-current/10 pt-3"><span className="text-[10px] opacity-60">{service.duration}</span><strong className="text-[13px] text-[#087a39]">R$ {service.price.toLocaleString('pt-BR')}</strong></div></article> }
function ClientServicesScreen({ onCreated, onJob }: { onCreated: (job: import('@/lib/api').Job) => void; onJob?: (job: import('@/lib/api').Job) => void }) {
  type PostForm = Omit<import('@/lib/api').CreatePostCommand, 'Price' | 'SectorId' | 'ServiceTypeId'> & { Price: string; SectorId: string; ServiceTypeId: string }
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PostForm>({ Title: '', Description: '', Price: '', DeliveryDays: '', DeliveryHours: '', SectorId: '', ServiceTypeId: '' })
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  useEffect(() => { api.getCategories().then(setCategories).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load service categories.')) }, [])
  const update = (key: keyof PostForm, value: string) => setForm(current => ({ ...current, [key]: value }))
  const selectedCategory = categories.find(category => category.id === Number(form.SectorId))
  const submit = async () => {
    try {
      const payload: import('@/lib/api').CreatePostCommand = {
        ...form,
        Price: Number(form.Price),
        SectorId: Number(form.SectorId),
        ServiceTypeId: Number(form.ServiceTypeId),
        DeliveryHours: form.DeliveryHours.length === 5 ? `${form.DeliveryHours}:00` : form.DeliveryHours,
      }
      const job = await api.createJob(payload)
      onCreated(job)
      setCreating(false)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not publish the work.')
    }
  }
  // O backend continua validando os campos antes de publicar.
  // const valid = Boolean(form.Title && form.Description && form.DeliveryDays && form.DeliveryHours && Number(form.Price) > 0 && Number(form.SectorId) > 0 && Number(form.ServiceTypeId) > 0)
  if (creating) return <>
    <Header title="Criar servico" subtitle="Preencha os campos do comando de publicacao" action={<button onClick={() => setCreating(false)} className="text-[11px] font-bold text-[#087a39]">Cancelar</button>} />
    <div className="space-y-3">
      <label className="block text-[10px] font-bold text-[#087a39]">Title<input value={form.Title} onChange={event => update('Title', event.target.value)} className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-[#effbf2] px-3 py-3 text-[11px] text-black outline-none focus:border-[#087a39]" /></label>
      <label className="block text-[10px] font-bold text-[#087a39]">Description<textarea value={form.Description} onChange={event => update('Description', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-[#a8cdb4] bg-[#effbf2] px-3 py-3 text-[11px] text-black outline-none focus:border-[#087a39]" /></label>
      <label className="block text-[10px] font-bold text-[#087a39]">Price<input type="number" min="0.01" step="0.01" value={form.Price} onChange={event => update('Price', event.target.value)} className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-[#effbf2] px-3 py-3 text-[11px] text-black outline-none" /></label>
      <label className="block text-[10px] font-bold text-[#087a39]">DeliveryDays<input type="date" value={form.DeliveryDays} onChange={event => update('DeliveryDays', event.target.value)} className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-[#effbf2] px-3 py-3 text-[11px] text-black outline-none" /></label>
      <label className="block text-[10px] font-bold text-[#087a39]">DeliveryHours<input type="time" step="1" value={form.DeliveryHours} onChange={event => update('DeliveryHours', event.target.value)} className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-[#effbf2] px-3 py-3 text-[11px] text-black outline-none" /></label>
      <label className="block text-[10px] font-bold text-[#087a39]">SectorId<select value={form.SectorId} onChange={event => setForm(current => ({ ...current, SectorId: event.target.value, ServiceTypeId: '' }))} className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-[#effbf2] px-3 py-3 text-[11px] text-black"><option value="">Select a sector</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name} (ID {category.id})</option>)}</select></label>
      <label className="block text-[10px] font-bold text-[#087a39]">ServiceTypeId<select value={form.ServiceTypeId} onChange={event => update('ServiceTypeId', event.target.value)} /* disabled={!selectedCategory} */ className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-[#effbf2] px-3 py-3 text-[11px] text-black disabled:opacity-50"><option value="">Select a service type</option>{selectedCategory?.serviceTypes.map((serviceType, index) => <option key={serviceType} value={index + 1}>{serviceType} (ID {index + 1})</option>)}</select></label>
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
      <button onClick={submit} /* disabled={!valid} */ className="w-full rounded-xl bg-[#35d878] px-4 py-3 text-[11px] font-extrabold text-black disabled:opacity-50">Publicar servico</button>
    </div>
  </>
  return <><button onClick={() => setCreating(true)} className="mb-5 w-full rounded-2xl border-2 border-dashed border-[#087a39] bg-[#effbf2] px-4 py-4 text-[12px] font-extrabold text-[#087a39]">+ Create new work</button><ClientServicesLegacy onJob={onJob} /></>
}
function ClientServicesLegacy({ onJob }: { onJob?: (job: import('@/lib/api').Job) => void }) {
  const [services, setServices] = useState<Service[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.getServices()
      .then(setServices)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar seus trabalhos.'))
  }, [])
  const openService = async (service: Service) => {
    try {
      const jobs = await api.getJobs()
      const job = jobs.find(item => item.id === service.id)
      if (!job) throw new Error('O trabalho não foi encontrado.')
      onJob?.(job)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível abrir o trabalho.')
    }
  }
  const statusCounts = [
    ['Em análise', 'Em análise'],
    ['Em andamento', 'Em andamento'],
    ['Concluído', 'Concluídos'],
    ['Recusado', 'Recusados'],
  ] as const
  return <>
    <Header title="Meus trabalhos" subtitle="Acompanhe suas solicitações" />
    {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
    {services === null && !error
      ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div>
      : services?.length
        ? <>
          <div className="mb-5 grid grid-cols-2 gap-2">{statusCounts.map(([status, label]) => <div key={status} className="rounded-xl border border-[#a8cdb4] bg-[#effbf2] px-2 py-3 text-center text-black"><strong className="block text-lg text-[#087a39]">{services.filter(service => service.status === status).length}</strong><small className="text-[9px] opacity-60">{label}</small></div>)}</div>
          <div className="space-y-2">{services.map(service => <button key={service.id} type="button" onClick={() => { void openService(service) }} className="block w-full text-left"><ServiceCard service={service} /></button>)}</div>
        </>
        : !error && <p className="rounded-xl border border-dashed border-black/20 p-6 text-center text-[11px] opacity-60">Você ainda não publicou nenhum trabalho.</p>}
  </>
}
function ProviderServicesScreen({ onJob }: { onJob?: (job: import('@/lib/api').Job) => void }) {
  const [jobs, setJobs] = useState<import('@/lib/api').Job[] | null>(null)
  const [minimum, setMinimum] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    api.getJobs()
      .then(setJobs)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os trabalhos.'))
  }, [])
  const minimumValue = Number(minimum) || 0
  const visibleJobs = jobs?.filter(job => job.status === 'Em análise' && job.salaryMax >= minimumValue)
  return <>
    <Header title="Trabalhos disponíveis" subtitle="Oportunidades abertas para você" action={<Bell size={18} className="text-[#35d878]" />} />
    <label className="mb-4 block text-[10px] font-bold text-[#35d878]">Valor mínimo do trabalho<input value={minimum} onChange={event => setMinimum(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="Ex.: 1500" className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-3 text-[12px] text-white outline-none focus:border-[#35d878]" /></label>
    {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-300">{error}</p>}
    <div className="space-y-3">{jobs === null && !error ? <Skeleton className="h-56 rounded-2xl" /> : visibleJobs?.length ? visibleJobs.map(job => <article key={job.id} onClick={() => onJob?.(job)} className="cursor-pointer rounded-2xl border border-white/10 bg-[#111827] p-4"><div className="flex items-start justify-between"><div><span className="text-[9px] font-bold text-[#35d878]">{job.subSector} · {job.remote ? 'Remoto' : job.location || 'A combinar'}</span><h3 className="mt-1 text-[14px] font-bold">{job.title}</h3></div><span className="rounded-full bg-[#123f2c] px-2 py-1 text-[9px] text-[#35d878]">{job.urgency}</span></div><p className="mt-3 text-[11px] leading-relaxed opacity-65">{job.description}</p><div className="mt-3 flex flex-wrap gap-2">{job.skills.map(skill => <span key={skill} className="rounded-full bg-black px-2 py-1 text-[9px]">{skill}</span>)}</div><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><div><strong className="text-[13px] text-[#35d878]">R$ {job.salaryMin.toLocaleString('pt-BR')}–{job.salaryMax.toLocaleString('pt-BR')}</strong><small className="ml-2 text-[9px] opacity-60">{job.negotiable ? 'Negociável' : 'Valor fechado'}</small></div><button onClick={event => { event.stopPropagation(); onJob?.(job) }} className="rounded-xl bg-[#35d878] px-4 py-2 text-[10px] font-extrabold text-black">Ver detalhes</button></div></article>) : !error && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-[11px] opacity-60">Nenhum trabalho aberto para este valor mínimo.</p>}</div>
  </>
}
function AuthScreen({ onLogin }: { onLogin: (user: import('@/lib/api').AppUser) => void }) {
  type RegistrationForm = { UserName: string; Email: string; Password: string; PasswordHash: string; Name: string; PhoneNumber: string; PhotoUrl: string; BirthDate: string; Address: string; CPF: string }
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [form, setForm] = useState<RegistrationForm>({ UserName: '', Email: '', Password: '', PasswordHash: '', Name: '', PhoneNumber: '', PhotoUrl: '', BirthDate: '', Address: '', CPF: '' })
  const [profile, setProfile] = useState<ActiveProfile>('Client')
  const [loginProfile, setLoginProfile] = useState<ActiveProfile>('Client')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const update = (key: keyof RegistrationForm, value: string) => setForm(current => ({ ...current, [key]: value }))
  const submit = async () => {
    setError('')
    if (mode === 'forgot') { setError('Recuperação de senha não está habilitada neste backend de demonstração.'); return }
    setSubmitting(true)
    try {
      if (mode === 'login') {
        // A autenticação do backend continua obrigatória.
        // if ((!form.Email && !form.UserName) || !form.Password) {
        //   setError('Informe usuário ou e-mail e senha.')
        //   return
        // }
        onLogin(await api.login({
          UserName: form.UserName || null,
          Email: form.Email || null,
          Password: form.Password,
          Profile: loginProfile,
        }))
        return
      }

      // O backend continua validando os dados do cadastro.
      // const required = [form.UserName, form.Email, form.PasswordHash, form.Name, form.PhoneNumber, form.BirthDate]
      // if (required.some(value => !value) || (profile === 'FreeLancer' && !/^\d{11}$/.test(form.CPF))) {
      //   setError(profile === 'Client' ? 'Preencha os campos obrigatórios do cadastro de cliente.' : 'Preencha os campos obrigatórios e informe um CPF com 11 dígitos.')
      //   return
      // }
      const common = {
        UserName: form.UserName,
        Email: form.Email,
        PasswordHash: form.PasswordHash,
        Name: form.Name,
        PhoneNumber: form.PhoneNumber,
        PhotoUrl: form.PhotoUrl || null,
        BirthDate: form.BirthDate,
      }
      const payload: CreateClientCommand | CreateFreeLancerCommand = profile === 'Client'
        ? { ...common, Address: form.Address || null }
        : { ...common, CPF: form.CPF }
      onLogin(await api.register(profile, payload))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a solicitação.')
    } finally {
      setSubmitting(false)
    }
  }
  const input = (key: keyof RegistrationForm, label: string, required = false, type = 'text') => <label className="block text-[10px] font-bold text-[#087a39]">{label}{required && ' *'}<input required={required} type={type} value={form[key]} onChange={event => update(key, event.target.value)} className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-white/70 px-3 py-3 text-[11px] text-black outline-none focus:border-[#087a39]" /></label>
  return <main className="servilon-auth min-h-screen px-5 pt-16 text-black"><div className="mx-auto max-w-[430px]"><p className="text-[12px] font-bold text-[#087a39]">ServiLon</p><h1 className="mt-2 text-[27px] font-extrabold">{mode === 'login' ? 'Entre para continuar' : mode === 'register' ? 'Crie sua conta' : 'Recupere sua senha'}</h1><p className="mt-2 text-[12px] opacity-65">{mode === 'register' ? 'Os campos seguem os comandos de cadastro do backend.' : 'Acesse sua conta para continuar.'}</p>
    {mode === 'login' && <div className="mt-4 rounded-xl border border-dashed border-[#087a39]/40 bg-[#effbf2] p-3 text-[10px] text-[#087a39]"><strong>Contas para testar o fluxo</strong><br />Cliente: teste1@servilon.dev · 123456<br />Prestador: teste2@servilon.dev · 123456</div>}
    <div className="mt-7 space-y-3">
      {mode === 'register' && <>
        <label className="block text-[10px] font-bold text-[#087a39]">Tipo de cadastro<select value={profile} onChange={event => setProfile(event.target.value === 'FreeLancer' ? 'FreeLancer' : 'Client')} className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-white/70 px-3 py-3 text-[11px] text-black"><option value="Client">Cliente</option><option value="FreeLancer">Prestador (FreeLancer)</option></select></label>
        {input('UserName', 'UserName', true)}{input('Email', 'Email', true, 'email')}{input('PasswordHash', 'PasswordHash', true, 'password')}{input('Name', 'Name', true)}{input('PhoneNumber', 'PhoneNumber', true, 'tel')}{input('PhotoUrl', 'PhotoUrl', false, 'url')}{input('BirthDate', 'BirthDate', true, 'date')}
        {profile === 'Client' ? input('Address', 'Address') : input('CPF', 'CPF', true)}
      </>}
      {mode === 'login' && <>{input('Email', 'Email', false, 'email')}{input('UserName', 'UserName (alternativo)')}{input('Password', 'Password', true, 'password')}<label className="block text-[10px] font-bold text-[#087a39]">Profile<select value={loginProfile} onChange={event => setLoginProfile(event.target.value === 'FreeLancer' ? 'FreeLancer' : 'Client')} className="mt-1 w-full rounded-xl border border-[#a8cdb4] bg-white/70 px-3 py-3 text-[11px] text-black"><option value="Client">Cliente</option><option value="FreeLancer">Prestador (FreeLancer)</option></select></label></>}
      {mode === 'forgot' && input('Email', 'Email', true, 'email')}
    </div>
    {error && <p className="mt-3 rounded-xl bg-[#fff4d6] p-3 text-[10px] text-[#795700]">{error}</p>}
    <button onClick={submit} disabled={submitting} className="mt-5 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-extrabold text-white disabled:opacity-50">{submitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar instruções'}</button>
    <div className="mt-4 flex justify-between text-[10px] text-[#087a39]">{mode !== 'register' && <button onClick={() => setMode('register')} className="font-bold">Crie uma conta</button>}{mode !== 'forgot' && <button onClick={() => setMode('forgot')} className="font-bold">Esqueceu sua senha?</button>}{mode !== 'login' && <button onClick={() => setMode('login')} className="font-bold">Voltar ao login</button>}</div>
    <p className="mt-6 text-[10px] opacity-55">Backend fictício local: os dados persistem no servidor de desenvolvimento.</p></div></main>
}
function ProfileActions({ user, onLogout, onHistory, onBecomeProvider }: { user: import('@/lib/api').AppUser; onLogout: () => Promise<void>; onHistory: (type: HistoryType) => void; onBecomeProvider: (cpf: string) => Promise<void> }) {
  const [message, setMessage] = useState('')
  const [cpf, setCpf] = useState('')
  const [conversionOpen, setConversionOpen] = useState(false)
  const [converting, setConverting] = useState(false)
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
    setConverting(true)
    try {
      await onBecomeProvider(cpf)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível ativar o perfil de prestador.')
    } finally {
      setConverting(false)
    }
  }
  return <div className="mt-5 space-y-2">
    <button className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Personalização <span className="float-right opacity-50">›</span></button>
    <button className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Configurações <span className="float-right opacity-50">›</span></button>
    <button onClick={() => onHistory('concluidos')} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Histórico <span className="float-right opacity-50">›</span></button>
    {user.role === 'cliente' && !conversionOpen && <button onClick={() => { setMessage(''); setConversionOpen(true) }} className="w-full rounded-2xl border border-[#008254] bg-[#effcf8] p-4 text-left text-[12px] font-bold text-[#008254]">Ativar perfil de prestador <span className="float-right opacity-60">›</span></button>}
    {user.role === 'cliente' && conversionOpen && <form onSubmit={event => { void becomeProvider(event) }} className="rounded-lg border border-[#d8d9da] bg-white p-4">
      <label className="block text-[12px] font-bold text-[#3d4045]">CPF para cadastro de prestador
        <input required inputMode="numeric" autoComplete="off" maxLength={11} value={cpf} onChange={event => setCpf(event.target.value.replace(/\D/g, '').slice(0, 11))} className="mt-2 w-full rounded border border-[#d8d9da] bg-white px-3 py-3 text-[14px] text-black outline-none focus:border-[#008254]" />
      </label>
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={converting} className="flex-1 rounded bg-[#008254] px-3 py-3 text-[12px] font-bold text-white disabled:opacity-50">{converting ? 'Ativando...' : 'Confirmar perfil prestador'}</button>
        <button type="button" onClick={() => setConversionOpen(false)} disabled={converting} className="rounded border border-[#d8d9da] bg-[#f7f7f7] px-3 py-3 text-[12px] font-bold text-[#006642] disabled:opacity-50">Cancelar</button>
      </div>
    </form>}
    {user.role === 'prestador' && <button onClick={() => onHistory('avaliacoes')} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Minhas avaliações <span className="float-right text-[#35d878]">★ {user.rating.toFixed(1)} · {user.reviews}</span></button>}
    {user.role === 'prestador' && <button onClick={() => { void share() }} className="w-full rounded-2xl border border-current/10 bg-current/5 p-4 text-left text-[12px] font-bold">Compartilhar perfil <span className="float-right opacity-50">↗</span></button>}
    <button onClick={() => { void logout() }} className="w-full rounded-2xl border border-red-500/20 p-4 text-left text-[12px] font-bold text-red-500">Sair da conta</button>
    {message && <p role="status" className="text-center text-[10px] text-[#087a39]">{message}</p>}
  </div>
}
function ProfileScreen({ user }: { user: import('@/lib/api').AppUser }) {
  const provider = user.role === 'prestador'
  return <>
    <Header title="Meu perfil" subtitle="Suas informações e preferências" />
    <section className="flex items-center gap-4"><Avatar name={user.name} large /><div><h1 className="text-[17px] font-bold">{user.name}</h1><p className="text-[11px] opacity-60">{user.location || 'Location not set'}</p>{provider && <p className="mt-1 text-[11px] text-[#35d878]">Rating {user.rating.toFixed(1)} ({user.reviews} reviews)</p>}</div></section>
    <section className="mt-5 rounded-2xl border border-current/10 bg-current/5 p-4"><h2 className="text-[13px] font-bold">Profile</h2><p className="mt-1 text-[10px] opacity-60">{provider ? 'Provider account' : 'Client account'} - {user.email}</p><p className="mt-3 text-[11px] leading-relaxed opacity-65">{user.bio || 'No description provided.'}</p></section>
    {provider && <section className="mt-3 rounded-2xl border border-current/10 bg-current/5 p-4"><h2 className="text-[13px] font-bold">Habilidades</h2><p className="mt-2 text-[11px] opacity-65">{user.skills.length ? user.skills.join(', ') : 'Nenhuma habilidade cadastrada.'}</p></section>}
  </>
}
function ProviderProfileScreen({ provider, role, onBack, onCreateJob }: { provider: ProviderProfile; role: Role; onBack: () => void; onCreateJob: () => void }) {
  const card = role === 'cliente' ? 'border-[#a8cdb4] bg-[#effbf2] text-black' : 'border-white/10 bg-[#111827]'
  return <>
    <Header title="Perfil do prestador" subtitle="Confira experiência e serviços" action={<button onClick={onBack} className="text-[11px] font-bold text-[#087a39]">Voltar</button>} />
    <section className="flex items-center gap-4"><Avatar name={provider.name} large /><div><h1 className="text-[17px] font-bold">{provider.name}</h1><p className="text-[11px] opacity-60">{provider.role}</p><p className="text-[11px] text-[#087a39]">★ {provider.rating.toFixed(1)} <span className="opacity-60">({provider.reviews} avaliações)</span></p></div></section>
    <div className="mt-4 grid grid-cols-3 gap-2"><Metric value={String(provider.completed)} label="Concluídos" /><Metric value={provider.experience} label="Experiência" /><Metric value={provider.responseTime.replace('Responde em até ', '')} label="Resposta" /></div>
    <section className={`mt-4 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Sobre o profissional</h2><p className="mt-2 text-[11px] leading-relaxed opacity-70">{provider.bio}</p></section>
    <section className={`mt-3 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Habilidades</h2><div className="mt-3 flex flex-wrap gap-2">{provider.skills.length ? provider.skills.map(item => <span key={item} className="rounded-full bg-[#123f2c] px-2.5 py-1 text-[10px] text-[#35d878]">{item}</span>) : <span className="text-[11px] opacity-60">Nenhuma habilidade cadastrada.</span>}</div></section>
    <section className={`mt-3 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Serviços oferecidos</h2><div className="mt-3 space-y-2">{provider.services.length ? provider.services.map(item => <div key={item} className="flex items-center justify-between border-b border-current/10 pb-2 text-[11px]"><span>{item}</span><ChevronRight size={14} className="text-[#087a39]" /></div>) : <span className="text-[11px] opacity-60">Nenhum serviço cadastrado.</span>}</div></section>
    <section className={`mt-3 rounded-2xl border p-4 ${card}`}><h2 className="text-[13px] font-bold">Disponibilidade e atendimento</h2><p className="mt-2 text-[11px] opacity-70">{provider.availability || 'Disponibilidade a combinar'} · {provider.serviceFormat || 'Formato a combinar'}</p><h2 className="mt-4 text-[13px] font-bold">Certificações</h2><div className="mt-2 space-y-1 text-[11px] opacity-70">{provider.certifications.length ? provider.certifications.map(item => <p key={item}>✓ {item}</p>) : <p>Nenhuma certificação cadastrada.</p>}</div>{provider.links?.length ? <><h2 className="mt-4 text-[13px] font-bold">Links</h2><div className="mt-2 flex flex-wrap gap-2">{provider.links.map(link => <a key={link.label} href={link.url} className="text-[11px] text-[#087a39] underline">{link.label}</a>)}</div></> : null}</section>
    {role === 'cliente' && <button onClick={onCreateJob} className="mt-4 w-full rounded-2xl bg-[#35d878] px-4 py-3 text-[12px] font-extrabold text-black">Publicar um trabalho</button>}
  </>
}
function MessagesScreen({ role }: { role: Role }) {
  const [jobs, setJobs] = useState<import('@/lib/api').Job[] | null>(null)
  const [chat, setChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<import('@/lib/api').ChatMessage[] | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { api.getJobs().then(setJobs).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load jobs.')) }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, chat])
  useEffect(() => {
    if (!chat) return
    setMessages(null)
    api.getMessages(chat).then(setMessages).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load messages.'))
  }, [chat])
  const conversations = (jobs || []).filter(job => job.providerUserId && job.status !== 'Em análise' && job.status !== 'Recusado')
  const send = async () => {
    if (!chat) return
    // A API impede o envio de mensagens vazias.
    // if (!text.trim()) return
    try {
      const message = await api.sendMessage({ conversationId: chat, sender: '', text: text.trim() })
      setMessages(items => [...(items || []), message])
      setText('')
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send message.')
    }
  }
  if (chat) return <>
    <Header title={jobs?.find(job => String(job.id) === chat)?.title || 'Conversa'} subtitle="Mensagens do trabalho" action={<button onClick={() => setChat(null)} className="text-[11px] font-bold text-[#087a39]">Voltar</button>} />
    <div className="flex h-[calc(100vh-190px)] min-h-[420px] flex-col gap-3">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {error && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-[10px] text-red-500">{error}</div>}
        {messages === null ? <Skeleton className="h-12 w-3/4 rounded-2xl" /> : messages.length ? messages.map(message => <div key={message.id} className="max-w-[80%] rounded-2xl bg-current/10 px-3 py-2 text-[11px]">{message.sender}: {message.text}</div>) : <p className="rounded-xl bg-current/5 p-4 text-[11px] opacity-60">No messages yet. Send the first one.</p>}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-2 flex gap-2"><input value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void send() }} placeholder="Write a message" className="min-w-0 flex-1 rounded-xl border border-current/15 bg-transparent px-3 py-3 text-[11px] outline-none" /><button onClick={send} /* disabled={!text.trim()} */ className="rounded-xl bg-[#35d878] px-4 text-[11px] font-bold text-black disabled:opacity-40">Send</button></div>
    </div>
  </>
  return <>
    <Header title="Mensagens" subtitle={role === 'cliente' ? 'Conversas dos seus trabalhos' : 'Conversas de trabalhos aceitos'} />
    {error && <p className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
    {jobs === null ? <Skeleton className="h-20 rounded-2xl" /> : conversations.length ? conversations.map(job => <button key={job.id} onClick={() => setChat(String(job.id))} className="flex w-full items-center gap-3 border-b border-current/10 py-4 text-left"><Avatar name={job.provider || job.clientName || job.title} /><div className="min-w-0 flex-1"><strong className="block text-[13px]">{job.title}</strong><small className="block text-[9px] opacity-60">{job.provider} ? {job.status}</small></div></button>) : <p className="rounded-xl border border-dashed border-current/20 p-6 text-center text-[11px] opacity-60">No active work conversations.</p>}
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

  useEffect(() => {
    api.getSession()
      .then(user => {
        setSession(user)
        if (user) setRole(user.role)
      })
      .catch(reason => setSessionError(reason instanceof Error ? reason.message : 'Could not restore the session.'))
      .finally(() => setSessionLoading(false))
  }, [])

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
    setTab(nextTab)
  }
  const openJob = (nextJob: import('@/lib/api').Job) => {
    setProvider(null)
    setJob(nextJob)
  }
  const content = historyType
    ? <HistoryScreen type={historyType} onBack={() => setHistoryType(null)} />
    : job
      ? (role === 'cliente'
        ? <ClientServiceCompletion job={job} onBack={() => setJob(null)} />
        : <JobDetailScreen job={job} role={role} onBack={() => setJob(null)} />)
      : provider
        ? <ProviderProfileScreen provider={provider} role={role} onBack={() => setProvider(null)} onCreateJob={() => { setProvider(null); setTab('create') }} />
        : tab === 'home'
          ? <HomeScreen role={role} onTab={navigate} user={session} onNotifications={() => setNotificationsOpen(true)} />
          : tab === 'search'
            ? <SearchScreen role={role} onProvider={setProvider} onJob={openJob} />
            : tab === 'create'
              ? (isProvider
                ? <ProviderServicesScreen onJob={openJob} />
                : <ClientServicesScreen onCreated={createdJob => { setJob(createdJob); setTab('create') }} onJob={openJob} />)
              : tab === 'messages'
                ? <MessagesScreen role={role} />
                : <><ProfileScreen user={session} /><ProfileActions user={session} onLogout={logout} onHistory={type => setHistoryType(type)} onBecomeProvider={async cpf => {
                  const updatedUser = await api.convertClientToProvider(cpf)
                  setSession(updatedUser)
                  setRole(updatedUser.role)
                  setTab('home')
                  setHistoryType(null)
                  setProvider(null)
                  setJob(null)
                }} /></>

  return <main className="servilon-app min-h-screen bg-[#f7f7f7] text-[#3d4045]">
    {notificationsOpen && <NotificationModal onClose={() => setNotificationsOpen(false)} />}
    <div className="mx-auto min-h-screen w-full max-w-[900px] px-5 pb-24 pt-9">{content}</div>
    <BottomNav tab={tab} onTab={navigate} role={role} />
  </main>
}
