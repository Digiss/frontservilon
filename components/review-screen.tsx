'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export function ReviewScreen({ jobId, providerId, providerName, onBack }: { jobId: number; providerId: number; providerName: string; onBack: () => void }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const submit = async () => {
    // O backend continua validando a nota enviada.
    // if (!rating) return
    try {
      await api.submitReview({ jobId, providerId, clientId: '', rating, comment })
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a avaliação.')
    }
  }
  return <section className="rounded-2xl border border-black/10 bg-[#effbf2] p-5 text-center text-black"><button onClick={onBack} className="mb-5 block text-left text-[11px] font-bold text-[#087a39]">← Voltar</button><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b9e5c8] text-[22px] font-bold text-[#087a39]">{providerName.split(' ').map(part => part[0]).join('').slice(0, 2)}</div><h2 className="mt-3 text-[15px] font-extrabold">{providerName}</h2><p className="mt-5 text-[14px] font-bold">Deixe uma avaliação</p><div className="mt-3 flex justify-center gap-1" aria-label="Escolha uma nota de 1 a 5">{[1,2,3,4,5].map(value => <button key={value} onClick={() => setRating(value)} aria-label={`${value} estrelas`} className={`text-3xl ${value <= rating ? 'text-[#f2b84b]' : 'text-black/20'}`}>★</button>)}</div><textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="Comentário opcional" className="mt-5 min-h-24 w-full rounded-xl border border-black/10 bg-white p-3 text-[11px] outline-none" />{error && <p className="mt-3 text-[11px] text-red-600">{error}</p>}{sent ? <p className="mt-3 text-[11px] font-bold text-[#087a39]">Avaliação enviada com sucesso.</p> : <button onClick={submit} /* disabled={!rating} */ className="mt-4 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white disabled:opacity-40">Enviar avaliação</button>}</section>
}
