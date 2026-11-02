'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, BriefcaseBusiness, ChevronRight, Leaf, Monitor, Palette, RefreshCw, Scale, Search, TrendingUp, Wrench } from 'lucide-react'
import { api, type Job, type Role, type Sector, type ServiceType } from '@/lib/api'
import { formatPostPriceRange } from '@/lib/post-mapper'

type PostSearchProps = { role: Role; onJob?: (job: Job) => void }

const sectorIcons = [Monitor, TrendingUp, BookOpen, Leaf, Scale, Palette, Wrench, BriefcaseBusiness]

export function PostSearchScreen({ role, onJob }: PostSearchProps) {
  const [sectors, setSectors] = useState<Sector[] | null>(null)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[] | null>(null)
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  const [posts, setPosts] = useState<Job[] | null>(null)
  const [query, setQuery] = useState('')
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [error, setError] = useState('')
  const [postError, setPostError] = useState('')

  const loadCatalog = async () => {
    setLoadingCatalog(true)
    setError('')
    try {
      const [loadedSectors, loadedServiceTypes] = await Promise.all([
        api.getSectors(),
        api.getServiceTypes(),
      ])
      setSectors(loadedSectors)
      setServiceTypes(loadedServiceTypes)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar setores e tipos de serviço.')
    } finally {
      setLoadingCatalog(false)
    }
  }

  useEffect(() => { void loadCatalog() }, [])

  const visibleServiceTypes = useMemo(
    () => serviceTypes?.filter(item => item.sectorId === selectedSector?.id) || [],
    [serviceTypes, selectedSector],
  )

  const loadPosts = async (searchQuery = '') => {
    if (!selectedSector || !selectedServiceType) return
    setLoadingPosts(true)
    setPostError('')
    try {
      setPosts(await api.getAllJobs({
        query: searchQuery.trim() || undefined,
        sectorId: selectedSector.id,
        serviceTypeId: selectedServiceType.id,
      }))
    } catch (reason) {
      setPostError(reason instanceof Error ? reason.message : 'Não foi possível carregar os posts.')
    } finally {
      setLoadingPosts(false)
    }
  }

  const openServiceType = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType)
    setPosts(null)
    setQuery('')
    setPostError('')
    if (selectedSector) {
      setLoadingPosts(true)
      void api.getAllJobs({ sectorId: selectedSector.id, serviceTypeId: serviceType.id })
        .then(setPosts)
        .catch(reason => setPostError(reason instanceof Error ? reason.message : 'Não foi possível carregar os posts.'))
        .finally(() => setLoadingPosts(false))
    }
  }

  const card = role === 'cliente'
    ? 'border-[#a8cdb4] bg-[#effbf2] text-black'
    : 'border-white/10 bg-[#111827] text-white'
  const accent = role === 'cliente' ? 'text-[#087a39]' : 'text-[#35d878]'
  const button = role === 'cliente' ? 'bg-[#087a39] text-white' : 'bg-[#35d878] text-black'
  const muted = role === 'cliente' ? 'opacity-60' : 'text-white/55'

  const backToSectors = () => {
    setSelectedSector(null)
    setSelectedServiceType(null)
    setPosts(null)
    setQuery('')
    setPostError('')
  }
  const backToServiceTypes = () => {
    setSelectedServiceType(null)
    setPosts(null)
    setQuery('')
    setPostError('')
  }
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void loadPosts(query)
  }

  if (loadingCatalog) {
    return <section className="space-y-3"><Header role={role} title="Carregando busca" subtitle="Buscando setores e tipos de serviço" /><div className="grid grid-cols-2 gap-3"><Skeleton role={role} /><Skeleton role={role} /><Skeleton role={role} /><Skeleton role={role} /></div></section>
  }

  if (error) {
    return <section><Header role={role} title="Busca" subtitle="Não foi possível preparar as categorias" /><div role="alert" className={`rounded-2xl border p-4 text-[11px] ${card}`}><p>{error}</p><button onClick={() => { void loadCatalog() }} className={`mt-3 rounded-xl px-4 py-2 font-bold ${button}`}>Tentar novamente</button></div></section>
  }

  if (!sectors?.length) {
    return <section><Header role={role} title="Busca" subtitle="Explore serviços por setor" /><Empty role={role}>Nenhum setor cadastrado.</Empty></section>
  }

  if (selectedServiceType && selectedSector) return <section className="space-y-4">
    <Header
      role={role}
      title={selectedServiceType.name}
      subtitle={`${selectedSector.name} · ${role === 'cliente' ? 'Serviços oferecidos por prestadores' : 'Trabalhos publicados por clientes'}`}
      action={<button onClick={backToServiceTypes} className={`text-[11px] font-bold ${accent}`}>Voltar</button>}
    />
    <form onSubmit={submitSearch} className={`flex gap-2 rounded-2xl border p-3 ${card}`}>
      <label className="relative min-w-0 flex-1"><Search size={15} className={`absolute left-3 top-3 ${muted}`} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por texto" className="w-full rounded-xl border border-current/15 bg-transparent py-3 pl-9 pr-3 text-[11px] outline-none" /></label>
      <button type="submit" disabled={loadingPosts} className={`rounded-xl px-4 py-3 text-[10px] font-bold disabled:opacity-50 ${button}`}>{loadingPosts ? 'Buscando...' : 'Buscar'}</button>
    </form>
    {postError && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{postError}<button onClick={() => { void loadPosts(query) }} className={`ml-2 font-bold ${accent}`}>Tentar novamente</button></p>}
    {loadingPosts && <div className="space-y-3"><Skeleton role={role} /><Skeleton role={role} /></div>}
    {!loadingPosts && !postError && posts?.length === 0 && <Empty role={role}>Nenhum post encontrado neste tipo de serviço.</Empty>}
    {!loadingPosts && !postError && posts?.map(post => <button key={post.id} onClick={() => onJob?.(post)} className={`block w-full rounded-2xl border p-4 text-left ${card}`}>
      <div className="flex items-start justify-between gap-2"><div><span className={`text-[9px] font-bold ${accent}`}>{selectedSector.name} · {selectedServiceType.name}</span><strong className="mt-1 block text-[13px]">{post.title}</strong></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${role === 'cliente' ? 'bg-[#d5f2dd] text-[#087a39]' : 'bg-[#123f2c] text-[#35d878]'}`}>Não atribuído</span></div>
      <p className={`mt-3 line-clamp-3 text-[11px] leading-relaxed ${muted}`}>{post.description}</p>
      <div className="mt-3 flex items-center justify-between border-t border-current/10 pt-3"><strong className={`text-[12px] ${accent}`}>{role === 'cliente' ? 'Faixa de preço' : 'Faixa de orçamento'} · {formatPostPriceRange(post.salaryMin, post.salaryMax)}</strong><span className={`text-[10px] font-bold ${accent}`}>Ver post</span></div>
    </button>)}
  </section>

  if (selectedSector) return <section>
    <Header
      role={role}
      title={selectedSector.name}
      subtitle="Escolha o tipo de serviço"
      action={<button onClick={backToSectors} className={`text-[11px] font-bold ${accent}`}>Voltar aos setores</button>}
    />
    {visibleServiceTypes.length
      ? <div className="grid grid-cols-2 gap-3">{visibleServiceTypes.map((serviceType, index) => {
        const Icon = sectorIcons[index % sectorIcons.length]
        return <button key={serviceType.id} onClick={() => openServiceType(serviceType)} className={`min-h-28 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${card}`}><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${role === 'cliente' ? 'bg-black text-[#35d878]' : 'bg-[#123f2c] text-[#35d878]'}`}><Icon size={18} /></span><strong className="mt-3 block text-[12px]">{serviceType.name}</strong><ChevronRight size={14} className={`mt-2 ${accent}`} /></button>
      })}</div>
      : <Empty role={role}>Este setor ainda não tem tipos de serviço cadastrados.</Empty>}
  </section>

  return <section>
    <Header role={role} title={role === 'cliente' ? 'Buscar serviços' : 'Buscar trabalhos'} subtitle="Selecione um setor para continuar" />
    <div className="grid grid-cols-2 gap-3">{sectors.map((sector, index) => {
      const Icon = sectorIcons[index % sectorIcons.length]
      const typeCount = serviceTypes?.filter(item => item.sectorId === sector.id).length || 0
      return <button key={sector.id} onClick={() => setSelectedSector(sector)} className={`min-h-32 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${card}`}><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${role === 'cliente' ? 'bg-black text-[#35d878]' : 'bg-[#123f2c] text-[#35d878]'}`}><Icon size={20} /></span><strong className="mt-4 block text-[13px]">{sector.name}</strong><small className={`mt-1 block text-[10px] ${muted}`}>{typeCount} tipos de serviço</small><ChevronRight size={14} className={`mt-2 ${accent}`} /></button>
    })}</div>
  </section>
}

function Header({ role, title, subtitle, action }: { role: Role; title: string; subtitle: string; action?: React.ReactNode }) {
  return <header className="mb-5 flex items-start justify-between border-b border-current/15 pb-4">
    <div><h1 className="text-[18px] font-extrabold tracking-tight">{title}</h1><p className="mt-1 text-[11px] opacity-65">{subtitle}</p></div>{action}
  </header>
}

function Skeleton({ role }: { role: Role }) {
  return <div className={`h-28 animate-pulse rounded-2xl ${role === 'cliente' ? 'bg-[#087a39]/10' : 'bg-white/10'}`} />
}

function Empty({ role, children }: { role: Role; children: React.ReactNode }) {
  return <p className={`rounded-xl border border-dashed p-6 text-center text-[11px] ${role === 'cliente' ? 'border-black/20 text-black/60' : 'border-white/15 text-white/60'}`}>{children}</p>
}
