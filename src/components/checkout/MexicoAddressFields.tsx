'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { matchColonia, type PostalCodeResult } from '@/lib/mexico-postal'

type AddressSlice = {
  zip: string
  colonia: string
  municipio: string
  state: string
}

type Props = {
  value: AddressSlice
  onChange: (patch: Partial<AddressSlice>) => void
}

const inputClass =
  'w-full bg-zinc-800 text-white rounded-lg px-4 py-2.5 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm'
const readOnlyClass =
  'w-full bg-zinc-900 text-zinc-300 rounded-lg px-4 py-2.5 border border-zinc-800 text-sm cursor-not-allowed'
const autofillClass = 'ce-address-autofill'

export default function MexicoAddressFields({ value, onChange }: Props) {
  const coloniaListId = useId()
  const [lookup, setLookup] = useState<PostalCodeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [manual, setManual] = useState(false)
  const lastFetchedCp = useRef('')
  const zipRef = useRef<HTMLInputElement>(null)
  const coloniaRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  valueRef.current = value
  onChangeRef.current = onChange

  useEffect(() => {
    const syncAutofill = () => {
      const zipEl = zipRef.current
      const coloniaEl = coloniaRef.current
      const current = valueRef.current

      if (zipEl) {
        const digits = zipEl.value.replace(/\D/g, '').slice(0, 5)
        if (digits && digits !== current.zip) {
          onChangeRef.current({ zip: digits })
        }
      }

      if (coloniaEl) {
        const colonia = coloniaEl.value.trim()
        if (colonia && colonia !== current.colonia) {
          onChangeRef.current({ colonia })
        }
      }
    }

    const onAnimation = (event: AnimationEvent) => {
      if (event.animationName === 'ce-onAutoFillStart') syncAutofill()
    }

    document.addEventListener('animationstart', onAnimation)
    const t1 = window.setTimeout(syncAutofill, 100)
    const t2 = window.setTimeout(syncAutofill, 600)

    return () => {
      document.removeEventListener('animationstart', onAnimation)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    const cp = value.zip.replace(/\D/g, '')
    if (cp.length !== 5) {
      setLookup(null)
      setLookupError('')
      lastFetchedCp.current = ''
      return
    }
    if (cp === lastFetchedCp.current) return

    const timer = setTimeout(() => { void fetchPostalCode(cp) }, 400)
    return () => clearTimeout(timer)
  }, [value.zip])

  useEffect(() => {
    if (!lookup || manual || !value.colonia.trim()) return
    const match = matchColonia(lookup.asentamientos, value.colonia)
    if (match && match.nombre !== value.colonia) {
      onChange({ colonia: match.nombre })
    }
  }, [lookup, manual, onChange, value.colonia])

  async function fetchPostalCode(cp: string) {
    setLoading(true)
    setLookupError('')
    try {
      const res = await fetch(`/api/postal-code?cp=${cp}`)
      const data = await res.json()
      if (!res.ok) {
        setLookup(null)
        setManual(true)
        setLookupError(data.error ?? 'No se encontró el código postal.')
        lastFetchedCp.current = cp
        return
      }

      const result = data as PostalCodeResult
      setLookup(result)
      lastFetchedCp.current = cp

      const patch: Partial<AddressSlice> = {
        municipio: result.municipio,
        state: result.estado,
      }

      const match = value.colonia.trim()
        ? matchColonia(result.asentamientos, value.colonia)
        : null

      if (match) {
        patch.colonia = match.nombre
        setManual(false)
      } else if (result.asentamientos.length === 1) {
        patch.colonia = result.asentamientos[0].nombre
        setManual(false)
      } else if (value.colonia.trim()) {
        // Autocompletado o texto previo que no coincide exacto — conservar valor
        setManual(true)
      } else {
        setManual(false)
      }

      onChange(patch)
    } catch {
      setLookup(null)
      setManual(true)
      setLookupError('Error de conexión. Escribe la colonia manualmente.')
      lastFetchedCp.current = cp
    } finally {
      setLoading(false)
    }
  }

  const handleZipChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 5)
    if (digits !== value.zip) {
      lastFetchedCp.current = ''
      if (digits.length < 5) {
        setLookup(null)
        setLookupError('')
      }
    }
    onChange({ zip: digits })
  }

  const handleColoniaChange = (raw: string) => {
    onChange({ colonia: raw })
    if (!lookup || manual) return
    const match = matchColonia(lookup.asentamientos, raw)
    if (match) onChange({ colonia: match.nombre })
  }

  const useLookup = Boolean(lookup) && !manual

  return (
    <>
      <div>
        <label className="block text-zinc-400 text-sm mb-1">Código postal</label>
        <input
          ref={zipRef}
          type="text"
          name="zip"
          value={value.zip}
          onChange={(e) => handleZipChange(e.target.value)}
          onInput={(e) => handleZipChange(e.currentTarget.value)}
          required
          placeholder="Ej. 55748"
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
          className={`${inputClass} ${autofillClass}`}
        />
        {loading && <p className="text-zinc-500 text-xs mt-1">Buscando colonias...</p>}
        {lookupError && <p className="text-amber-400 text-xs mt-1">{lookupError}</p>}
        {useLookup && (
          <p className="text-wix-gold/80 text-xs mt-1">
            {lookup!.asentamientos.length} colonia(s) encontrada(s)
          </p>
        )}
      </div>

      <div>
        <label className="block text-zinc-400 text-sm mb-1">Colonia</label>
        {useLookup ? (
          <div className="space-y-2">
            <input
              ref={coloniaRef}
              type="text"
              name="colonia"
              list={coloniaListId}
              value={value.colonia}
              onChange={(e) => handleColoniaChange(e.target.value)}
              onInput={(e) => handleColoniaChange(e.currentTarget.value)}
              onBlur={(e) => handleColoniaChange(e.currentTarget.value)}
              required
              placeholder="Escribe o elige tu colonia"
              autoComplete="address-level3"
              className={`${inputClass} ${autofillClass}`}
            />
            <datalist id={coloniaListId}>
              {lookup!.asentamientos.map((a, i) => (
                <option
                  key={`${a.nombre}-${a.tipo}-${i}`}
                  value={a.nombre}
                  label={a.tipo ? `${a.nombre} (${a.tipo})` : a.nombre}
                />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => setManual(true)}
              className="text-zinc-500 hover:text-zinc-300 text-xs underline"
            >
              Escribir colonia manualmente
            </button>
          </div>
        ) : (
          <input
            ref={coloniaRef}
            type="text"
            name="colonia"
            value={value.colonia}
            onChange={(e) => onChange({ colonia: e.target.value })}
            onInput={(e) => onChange({ colonia: e.currentTarget.value })}
            required
            placeholder={value.zip.length === 5 ? 'Ej. Del Valle' : 'Primero ingresa el C.P.'}
            autoComplete="address-level3"
            className={`${inputClass} ${autofillClass}`}
          />
        )}
      </div>

      <div>
        <label className="block text-zinc-400 text-sm mb-1">Municipio / Alcaldía</label>
        {useLookup ? (
          <input
            type="text"
            name="municipio"
            value={value.municipio}
            readOnly
            autoComplete="address-level2"
            className={readOnlyClass}
          />
        ) : (
          <input
            type="text"
            name="municipio"
            value={value.municipio}
            onChange={(e) => onChange({ municipio: e.target.value })}
            onInput={(e) => onChange({ municipio: e.currentTarget.value })}
            required
            placeholder="Ej. Benito Juárez"
            autoComplete="address-level2"
            className={`${inputClass} ${autofillClass}`}
          />
        )}
      </div>

      <div>
        <label className="block text-zinc-400 text-sm mb-1">Estado</label>
        {useLookup ? (
          <input
            type="text"
            name="state"
            value={value.state}
            readOnly
            autoComplete="address-level1"
            className={readOnlyClass}
          />
        ) : (
          <input
            type="text"
            name="state"
            value={value.state}
            onChange={(e) => onChange({ state: e.target.value })}
            onInput={(e) => onChange({ state: e.currentTarget.value })}
            required
            placeholder="Ej. Ciudad de México"
            autoComplete="address-level1"
            className={`${inputClass} ${autofillClass}`}
          />
        )}
      </div>

      {manual && lookup && (
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => {
              setManual(false)
              if (value.colonia.trim()) {
                const match = matchColonia(lookup.asentamientos, value.colonia)
                if (match) onChange({ colonia: match.nombre })
              }
            }}
            className="text-accent hover:underline text-xs"
          >
            Volver a elegir colonia del catálogo
          </button>
        </div>
      )}
    </>
  )
}
