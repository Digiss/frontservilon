'use client'

import { useState } from 'react'
import type { Job, Role } from '@/lib/api'
import { formatPostPriceRange } from '@/lib/post-mapper'

export function PostDetailsScreen({ post, role, onBack, onStartNegotiation, onViewProvider }: {
  post: Job
  role: Role
  onBack: () => void
  onStartNegotiation: (post: Job, message: string) => Promise<void>
  onViewProvider: (providerId: number) => Promise<void>
}) {
  const [starting, setStarting] = useState(false)
  const [openingProvider, setOpeningProvider] = useState(false)
  const [introductoryMessage, setIntroductoryMessage] = useState('')
  const [error, setError] = useState('')
  const [providerError, setProviderError] = useState('')
  const dark = role === 'prestador'
  const shell = dark ? 'border-white/10 bg-[#111827] text-white' : 'border-[#a8cdb4] bg-[#effbf2] text-black'
  const muted = dark ? 'text-white/60' : 'text-black/60'
  const deadline = post.dueDate || post.duration || 'Não informado'
  const openProvider = () => {
    if (post.providerId === undefined) return
    setOpeningProvider(true)
    setProviderError('')
    void onViewProvider(post.providerId)
      .catch(reason => setProviderError(reason instanceof Error ? reason.message : 'Não foi possível carregar o perfil do prestador.'))
      .finally(() => setOpeningProvider(false))
  }

  return <section>
    <header className="mb-5 flex items-start justify-between border-b border-current/15 pb-4">
      <div><h1 className="text-[18px] font-extrabold tracking-tight">Detalhes do post</h1><p className="mt-1 text-[11px] opacity-65">{post.category || `Setor ${post.sectorId ?? 'não informado'}`} · {post.subSector || `Tipo ${post.serviceTypeId ?? 'não informado'}`}</p></div>
      <button onClick={onBack} className="text-[11px] font-bold text-[#087a39]">Voltar</button>
    </header>
    <article className={`rounded-2xl border p-4 ${shell}`}>
      <span className="rounded-full bg-[#123f2c] px-2 py-1 text-[9px] font-bold text-[#35d878]">Não atribuído</span>
      <h2 className="mt-3 text-[17px] font-bold">{post.title}</h2>
      <p className={`mt-4 whitespace-pre-wrap text-[11px] leading-relaxed ${muted}`}>{post.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-current/5 p-3"><span className={`block text-[9px] ${muted}`}>{post.providerId ? 'Faixa de preço' : 'Faixa de orçamento'}</span><strong className="mt-1 block text-[12px]">{formatPostPriceRange(post.salaryMin, post.salaryMax)}</strong></div>
        <div className="rounded-xl bg-current/5 p-3"><span className={`block text-[9px] ${muted}`}>Prazo de entrega</span><strong className="mt-1 block text-[12px]">{deadline}</strong></div>
      </div>
      <p className={`mt-4 rounded-xl bg-current/5 p-3 text-[10px] ${muted}`}>
        Envie uma mensagem introdutória para iniciar uma negociação sobre este post.
      </p>
      <label className="mt-3 block text-[10px] font-bold">
        Mensagem introdutória
        <textarea
          value={introductoryMessage}
          onChange={event => setIntroductoryMessage(event.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Escreva uma mensagem para iniciar a conversa."
          className="mt-2 w-full resize-y rounded-xl border border-current/15 bg-transparent px-3 py-3 text-[11px] font-normal outline-none"
        />
      </label>
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
      {providerError && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{providerError}</p>}
      <div className={`mt-3 grid gap-2 ${role === 'cliente' && post.providerId !== undefined ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button
          disabled={starting || !introductoryMessage.trim()}
          onClick={() => {
            setStarting(true)
            setError('')
            void onStartNegotiation(post, introductoryMessage.trim())
              .catch(reason => setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a mensagem introdutória.'))
              .finally(() => setStarting(false))
          }}
          className="rounded-xl bg-[#35d878] px-4 py-3 text-[11px] font-extrabold text-black disabled:opacity-50"
        >
          {starting ? 'Iniciando negociação...' : 'Enviar mensagem'}
        </button>
        {role === 'cliente' && post.providerId !== undefined && <button
          disabled={openingProvider}
          onClick={openProvider}
          className="rounded-xl border border-[#087a39]/30 px-3 py-3 text-[11px] font-bold text-[#087a39] disabled:opacity-50"
        >
          {openingProvider ? 'Abrindo perfil...' : 'Ver perfil do prestador'}
        </button>}
      </div>
    </article>
  </section>
}
