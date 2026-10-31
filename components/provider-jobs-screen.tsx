'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { api, type Job } from '@/lib/api'

type Props = { onJob?: (job: Job) => void }

export function ProviderJobsScreen({ onJob }: Props) {
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [query, setQuery] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (filters?: { query?: string; sectorId?: number; serviceTypeId?: number }) => {
    setLoading(true)
    setError('')
    try {
      setJobs(await api.getAllJobs(filters))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar posts de clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const search = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const sector = sectorId ? Number(sectorId) : undefined
    const serviceType = serviceTypeId ? Number(serviceTypeId) : undefined
    if ((sectorId && (!Number.isInteger(sector) || sector! < 1)) ||
      (serviceTypeId && (!Number.isInteger(serviceType) || serviceType! < 1))) {
      setError('Os IDs de setor e tipo de serviço precisam ser inteiros positivos.')
      return
    }
    void load({ query: query.trim(), sectorId: sector, serviceTypeId: serviceType })
  }

  return <section className="space-y-4">
    <form onSubmit={search} className="space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-4">
      <label className="block text-[10px] font-bold text-[#35d878]">
        Buscar posts por texto
        <span className="relative mt-1 block"><Search size={15} className="absolute left-3 top-3 text-white/50" /><input value={query} onChange={event => setQuery(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-9 pr-3 text-[11px] text-white outline-none focus:border-[#35d878]" /></span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-[10px] font-bold text-[#35d878]">ID do setor<input type="number" min="1" step="1" value={sectorId} onChange={event => setSectorId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-[11px] text-white outline-none" /></label>
        <label className="block text-[10px] font-bold text-[#35d878]">ID do tipo de serviço<input type="number" min="1" step="1" value={serviceTypeId} onChange={event => setServiceTypeId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-[11px] text-white outline-none" /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="submit" disabled={loading} className="rounded-xl bg-[#35d878] px-3 py-3 text-[10px] font-bold text-black disabled:opacity-50">{loading ? 'Buscando...' : 'Buscar posts'}</button>
        <button type="button" onClick={() => { setQuery(''); setSectorId(''); setServiceTypeId(''); void load() }} disabled={loading} aria-label="Atualizar posts" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-3 text-[10px] font-bold text-[#35d878] disabled:opacity-50"><RefreshCw size={14} /> Atualizar</button>
      </div>
    </form>

    <p className="text-[10px] text-white/55">Todos os posts estão sendo tratados como não atribuídos enquanto a conversão para serviço não existe.</p>
    {loading && !jobs && <div className="space-y-3">{[1, 2, 3].map(item => <div key={item} className="h-36 animate-pulse rounded-2xl bg-white/10" />)}</div>}
    {!loading && error && <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-[11px] text-red-200"><p>{error}</p><button onClick={() => { void load() }} className="mt-3 rounded-lg bg-red-300 px-3 py-2 font-bold text-black">Tentar novamente</button></div>}
    {!loading && !error && jobs?.length === 0 && <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center text-[11px] text-white/60">Nenhum post de cliente encontrado para esses filtros.</div>}
    {!error && jobs?.map(post => <button key={post.id} onClick={() => onJob?.(post)} className="block w-full rounded-2xl border border-white/10 bg-[#111827] p-4 text-left"><div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-bold text-[#35d878]">{post.category || `Setor ${post.sectorId ?? '—'}`} · {post.subSector || `Tipo ${post.serviceTypeId ?? '—'}`}</span><h3 className="mt-1 text-[14px] font-bold">{post.title}</h3></div><span className="rounded-full bg-[#123f2c] px-2 py-1 text-[9px] text-[#35d878]">Não atribuído</span></div><p className="mt-3 line-clamp-3 text-[11px] leading-relaxed opacity-65">{post.description}</p><div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-[11px]"><b className="text-[#35d878]">Orçamento · R$ {post.price.toLocaleString('pt-BR')}</b><span className="font-bold text-[#35d878]">Ver post</span></div></button>)}
  </section>
}
