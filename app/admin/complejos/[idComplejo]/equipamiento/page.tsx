'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Navbar from '@/src/components/Navbar'
import Footer from '@/src/components/Footer'
import { ChevronLeft, Plus, Pencil, Trash2, Package } from 'lucide-react'

type Equipamiento = {
  idEquipamiento: number
  nombre: string
  precio: number
  stock: number
  stockDisponible: number
  idComplejo: number
}

type FormData = { nombre: string; precio: string; stock: string }
type FormErrors = Partial<FormData>

export default function PaginaEquipamientoAdmin() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const rawParams = useParams()
  const idComplejoStr = Array.isArray(rawParams.idComplejo)
    ? rawParams.idComplejo[0]
    : rawParams.idComplejo ?? ''
  const idComplejo = parseInt(idComplejoStr)

  const [equipamientos, setEquipamientos] = useState<Equipamiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [nombreComplejo, setNombreComplejo] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Equipamiento | null>(null)
  const [form, setForm] = useState<FormData>({ nombre: '', precio: '', stock: '' })
  const [erroresForm, setErroresForm] = useState<FormErrors>({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  const [confirmEliminar, setConfirmEliminar] = useState<Equipamiento | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  // Verificación de rol
  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.replace('/sign-in'); return }
    const rolRaw = (user.publicMetadata as { rol?: string | string[] }).rol
    const rol = Array.isArray(rolRaw) ? rolRaw[0] : rolRaw
    if (rol !== 'admin') router.replace('/')
  }, [isLoaded, user, router])

  const cargarDatos = useCallback(async () => {
    if (isNaN(idComplejo)) return
    setCargando(true)
    setErrorCarga(null)
    try {
      const [resComplejo, resEquip] = await Promise.all([
        fetch(`/api/v1/complejos/${idComplejo}`),
        fetch(`/api/v1/complejos/${idComplejo}/equipamiento`),
      ])
      if (resComplejo.ok) {
        const c = await resComplejo.json()
        setNombreComplejo(c.nombre ?? '')
      }
      if (!resEquip.ok) throw new Error('Error al cargar el equipamiento')
      setEquipamientos(await resEquip.json() as Equipamiento[])
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }, [idComplejo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isLoaded && user) cargarDatos()
  }, [isLoaded, user, cargarDatos])

  function abrirCrear() {
    setEditando(null)
    setForm({ nombre: '', precio: '', stock: '' })
    setErroresForm({})
    setErrorGuardado(null)
    setModalAbierto(true)
  }

  function abrirEditar(e: Equipamiento) {
    setEditando(e)
    setForm({ nombre: e.nombre, precio: String(e.precio), stock: String(e.stock) })
    setErroresForm({})
    setErrorGuardado(null)
    setModalAbierto(true)
  }

  function validarForm(): boolean {
    const errs: FormErrors = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido'
    const precio = Number(form.precio)
    if (form.precio === '' || isNaN(precio) || precio < 0) errs.precio = 'Ingresá un precio válido (>= 0)'
    const stock = Number(form.stock)
    if (form.stock === '' || !Number.isInteger(stock) || stock < 0) errs.stock = 'Ingresá un stock válido (entero >= 0)'
    setErroresForm(errs)
    return Object.keys(errs).length === 0
  }

  async function guardar() {
    if (!validarForm()) return
    setGuardando(true)
    setErrorGuardado(null)
    try {
      const body = { nombre: form.nombre.trim(), precio: Number(form.precio), stock: Number(form.stock) }
      const res = editando
        ? await fetch(`/api/v1/equipamiento/${editando.idEquipamiento}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })
        : await fetch(`/api/v1/complejos/${idComplejo}/equipamiento`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? 'Error al guardar')
      }
      setModalAbierto(false)
      cargarDatos()
    } catch (e) {
      setErrorGuardado(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(e: Equipamiento) {
    setEliminando(true)
    setErrorEliminar(null)
    try {
      const res = await fetch(`/api/v1/equipamiento/${e.idEquipamiento}`, { method: 'DELETE' })
      if (res.status === 204) {
        setConfirmEliminar(null)
        setEquipamientos((prev) => prev.filter((x) => x.idEquipamiento !== e.idEquipamiento))
      } else {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? 'Error al eliminar')
      }
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F4F8F3]">
        <div className="max-w-4xl mx-auto px-4 py-12">

          <Link
            href="/admin/complejos"
            className="inline-flex items-center gap-1.5 text-sm text-[#3B4F38] hover:text-[#061F03] mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Mis complejos
          </Link>

          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-[#7FB584] uppercase tracking-wider mb-0.5">
                {nombreComplejo || `Complejo #${idComplejo}`}
              </p>
              <h1 className="text-3xl font-bold text-[#061F03]">Inventario de equipamiento</h1>
            </div>
            <button
              onClick={abrirCrear}
              className="flex items-center gap-2 bg-[#3B4F38] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#061F03] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar artículo
            </button>
          </div>

          {cargando && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
            </div>
          )}

          {!cargando && errorCarga && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-4">
              <span>{errorCarga}</span>
              <button onClick={cargarDatos} className="underline text-sm shrink-0">Reintentar</button>
            </div>
          )}

          {!cargando && !errorCarga && equipamientos.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-12 text-center">
              <Package className="w-14 h-14 text-[#ACC2AB] mx-auto mb-4" />
              <p className="text-[#061F03] font-semibold mb-1">Sin equipamiento registrado</p>
              <p className="text-[#3B4F38] text-sm">Agregá artículos para que los clientes puedan solicitarlos.</p>
            </div>
          )}

          {!cargando && !errorCarga && equipamientos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {equipamientos.map((e) => (
                <div key={e.idEquipamiento} className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[#061F03]">{e.nombre}</h3>
                    <span className="shrink-0 text-lg font-semibold text-[#3B4F38]">${e.precio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#3B4F38]">
                    <span>Stock total: <strong>{e.stock}</strong></span>
                    <span>
                      Disponible:{' '}
                      <strong className={e.stockDisponible === 0 ? 'text-red-600' : 'text-[#3B4F38]'}>
                        {e.stockDisponible}
                      </strong>
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => abrirEditar(e)}
                      className="flex items-center gap-1.5 text-sm text-[#3B4F38] border border-[#ACC2AB]/50 rounded-lg px-3 py-1.5 hover:bg-[#F4F8F3] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => { setErrorEliminar(null); setConfirmEliminar(e) }}
                      className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-[#061F03] text-lg mb-5">
              {editando ? 'Editar artículo' : 'Nuevo artículo'}
            </h2>
            <div className="flex flex-col gap-4">
              <Campo label="Nombre" error={erroresForm.nombre}>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="ej. Pelota de Fútbol N°5"
                  className={inputClass(!!erroresForm.nombre)}
                />
              </Campo>
              <Campo label="Precio (alquiler)" error={erroresForm.precio}>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  placeholder="0.00"
                  className={inputClass(!!erroresForm.precio)}
                />
              </Campo>
              <Campo label="Stock total" error={erroresForm.stock}>
                <input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  className={inputClass(!!erroresForm.stock)}
                />
              </Campo>
              {editando && (
                <p className="text-xs text-[#3B4F38]/60">
                  Al reducir el stock, se mantienen las unidades ya comprometidas en reservas activas.
                </p>
              )}
              {errorGuardado && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{errorGuardado}</p>
              )}
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 text-sm text-[#3B4F38] border border-[#ACC2AB]/50 rounded-xl py-2.5 hover:bg-[#F4F8F3] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="flex-1 bg-[#3B4F38] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#061F03] transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear artículo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-[#061F03] text-lg mb-2">Eliminar artículo</h2>
            <p className="text-[#3B4F38] text-sm mb-4">
              ¿Confirmás que querés eliminar <strong>{confirmEliminar.nombre}</strong>?
            </p>
            {errorEliminar && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">{errorEliminar}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                className="flex-1 text-sm text-[#3B4F38] border border-[#ACC2AB]/50 rounded-xl py-2.5 hover:bg-[#F4F8F3] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminar(confirmEliminar)}
                disabled={eliminando}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

function inputClass(error: boolean) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] ${
    error ? 'border-red-400' : 'border-[#ACC2AB]/50'
  }`
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
