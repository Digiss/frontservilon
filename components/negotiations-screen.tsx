'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, type Negotiation, type Role, type ServiceRecord } from '@/lib/api'
import { NegotiationChatScreen } from './negotiation-chat-screen'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-current/10 ${className}`} />
}

function Avatar({ name }: { name: string }) {
  return <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-current/10 text-xs font-bold">
    {name.split(' ').map(value => value[0]).join('')}
  </div>
}

export function NegotiationsScreen({
  role,
  initialNegotiationId,
  initialError,
  onInitialNegotiationOpened,
  onInitialErrorShown,
}: {
  role: Role
  initialNegotiationId: number | null
  initialError: string
  onInitialNegotiationOpened: () => void
  onInitialErrorShown: () => void
}) {
  const [negotiations, setNegotiations] = useState<Negotiation[] | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({})
  const [postTitles, setPostTitles] = useState<Map<number, string>>(new Map())
  const [postTitlesLoaded, setPostTitlesLoaded] = useState(false)
  const [postTitleError, setPostTitleError] = useState('')
  const [titleRefreshCount, setTitleRefreshCount] = useState(0)
  const [selectedNegotiationId, setSelectedNegotiationId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [displayedInitialError, setDisplayedInitialError] = useState(initialError)
  const postIdsKey = negotiations === null
    ? null
    : [...new Set(negotiations.map(negotiation => negotiation.postId))].sort((a, b) => a - b).join(',')

  const loadInbox = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    const [negotiationsResult, unreadResult] = await Promise.allSettled([
      api.getNegotiations(),
      api.getUnreadMessages(),
    ])
    if (negotiationsResult.status === 'fulfilled') {
      setNegotiations(negotiationsResult.value)
      setError('')
    } else {
      setError(negotiationsResult.reason instanceof Error
        ? negotiationsResult.reason.message
        : 'Não foi possível carregar as negociações.')
    }
    if (unreadResult.status === 'fulfilled') setUnreadCounts(unreadResult.value)
    else if (negotiationsResult.status === 'fulfilled') {
      setError(unreadResult.reason instanceof Error
        ? unreadResult.reason.message
        : 'Não foi possível carregar a contagem de mensagens não lidas.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadInbox(true)
    const timer = window.setInterval(() => { void loadInbox() }, 15000)
    return () => window.clearInterval(timer)
  }, [loadInbox])

  useEffect(() => {
    if (postIdsKey === null) return
    if (!postIdsKey) {
      setPostTitles(new Map())
      setPostTitlesLoaded(true)
      setPostTitleError('')
      return
    }

    let active = true
    const postIds = postIdsKey.split(',').map(Number)
    setPostTitlesLoaded(false)
    setPostTitleError('')

    const loadTitles = async () => {
      const titles = new Map<number, string>()
      const failures: string[] = []
      let services: ServiceRecord[] = []

      try {
        services = await api.getServices()
      } catch (reason) {
        failures.push(reason instanceof Error
          ? `Não foi possível carregar os títulos dos serviços: ${reason.message}`
          : 'Não foi possível carregar os títulos dos serviços.')
      }
      if (!active) return

      const negotiationPostIds = new Set(postIds)
      for (const service of services) {
        const title = service.title.trim()
        if (
          negotiationPostIds.has(service.postId) &&
          title &&
          title.toLocaleLowerCase('pt-BR') !== 'título indisponível'
        ) {
          titles.set(service.postId, title)
        }
      }

      const missingPostIds = postIds.filter(postId => !titles.has(postId))
      const postResults = await Promise.allSettled(missingPostIds.map(postId => api.getJob(postId)))
      const unresolvedPostIds: number[] = []
      postResults.forEach((result, index) => {
        const postId = missingPostIds[index]
        if (result.status === 'fulfilled' && typeof result.value.title === 'string' && result.value.title.trim()) {
          titles.set(postId, result.value.title.trim())
        } else {
          unresolvedPostIds.push(postId)
        }
      })

      if (unresolvedPostIds.length) {
        failures.push(`Não foi possível encontrar o título dos posts ${unresolvedPostIds.map(id => `#${id}`).join(', ')}.`)
      }
      if (!active) return
      setPostTitles(titles)
      setPostTitlesLoaded(true)
      setPostTitleError(failures.join(' '))
    }

    void loadTitles()
    return () => { active = false }
  }, [postIdsKey, titleRefreshCount])

  useEffect(() => {
    if (initialNegotiationId === null) return
    setSelectedNegotiationId(initialNegotiationId)
    onInitialNegotiationOpened()
  }, [initialNegotiationId, onInitialNegotiationOpened])

  useEffect(() => {
    if (!initialError) return
    setDisplayedInitialError(initialError)
    onInitialErrorShown()
  }, [initialError, onInitialErrorShown])

  const refresh = useCallback(() => loadInbox(), [loadInbox])
  const visibleInitialError = displayedInitialError || initialError
  const selectedNegotiation = negotiations?.find(item => item.id === selectedNegotiationId)
  if (selectedNegotiationId !== null) {
    if (!selectedNegotiation) return <>
      <header className="mb-5 flex items-start justify-between border-b border-current/15 pb-4">
        <div><h1 className="text-[18px] font-extrabold">Negociação</h1><p className="mt-1 text-[11px] opacity-65">Carregando...</p></div>
        <button onClick={() => setSelectedNegotiationId(null)} className="text-[11px] font-bold text-[#087a39]">Voltar</button>
      </header>
      {visibleInitialError && <p role="alert" className="mb-3 flex items-start justify-between gap-2 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">
        <span>{visibleInitialError}</span>
        <button onClick={() => setDisplayedInitialError('')} aria-label="Dispensar erro" className="font-bold">×</button>
      </p>}
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
      {loading && <Skeleton className="h-20 rounded-2xl" />}
    </>
    return <>
      {initialError && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{initialError}</p>}
      {postTitleError && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">
        {postTitleError}{' '}
        <button onClick={() => setTitleRefreshCount(count => count + 1)} className="font-bold underline">Tentar novamente</button>
      </p>}
      <NegotiationChatScreen
        key={selectedNegotiation.id}
        negotiation={selectedNegotiation}
        postTitle={postTitles.get(selectedNegotiation.postId) || (postTitlesLoaded ? `Post #${selectedNegotiation.postId}` : 'Carregando post...')}
        role={role}
        onBack={() => setSelectedNegotiationId(null)}
        onUpdated={() => { void refresh() }}
      />
    </>
  }

  return <>
    <header className="mb-5 border-b border-current/15 pb-4">
      <h1 className="text-[18px] font-extrabold">Mensagens</h1>
      <p className="mt-1 text-[11px] opacity-65">Negociações e conversas sobre posts</p>
    </header>
    {(error || visibleInitialError) && <div role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">
      <div className="flex items-start justify-between gap-2">
        <span>{error || visibleInitialError}</span>
        {visibleInitialError && <button onClick={() => setDisplayedInitialError('')} aria-label="Dispensar erro" className="font-bold">×</button>}
      </div>
      <button onClick={() => { void loadInbox(true) }} className="ml-2 font-bold">Tentar novamente</button>
    </div>}
    {postTitleError && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">
      {postTitleError}{' '}
      <button onClick={() => setTitleRefreshCount(count => count + 1)} className="font-bold underline">Tentar novamente</button>
    </p>}
    {loading && negotiations === null
      ? <Skeleton className="h-20 rounded-2xl" />
      : negotiations?.length
        ? <div className="space-y-1">
          {negotiations.map(negotiation => {
            const unread = unreadCounts[negotiation.id] || 0
            const title = postTitles.get(negotiation.postId) || (postTitlesLoaded ? `Post #${negotiation.postId}` : 'Carregando post...')
            return <button
              key={negotiation.id}
              onClick={() => setSelectedNegotiationId(negotiation.id)}
              className="flex w-full items-center gap-3 border-b border-current/10 py-4 text-left"
            >
              <Avatar name={role === 'cliente' ? 'Prestador' : 'Cliente'} />
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[13px]">{title}</strong>
                <small className="block text-[9px] opacity-60">
                  {negotiation.isMessageActive ? 'Chat aberto' : 'Aguardando resposta'} · Negociação #{negotiation.id}
                </small>
              </div>
              {unread > 0 && <span aria-label={`${unread} mensagens não lidas`} className="rounded-full bg-[#087a39] px-2 py-1 text-[9px] font-bold text-white">{unread}</span>}
            </button>
          })}
        </div>
        : <p className="rounded-xl border border-dashed border-current/20 p-5 text-center text-[10px] opacity-60">Nenhuma negociação iniciada.</p>}
  </>
}
