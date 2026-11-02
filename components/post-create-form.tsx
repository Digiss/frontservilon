'use client'

import { useEffect, useMemo, useState } from 'react'
import { api, type CreatePostCommand, type Job, type Role, type Sector, type ServiceType } from '@/lib/api'

type Props = {
  role: Role
  onCancel: () => void
  onCreated: (job: Job) => void
}

type FormState = Omit<CreatePostCommand, 'MinimumPrice' | 'MaximumPrice' | 'SectorId' | 'ServiceTypeId' | 'DeliveryDays'> & {
  MinimumPrice: string
  MaximumPrice: string
  DeliveryDays: string
  SectorId: string
  ServiceTypeId: string
}

const emptyForm: FormState = {
  Title: '',
  Description: '',
  MinimumPrice: '',
  MaximumPrice: '',
  DeliveryDays: '',
  SectorId: '',
  ServiceTypeId: '',
}

export function PostCreateForm({ role, onCancel, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [sectors, setSectors] = useState<Sector[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const provider = role === 'prestador'

  const loadCatalog = async () => {
    setLoadingCatalog(true)
    setCatalogError('')
    try {
      const [loadedSectors, loadedServiceTypes] = await Promise.all([
        api.getSectors(),
        api.getServiceTypes(),
      ])
      setSectors(loadedSectors.slice().sort((first, second) => first.id - second.id))
      setServiceTypes(loadedServiceTypes.slice().sort((first, second) => first.id - second.id))
    } catch (reason) {
      setCatalogError(reason instanceof Error ? reason.message : 'Não foi possível carregar setores e tipos de serviço.')
    } finally {
      setLoadingCatalog(false)
    }
  }

  useEffect(() => { void loadCatalog() }, [])

  const availableServiceTypes = useMemo(
    () => serviceTypes.filter(serviceType => serviceType.sectorId === Number(form.SectorId)),
    [serviceTypes, form.SectorId],
  )

  const update = (key: keyof FormState, value: string) => {
    setForm(current => ({ ...current, [key]: value }))
    setError('')
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const minimumPrice = Number(form.MinimumPrice)
    const maximumPrice = Number(form.MaximumPrice)
    const deliveryDays = Number(form.DeliveryDays)
    const sectorId = Number(form.SectorId)
    const serviceTypeId = Number(form.ServiceTypeId)
    const invalidPrice = (value: number) =>
      !Number.isFinite(value) || value <= 0 || value > 99999999.99 ||
      Math.abs(value * 100 - Math.round(value * 100)) > 0.000001
    if (invalidPrice(minimumPrice) || invalidPrice(maximumPrice) || maximumPrice <= minimumPrice ||
      !Number.isInteger(deliveryDays) || deliveryDays < 1 ||
      !Number.isInteger(sectorId) || sectorId < 1 ||
      !Number.isInteger(serviceTypeId) || serviceTypeId < 1 ||
      !sectors.some(sector => sector.id === sectorId) ||
      !serviceTypes.some(serviceType => serviceType.id === serviceTypeId && serviceType.sectorId === sectorId)) {
      setError('Informe uma faixa válida (o valor máximo deve superar o mínimo), um prazo em dias inteiro e selecione um setor e tipo de serviço disponíveis.')
      return
    }

    setSaving(true)
    try {
      const payload: CreatePostCommand = {
        Title: form.Title.trim(),
        Description: form.Description.trim(),
        MinimumPrice: minimumPrice,
        MaximumPrice: maximumPrice,
        DeliveryDays: deliveryDays,
        SectorId: sectorId,
        ServiceTypeId: serviceTypeId,
      }
      onCreated(await api.createJob(payload))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível publicar o post.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'mt-1 w-full rounded-xl border border-current/15 bg-transparent px-3 py-3 text-[11px] outline-none focus:border-[#35d878]'

  return <>
    <Header
      title={provider ? 'Criar serviço' : 'Criar trabalho'}
      subtitle={provider ? 'Publique uma oferta no seu perfil' : 'Descreva o trabalho que deseja contratar'}
      onCancel={onCancel}
    />
    <form onSubmit={event => { void submit(event) }} className="space-y-3">
      <label className="block text-[10px] font-bold">
        Título
        <input required maxLength={150} value={form.Title} onChange={event => update('Title', event.target.value)} className={inputClass} />
      </label>
      <label className="block text-[10px] font-bold">
        Descrição
        <textarea required maxLength={2000} value={form.Description} onChange={event => update('Description', event.target.value)} className={`${inputClass} min-h-24`} />
      </label>
      <label className="block text-[10px] font-bold">
        {provider ? 'Preço mínimo (R$)' : 'Orçamento mínimo (R$)'}
        <input required type="number" min="0.01" max="99999999.99" step="0.01" value={form.MinimumPrice} onChange={event => update('MinimumPrice', event.target.value)} className={inputClass} />
      </label>
      <label className="block text-[10px] font-bold">
        {provider ? 'Preço máximo (R$)' : 'Orçamento máximo (R$)'}
        <input required type="number" min={Number(form.MinimumPrice) > 0 ? (Number(form.MinimumPrice) + 0.01).toFixed(2) : '0.02'} max="99999999.99" step="0.01" value={form.MaximumPrice} onChange={event => update('MaximumPrice', event.target.value)} className={inputClass} />
      </label>
      <label className="block text-[10px] font-bold">
        Prazo de entrega (dias)
        <input required type="number" min="1" step="1" value={form.DeliveryDays} onChange={event => update('DeliveryDays', event.target.value.replace(/\D/g, ''))} className={inputClass} />
      </label>
      <div className="space-y-3">
        <label className="block text-[10px] font-bold">
          Setor
          <select
            required
            value={form.SectorId}
            disabled={loadingCatalog || Boolean(catalogError)}
            onChange={event => setForm(current => ({ ...current, SectorId: event.target.value, ServiceTypeId: '' }))}
            className={inputClass}
          >
            <option value="">{loadingCatalog ? 'Carregando setores...' : 'Selecione um setor'}</option>
            {sectors.map(sector => <option key={sector.id} value={sector.id}>{sector.name}</option>)}
          </select>
        </label>
        <label className="block text-[10px] font-bold">
          Tipo de serviço
          <select
            required
            value={form.ServiceTypeId}
            disabled={!form.SectorId || loadingCatalog || Boolean(catalogError) || availableServiceTypes.length === 0}
            onChange={event => update('ServiceTypeId', event.target.value)}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <option value="">{!form.SectorId ? 'Selecione um setor primeiro' : availableServiceTypes.length ? 'Selecione um tipo de serviço' : 'Nenhum tipo disponível'}</option>
            {availableServiceTypes.map(serviceType => <option key={serviceType.id} value={serviceType.id}>{serviceType.name}</option>)}
          </select>
        </label>
      </div>
      {catalogError && <div role="alert" className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600"><p>{catalogError}</p><button type="button" onClick={() => { void loadCatalog() }} className="mt-2 font-bold underline">Tentar carregar novamente</button></div>}
      {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-600">{error}</p>}
      <button type="submit" disabled={saving || loadingCatalog || Boolean(catalogError)} className="w-full rounded-xl bg-[#35d878] px-4 py-3 text-[11px] font-extrabold text-black disabled:opacity-50">
        {saving ? 'Publicando...' : provider ? 'Publicar serviço' : 'Publicar trabalho'}
      </button>
    </form>
  </>
}

function Header({ title, subtitle, onCancel }: { title: string; subtitle: string; onCancel: () => void }) {
  return <header className="mb-5 flex items-start justify-between border-b border-current/15 pb-4">
    <div><h1 className="text-[18px] font-extrabold tracking-tight">{title}</h1><p className="mt-1 text-[11px] opacity-65">{subtitle}</p></div>
    <button onClick={onCancel} className="text-[11px] font-bold text-[#35d878]">Cancelar</button>
  </header>
}
