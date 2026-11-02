'use client'

import { useEffect, useState } from 'react'
import { api, type InterestArea, type ServiceType } from '@/lib/api'

export function InterestAreaPicker({
  selectedIds,
  onChange,
  disabled = false,
}: {
  selectedIds: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
}) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[] | null>(null)
  const [error, setError] = useState('')

  const loadServiceTypes = async () => {
    setError('')
    try {
      setServiceTypes(await api.getServiceTypes())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os tipos de serviço.')
    }
  }

  useEffect(() => { void loadServiceTypes() }, [])

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id))
    } else if (selectedIds.length < 3) {
      onChange([...selectedIds, id])
    }
  }

  return <section aria-label="Áreas de interesse" className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold">Áreas de interesse *</span>
      <span className="text-[10px] opacity-60">{selectedIds.length}/3 selecionadas</span>
    </div>
    <p className="text-[10px] opacity-60">Escolha de 1 a 3 tipos de serviço para filtrar os trabalhos do seu feed.</p>
    {error
      ? <div role="alert" className="rounded-xl bg-red-500/10 p-3 text-[10px] text-red-600">
        {error}<button type="button" onClick={() => { void loadServiceTypes() }} className="ml-2 font-bold">Tentar novamente</button>
      </div>
      : serviceTypes === null
        ? <p className="rounded-xl bg-current/5 p-3 text-[10px] opacity-60">Carregando tipos de serviço...</p>
        : serviceTypes.length
          ? <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-current/10 p-2">
            {serviceTypes.map(serviceType => {
              const checked = selectedIds.includes(serviceType.id)
              return <label key={serviceType.id} className={`flex items-center gap-2 rounded-lg p-2 text-[10px] ${disabled || (!checked && selectedIds.length >= 3) ? 'opacity-50' : 'cursor-pointer hover:bg-current/5'}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled || (!checked && selectedIds.length >= 3)}
                  onChange={() => toggle(serviceType.id)}
                />
                <span>{serviceType.name}</span>
              </label>
            })}
          </div>
          : <p className="rounded-xl bg-current/5 p-3 text-[10px] opacity-60">Nenhum tipo de serviço foi cadastrado.</p>}
  </section>
}

export function InterestAreasSettings() {
  const [areas, setAreas] = useState<InterestArea[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadAreas = async () => {
    setError('')
    try {
      const loadedAreas = await api.getInterestAreas()
      setAreas(loadedAreas)
      setSelectedIds(loadedAreas.map(area => area.serviceTypeId))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar suas áreas de interesse.')
    }
  }

  useEffect(() => { void loadAreas() }, [])

  const save = async () => {
    if (selectedIds.length < 1 || selectedIds.length > 3 || !areas) {
      setError('Selecione de 1 a 3 áreas de interesse.')
      return
    }

    const currentIds = new Set(areas.map(area => area.serviceTypeId))
    const selected = new Set(selectedIds)
    const additions = selectedIds.filter(id => !currentIds.has(id))
    const removals = areas.filter(area => !selected.has(area.serviceTypeId))

    setSaving(true)
    setError('')
    setMessage('')
    try {
      for (const id of additions) await api.createInterestArea(id)
      for (const area of removals) await api.deleteInterestArea(area.id)
      const savedAreas = await api.getInterestAreas()
      setAreas(savedAreas)
      setSelectedIds(savedAreas.map(area => area.serviceTypeId))
      setMessage('Áreas de interesse atualizadas.')
    } catch (reason) {
      const saveError = reason instanceof Error ? reason.message : 'Não foi possível atualizar as áreas de interesse.'
      try {
        const latestAreas = await api.getInterestAreas()
        setAreas(latestAreas)
        setSelectedIds(latestAreas.map(area => area.serviceTypeId))
      } catch (reloadReason) {
        const reloadError = reloadReason instanceof Error ? reloadReason.message : 'Não foi possível recarregar as áreas.'
        setError(`${saveError} ${reloadError}`)
        setSaving(false)
        return
      }
      setError(`${saveError} As seleções foram recarregadas com o estado salvo no servidor.`)
    } finally {
      setSaving(false)
    }
  }

  return <section className="mt-5 border-t border-black/10 pt-4">
    <h3 className="text-[12px] font-bold">Áreas de interesse</h3>
    {areas === null && !error
      ? <p className="mt-3 text-[10px] opacity-60">Carregando áreas cadastradas...</p>
      : <div className="mt-3 space-y-3">
        {areas === null && error && <button type="button" onClick={() => { void loadAreas() }} className="text-[10px] font-bold text-[#087a39]">Tentar carregar novamente</button>}
        <InterestAreaPicker selectedIds={selectedIds} onChange={setSelectedIds} disabled={saving} />
        {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-[10px] text-red-600">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-green-500/10 p-3 text-[10px] text-green-700">{message}</p>}
        <button
          type="button"
          disabled={saving || areas === null || selectedIds.length < 1 || selectedIds.length > 3}
          onClick={() => { void save() }}
          className="w-full rounded-xl bg-[#087a39] p-3 text-[11px] font-bold text-white disabled:opacity-50"
        >
          {saving ? 'Salvando áreas...' : 'Salvar áreas de interesse'}
        </button>
      </div>}
  </section>
}

export function InterestAreasProfile() {
  const [names, setNames] = useState<string[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getInterestAreas(), api.getServiceTypes()])
      .then(([areas, serviceTypes]) => {
        const typeNames = new Map(serviceTypes.map(serviceType => [serviceType.id, serviceType.name]))
        setNames(areas.map(area => typeNames.get(area.serviceTypeId) || `Tipo ${area.serviceTypeId}`))
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar suas áreas de interesse.'))
  }, [])

  return <section className="mt-3 rounded-2xl border border-current/10 bg-current/5 p-4">
    <h2 className="text-[13px] font-bold">Áreas de interesse</h2>
    {error
      ? <p role="alert" className="mt-2 text-[10px] text-red-600">{error}</p>
      : names === null
        ? <p className="mt-2 text-[10px] opacity-60">Carregando...</p>
        : names.length
          ? <div className="mt-2 flex flex-wrap gap-2">{names.map(name =>
            <span key={name} className="rounded-full bg-[#123f2c] px-2.5 py-1 text-[10px] text-[#35d878]">{name}</span>,
          )}</div>
          : <p className="mt-2 text-[10px] opacity-60">Nenhuma área selecionada. Configure suas áreas para receber trabalhos no feed.</p>}
  </section>
}
