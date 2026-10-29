'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart, RefreshCw, Search } from 'lucide-react'
import { api, type Job } from '@/lib/api'

type Props = { onJob?: (job: Job) => void }

export function ProviderJobsScreen({ onJob }: Props) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [query, setQuery] = useState('')
  const [sector, setSector] = useState('Todos')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favoriteError, setFavoriteError] = useState('')
  const [favorites, setFavorites] = useState<number[]>([])
  const pageSize = 4

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setJobs(await api.getJobs())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os trabalhos.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
    api.getFavoriteJobIds().then(setFavorites).catch(reason => setFavoriteError(reason instanceof Error ? reason.message : 'Não foi possível carregar os favoritos.'))
  }, [])

  const sectors = useMemo(() => ['Todos', ...new Set(jobs.map(job => job.category))], [jobs])
  const filtered = useMemo(() => jobs.filter(job => {
    const text = `${job.title} ${job.description} ${job.subSector} ${job.skills.join(' ')}`.toLowerCase()
    return (!query || text.includes(query.toLowerCase())) && (sector === 'Todos' || job.category === sector)
  }), [jobs, query, sector])
  const visible = filtered.slice(0, page * pageSize)
  const toggleFavorite = async (job: Job) => {
    const next = favorites.includes(job.id) ? favorites.filter(id => id !== job.id) : [...favorites, job.id]
    try {
      await api.setFavoriteJob(job.id, !favorites.includes(job.id))
      setFavorites(next)
      setFavoriteError('')
    } catch (reason) {
      setFavoriteError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o favorito.')
    }
  }

  return <section className="space-y-4">
    <div className="flex gap-2"><label className="relative flex-1"><Search size={15} className="absolute left-3 top-3 text-white/50" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder="Buscar por título, habilidade ou serviço" className="w-full rounded-xl border border-white/10 bg-[#111827] py-3 pl-9 pr-3 text-[11px] text-white outline-none focus:border-[#35d878]" /></label><button onClick={load} aria-label="Atualizar trabalhos" className="rounded-xl border border-white/10 px-3 text-[#35d878]"><RefreshCw size={15} /></button></div>
    <div className="flex gap-2 overflow-x-auto pb-1">{sectors.map(item => <button key={item} onClick={() => { setSector(item); setPage(1) }} className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] ${sector === item ? 'bg-[#35d878] text-black' : 'bg-[#111827] text-white/70'}`}>{item}</button>)}</div>
    {loading && <div className="space-y-3">{[1, 2, 3].map(item => <div key={item} className="h-36 animate-pulse rounded-2xl bg-white/10" />)}</div>}
    {!loading && error && <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-[11px] text-red-200"><p>{error}</p><button onClick={load} className="mt-3 rounded-lg bg-red-300 px-3 py-2 font-bold text-black">Tentar novamente</button></div>}
    {favoriteError && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-[11px] text-red-200">{favoriteError}</p>}
    {!loading && !error && visible.length === 0 && <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center text-[11px] text-white/60">Nenhum trabalho encontrado com esses filtros.</div>}
    {!loading && !error && visible.map(job => <article key={job.id} onClick={() => onJob?.(job)} className="cursor-pointer rounded-2xl border border-white/10 bg-[#111827] p-4"><div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-bold text-[#35d878]">{job.subSector} · {job.remote ? 'Remoto' : job.location || 'A combinar'}</span><h3 className="mt-1 text-[14px] font-bold">{job.title}</h3></div><button onClick={event => { event.stopPropagation(); void toggleFavorite(job) }} aria-label={favorites.includes(job.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} className="rounded-full p-1"><Heart size={17} fill={favorites.includes(job.id) ? 'currentColor' : 'none'} className={favorites.includes(job.id) ? 'text-[#35d878]' : 'text-white/50'} /></button></div><p className="mt-3 text-[11px] leading-relaxed opacity-65">{job.description}</p><div className="mt-3 flex flex-wrap gap-2">{job.skills.map(skill => <span key={skill} className="rounded-full bg-black px-2 py-1 text-[9px]">{skill}</span>)}</div><div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-[11px]"><b className="text-[#35d878]">R$ {job.salaryMin.toLocaleString('pt-BR')}–{job.salaryMax.toLocaleString('pt-BR')}</b><span className="opacity-60">{job.status}</span></div><button onClick={event => { event.stopPropagation(); onJob?.(job) }} className="mt-3 w-full rounded-xl bg-[#35d878] px-4 py-2 text-[10px] font-extrabold text-black">Ver detalhes e aceitar</button></article>)}
    {!loading && !error && visible.length < filtered.length && <button onClick={() => setPage(value => value + 1)} className="w-full rounded-xl border border-[#35d878] px-4 py-3 text-[11px] font-bold text-[#35d878]">Carregar mais</button>}
  </section>
}
