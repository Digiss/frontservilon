'use client'

import { useEffect, useState } from 'react'
import { api, type ServiceReview } from '@/lib/api'

export function ReviewScreen({
  serviceId,
  providerName,
  onBack,
  onSubmitted,
}: {
  serviceId: number
  providerName: string
  onBack: () => void
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [existingReview, setExistingReview] = useState<ServiceReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.getServiceReviews(serviceId)
      .then(reviews => {
        if (active) setExistingReview(reviews[0] || null)
      })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível consultar a avaliação.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [serviceId])

  const submit = async () => {
    if (!rating || submitting || existingReview) {
      if (!rating) setError('Selecione uma nota de 1 a 5 estrelas.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.submitReview(serviceId, rating, comment)
      setSent(true)
      onSubmitted()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="rounded-2xl border border-black/10 bg-[#effbf2] p-5 text-center text-black">
    <button onClick={onBack} className="mb-5 block text-left text-[11px] font-bold text-[#087a39]">← Voltar</button>
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b9e5c8] text-[22px] font-bold text-[#087a39]">
      {providerName.split(' ').map(part => part[0]).join('').slice(0, 2)}
    </div>
    <h2 className="mt-3 text-[15px] font-extrabold">{providerName}</h2>
    <p className="mt-1 text-[10px] opacity-60">Serviço #{serviceId}</p>
    <p className="mt-5 text-[14px] font-bold">Deixe uma avaliação</p>
    {loading
      ? <p className="mt-4 text-[11px] opacity-65">Verificando avaliações existentes...</p>
      : existingReview
        ? <div className="mt-4 rounded-xl bg-black/5 p-3">
          <strong className="text-[#087a39]">{'★'.repeat(existingReview.note)}</strong>
          {existingReview.about && <p className="mt-2 text-[11px]">{existingReview.about}</p>}
          <p className="mt-2 text-[10px] opacity-65">Este serviço já foi avaliado.</p>
        </div>
        : <>
          <div className="mt-3 flex justify-center gap-1" aria-label="Escolha uma nota de 1 a 5">
            {[1, 2, 3, 4, 5].map(value => <button
              key={value}
              type="button"
              onClick={() => { setRating(value); setError('') }}
              aria-label={`${value} estrelas`}
              aria-pressed={value === rating}
              className={`text-3xl ${value <= rating ? 'text-[#f2b84b]' : 'text-black/20'}`}
            >★</button>)}
          </div>
          <textarea
            value={comment}
            onChange={event => setComment(event.target.value)}
            maxLength={500}
            placeholder="Comentário opcional"
            className="mt-5 min-h-24 w-full rounded-xl border border-black/10 bg-white p-3 text-[11px] outline-none"
          />
        </>}
    {error && <p role="alert" className="mt-3 text-[11px] text-red-600">{error}</p>}
    {sent && <p role="status" className="mt-3 text-[11px] font-bold text-[#087a39]">Avaliação enviada com sucesso.</p>}
    {!loading && !existingReview && !sent && <button
      disabled={!rating || submitting}
      onClick={() => { void submit() }}
      className="mt-4 w-full rounded-xl bg-[#087a39] px-4 py-3 text-[11px] font-bold text-white disabled:opacity-40"
    >{submitting ? 'Enviando...' : 'Enviar avaliação'}</button>}
  </section>
}
