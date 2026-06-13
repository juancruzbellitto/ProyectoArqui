'use client'

import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/src/components/Navbar'
import Footer from '@/src/components/Footer'
import Estrellas from '@/src/components/Estrellas'
import {
  Clock,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Calendar,
  UserX,
  Package,
  Plus,
  X,
  Pencil,
  Trash2,
} from 'lucide-react'

type Cancha = {
  idCancha: number
  nombre: string
  deporte: string
  estadoOperativo: string
  horarioApertura: string
  horarioCierre: string
  duracionTurno: number
}

type Complejo = {
  id_complejo: number
  nombre: string
}

type Reserva = {
  idReserva: number
  fecha: string
  hora: string
  estado: string
  tipoPartido: string
  cuposDisponibles: number | null
  idCancha: number
  emailCliente: string
}

const ESTADOS_CANCHA = [
  { valor: 'disponible', etiqueta: 'Disponible' },
  { valor: 'ocupada', etiqueta: 'Ocupada' },
  { valor: 'en mantenimiento', etiqueta: 'En mantenimiento' },
]

const ESTADOS_RESERVA = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'pagada', etiqueta: 'Pagada' },
  { valor: 'cancelada', etiqueta: 'Cancelada' },
  { valor: 'ausente', etiqueta: 'Ausente' },
]

function clasesEstadoCancha(estado: string) {
  if (estado === 'disponible') return 'bg-[#D7E6D3] text-[#3B4F38]'
  if (estado === 'ocupada') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

function etiquetaEstadoCancha(estado: string) {
  return ESTADOS_CANCHA.find((e) => e.valor === estado)?.etiqueta ?? estado
}

function clasesEstadoReserva(estado: string) {
  if (estado === 'pagada') return 'bg-[#D7E6D3] text-[#3B4F38]'
  if (estado === 'pendiente') return 'bg-blue-50 text-blue-700'
  if (estado === 'cancelada') return 'bg-gray-100 text-gray-500'
  if (estado === 'ausente') return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-600'
}

function etiquetaEstadoReserva(estado: string) {
  return ESTADOS_RESERVA.find((e) => e.valor === estado)?.etiqueta ?? estado
}

function hoy(): string {
  return new Date().toISOString().substring(0, 10)
}

function horaEnMin(h: string): number {
  return parseInt(h.slice(0, 2)) * 60 + parseInt(h.slice(3, 5))
}

function minAHora(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function calcularSlots(apertura: string, cierre: string, duracion: number): string[] {
  const aperMin = horaEnMin(apertura)
  const cierMin = horaEnMin(cierre)
  const slots: string[] = []
  let t = aperMin
  while (t + duracion <= cierMin) {
    slots.push(minAHora(t))
    t += duracion
  }
  return slots
}

export default function PaginaAuxiliar() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const rawParams = useParams()
  const idComplejoStr = Array.isArray(rawParams.idComplejo)
    ? rawParams.idComplejo[0]
    : rawParams.idComplejo ?? ''
  const idComplejo = parseInt(idComplejoStr)

  const [complejo, setComplejo] = useState<Complejo | null>(null)
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [accesoInvalido, setAccesoInvalido] = useState(false)

  const emailUsuario = user?.primaryEmailAddress?.emailAddress

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.replace('/sign-in'); return }

    const meta = user.publicMetadata as { rol?: string | string[]; id_complejo?: number | string }
    const rolRaw = meta.rol
    const rol = Array.isArray(rolRaw) ? rolRaw[0] : rolRaw

    if (rol !== 'auxiliar') { router.replace('/'); return }

    const idComplejoMeta = Number(meta.id_complejo)
    if (!isNaN(idComplejo) && idComplejoMeta !== idComplejo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccesoInvalido(true)
    }
  }, [isLoaded, user, router, idComplejo])

  const cargarDatos = useCallback(async () => {
    if (isNaN(idComplejo)) return
    setCargando(true)
    setErrorCarga(null)
    try {
      const [resComplejo, resCanchas] = await Promise.all([
        fetch(`/api/v1/complejos/${idComplejo}`),
        fetch(`/api/v1/complejos/${idComplejo}/canchas`),
      ])
      if (resComplejo.status === 404) { setErrorCarga('Complejo no encontrado'); return }
      if (!resComplejo.ok) throw new Error('Error al cargar el complejo')
      if (!resCanchas.ok) throw new Error('Error al cargar las canchas')

      const [complejoData, canchasData] = await Promise.all([
        resComplejo.json() as Promise<Complejo>,
        resCanchas.json() as Promise<Cancha[]>,
      ])
      setComplejo(complejoData)
      setCanchas(canchasData)
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }, [idComplejo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isLoaded && emailUsuario && !accesoInvalido) cargarDatos()
  }, [isLoaded, emailUsuario, accesoInvalido, cargarDatos])

  function actualizarEstadoLocal(idCancha: number, nuevoEstado: string) {
    setCanchas((prev) =>
      prev.map((c) => (c.idCancha === idCancha ? { ...c, estadoOperativo: nuevoEstado } : c))
    )
  }

  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-[#F4F8F3] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
        </main>
        <Footer />
      </>
    )
  }

  if (accesoInvalido) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-[#F4F8F3] flex flex-col items-center justify-center gap-3">
          <p className="text-xl font-semibold text-[#061F03]">Acceso no autorizado</p>
          <p className="text-[#3B4F38]">Este complejo no está asignado a tu cuenta.</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F4F8F3]">
        <div className="max-w-5xl mx-auto px-4 py-12">

          {/* Header */}
          <div className="mb-10">
            <p className="text-sm font-medium text-[#7FB584] uppercase tracking-wider mb-1">
              Panel de Auxiliar
            </p>
            <h1 className="text-3xl font-bold text-[#061F03]">
              {complejo?.nombre ?? '—'}
            </h1>
            {user?.firstName && (
              <p className="text-[#3B4F38] mt-1">Bienvenido, {user.firstName}</p>
            )}
          </div>

          {/* Sección: Estado de canchas */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[#061F03] mb-5">Estado de canchas</h2>

            {cargando && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
              </div>
            )}

            {!cargando && errorCarga && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-4">
                <span>{errorCarga}</span>
                <button onClick={cargarDatos} className="underline text-sm shrink-0">Reintentar</button>
              </div>
            )}

            {!cargando && !errorCarga && canchas.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-10 text-center">
                <Dumbbell className="w-12 h-12 text-[#ACC2AB] mx-auto mb-3" />
                <p className="text-[#3B4F38]">Este complejo todavía no tiene canchas registradas.</p>
              </div>
            )}

            {!cargando && !errorCarga && canchas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {canchas.map((cancha) => (
                  <TarjetaCancha
                    key={cancha.idCancha}
                    cancha={cancha}
                    onEstadoCambiado={actualizarEstadoLocal}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Sección: Reservas del día */}
          {!cargando && !errorCarga && (
            <SeccionReservasDia canchas={canchas} />
          )}

          {/* Placeholder de inasistencias */}
          <div className="mt-8">
            <PlaceholderSeccion
              titulo="Inasistencias"
              descripcion="Registro de ausencias de clientes"
              Icono={UserX}
            />
          </div>

          {/* Inventario */}
          <SeccionInventario idComplejo={idComplejo} />

          {/* Reseñas */}
          {!cargando && !errorCarga && (
            <SeccionResenas canchas={canchas} />
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}

function TarjetaCancha({
  cancha,
  onEstadoCambiado,
}: {
  cancha: Cancha
  onEstadoCambiado: (idCancha: number, nuevoEstado: string) => void
}) {
  const [estadoLocal, setEstadoLocal] = useState(cancha.estadoOperativo)
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cambiarEstado(nuevoEstado: string) {
    if (nuevoEstado === estadoLocal || cargando) return
    const anterior = estadoLocal
    setEstadoLocal(nuevoEstado)
    setCargando(true)
    setExito(false)
    setError(null)
    try {
      const res = await fetch(`/api/v1/canchas/${cancha.idCancha}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoOperativo: nuevoEstado }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? 'Error al guardar')
      }
      setExito(true)
      onEstadoCambiado(cancha.idCancha, nuevoEstado)
      setTimeout(() => setExito(false), 2500)
    } catch (e) {
      setEstadoLocal(anterior)
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[#061F03] leading-tight">{cancha.nombre}</h3>
          <span
            className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clasesEstadoCancha(estadoLocal)}`}
          >
            {etiquetaEstadoCancha(estadoLocal)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-[#3B4F38] mb-1">
          <Dumbbell className="w-3.5 h-3.5 shrink-0 text-[#7FB584]" />
          <span>{cancha.deporte}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-[#3B4F38] mb-1">
          <Clock className="w-3.5 h-3.5 shrink-0 text-[#7FB584]" />
          <span>{cancha.horarioApertura} – {cancha.horarioCierre}</span>
        </div>

        <p className="text-xs text-[#3B4F38]/60 ml-5">Turnos de {cancha.duracionTurno} min</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">
          Cambiar estado
        </label>
        <select
          value={estadoLocal}
          onChange={(e) => cambiarEstado(e.target.value)}
          disabled={cargando}
          className="w-full px-3 py-2 rounded-lg border border-[#ACC2AB]/50 text-sm text-[#061F03] bg-white focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ESTADOS_CANCHA.map((e) => (
            <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
          ))}
        </select>

        <div className="h-4 flex items-center">
          {cargando && (
            <span className="flex items-center gap-1.5 text-xs text-[#3B4F38]/60">
              <div className="animate-spin w-3 h-3 border-2 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
              Guardando...
            </span>
          )}
          {!cargando && exito && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Guardado
            </span>
          )}
          {!cargando && error && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function SeccionReservasDia({ canchas }: { canchas: Cancha[] }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy())
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargarReservas = useCallback(async (fecha: string) => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/reservas?fecha=${fecha}`)
      if (!res.ok) throw new Error('Error al cargar las reservas')
      setReservas(await res.json() as Reserva[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarReservas(fechaSeleccionada)
  }, [fechaSeleccionada, cargarReservas])

  function actualizarEstadoReserva(idReserva: number, nuevoEstado: string) {
    setReservas((prev) =>
      prev.map((r) => r.idReserva === idReserva ? { ...r, estado: nuevoEstado } : r)
    )
  }

  const reservasOrdenadas = [...reservas].sort((a, b) => a.hora.localeCompare(b.hora))

  return (
    <section className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold text-[#061F03]">Reservas del día</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#ACC2AB]/50 text-sm text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] bg-white"
          />
          {canchas.length > 0 && (
            <button
              onClick={() => setModalAbierto(true)}
              className="flex items-center gap-1.5 bg-[#3B4F38] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#061F03] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva reserva
            </button>
          )}
        </div>
      </div>

      {cargando && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin w-6 h-6 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
        </div>
      )}

      {!cargando && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-3 text-sm">
          <span>{error}</span>
          <button onClick={() => cargarReservas(fechaSeleccionada)} className="underline shrink-0">
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && reservasOrdenadas.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-8 text-center">
          <Calendar className="w-10 h-10 text-[#ACC2AB] mx-auto mb-3" />
          <p className="text-[#3B4F38] text-sm">No hay reservas para este día.</p>
        </div>
      )}

      {!cargando && !error && reservasOrdenadas.length > 0 && (
        <div className="flex flex-col gap-3">
          {reservasOrdenadas.map((r) => (
            <TarjetaReservaAuxiliar
              key={r.idReserva}
              reserva={r}
              cancha={canchas.find((c) => c.idCancha === r.idCancha)}
              onEstadoCambiado={actualizarEstadoReserva}
            />
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalNuevaReserva
          canchas={canchas}
          onCerrar={() => setModalAbierto(false)}
          onExito={(fechaCreada) => {
            setModalAbierto(false)
            if (fechaCreada === fechaSeleccionada) cargarReservas(fechaSeleccionada)
          }}
        />
      )}
    </section>
  )
}

function TarjetaReservaAuxiliar({
  reserva,
  cancha,
  onEstadoCambiado,
}: {
  reserva: Reserva
  cancha: Cancha | undefined
  onEstadoCambiado: (idReserva: number, nuevoEstado: string) => void
}) {
  const [estadoLocal, setEstadoLocal] = useState(reserva.estado)
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cambiarEstado(nuevoEstado: string) {
    if (nuevoEstado === estadoLocal || cargando) return
    const anterior = estadoLocal
    setEstadoLocal(nuevoEstado)
    setCargando(true)
    setExito(false)
    setError(null)
    try {
      const res = await fetch(`/api/v1/reservas/${reserva.idReserva}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? 'Error al guardar')
      }
      setExito(true)
      onEstadoCambiado(reserva.idReserva, nuevoEstado)
      setTimeout(() => setExito(false), 2500)
    } catch (e) {
      setEstadoLocal(anterior)
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Info */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#061F03] text-sm">{reserva.hora}</span>
          <span className="text-[#3B4F38] text-sm">
            {cancha?.nombre ?? `Cancha #${reserva.idCancha}`}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${clasesEstadoReserva(estadoLocal)}`}
          >
            {etiquetaEstadoReserva(estadoLocal)}
          </span>
        </div>
        <p className="text-xs text-[#3B4F38]/70">{reserva.emailCliente}</p>
        <p className="text-xs text-[#3B4F38]/50 capitalize">
          Partido {reserva.tipoPartido}
          {reserva.cuposDisponibles != null && ` · ${reserva.cuposDisponibles} cupos`}
        </p>
      </div>

      {/* Cambio de estado */}
      <div className="flex flex-col gap-1.5 sm:w-44 shrink-0">
        <select
          value={estadoLocal}
          onChange={(e) => cambiarEstado(e.target.value)}
          disabled={cargando}
          className="w-full px-3 py-2 rounded-lg border border-[#ACC2AB]/50 text-sm text-[#061F03] bg-white focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ESTADOS_RESERVA.map((e) => (
            <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
          ))}
        </select>
        <div className="h-4 flex items-center">
          {cargando && (
            <span className="flex items-center gap-1 text-xs text-[#3B4F38]/60">
              <div className="animate-spin w-3 h-3 border-2 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
              Guardando...
            </span>
          )}
          {!cargando && exito && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Guardado
            </span>
          )}
          {!cargando && error && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ModalNuevaReserva({
  canchas,
  onCerrar,
  onExito,
}: {
  canchas: Cancha[]
  onCerrar: () => void
  onExito: (fecha: string) => void
}) {
  const [emailCliente, setEmailCliente] = useState('')
  const [idCancha, setIdCancha] = useState(canchas[0]?.idCancha ?? 0)
  const [fecha, setFecha] = useState(hoy())
  const [hora, setHora] = useState('')
  const [tipoPartido, setTipoPartido] = useState<'abierto' | 'cerrado'>('cerrado')
  const [cupos, setCupos] = useState(2)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canchaSeleccionada = canchas.find((c) => c.idCancha === idCancha)
  const slots = canchaSeleccionada
    ? calcularSlots(canchaSeleccionada.horarioApertura, canchaSeleccionada.horarioCierre, canchaSeleccionada.duracionTurno)
    : []

  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([])
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false)

  useEffect(() => {
    setHora('')
  }, [idCancha])

  useEffect(() => {
    if (!idCancha || !fecha) return
    let cancelado = false
    setCargandoDisponibilidad(true)
    setHorasOcupadas([])
    fetch(`/api/v1/canchas/${idCancha}/disponibilidad?fecha=${fecha}`)
      .then((r) => r.ok ? r.json() : { horasOcupadas: [] })
      .then((data: { horasOcupadas?: string[] }) => {
        if (!cancelado) setHorasOcupadas(data.horasOcupadas ?? [])
      })
      .catch(() => { if (!cancelado) setHorasOcupadas([]) })
      .finally(() => { if (!cancelado) setCargandoDisponibilidad(false) })
    return () => { cancelado = true }
  }, [idCancha, fecha])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCerrar])

  async function enviar() {
    if (!emailCliente.trim() || !hora || !idCancha) {
      setError('Completá todos los campos obligatorios')
      return
    }
    if (!emailCliente.includes('@')) {
      setError('Ingresá un email válido')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { fecha, hora, tipoPartido, idCancha, emailCliente: emailCliente.trim() }
      if (tipoPartido === 'abierto') body.cuposDisponibles = cupos

      const res = await fetch('/api/v1/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 201) {
        onExito(fecha)
        return
      }
      const json = await res.json().catch(() => ({}))
      throw new Error((json as { error?: { message?: string } })?.error?.message ?? 'Error al crear la reserva')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  const puedoEnviar = emailCliente.trim() && hora && idCancha && !enviando

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#ACC2AB]/20">
          <h2 className="font-bold text-[#061F03]">Nueva reserva manual</h2>
          <button onClick={onCerrar} className="text-[#3B4F38]/60 hover:text-[#061F03] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Cancha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Cancha</label>
            <select
              value={idCancha}
              onChange={(e) => setIdCancha(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-[#ACC2AB]/50 text-sm text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] bg-white"
            >
              {canchas.map((c) => (
                <option key={c.idCancha} value={c.idCancha}>{c.nombre} — {c.deporte}</option>
              ))}
            </select>
          </div>

          {/* Email cliente */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Email del cliente *</label>
            <input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={emailCliente}
              onChange={(e) => setEmailCliente(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#ACC2AB]/50 text-sm text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] placeholder:text-[#3B4F38]/40"
            />
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); setHora('') }}
              className="w-full px-4 py-3 rounded-xl border border-[#ACC2AB]/50 text-sm text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB]"
            />
          </div>

          {/* Hora */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Horario</label>
            {cargandoDisponibilidad ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-5 h-5 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-[#3B4F38]/60">No hay horarios disponibles.</p>
            ) : (
              <>
                {horasOcupadas.length > 0 && (
                  <p className="text-xs text-[#3B4F38]/60">Los horarios en gris ya están reservados.</p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => {
                    const ocupado = horasOcupadas.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { if (!ocupado) setHora(s) }}
                        disabled={ocupado}
                        title={ocupado ? 'Horario ya reservado' : undefined}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          ocupado
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : hora === s
                            ? 'bg-[#3B4F38] text-white border-[#3B4F38]'
                            : 'bg-white text-[#061F03] border-[#ACC2AB]/50 hover:border-[#3B4F38] hover:bg-[#F4F8F3]'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Tipo de partido */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Tipo de partido</label>
            <div className="flex gap-2">
              {(['cerrado', 'abierto'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoPartido(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors capitalize ${
                    tipoPartido === t
                      ? 'border-[#3B4F38] bg-[#F4F8F3] text-[#061F03]'
                      : 'border-[#ACC2AB]/30 text-[#3B4F38] hover:border-[#ACC2AB]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Cupos (si abierto) */}
          {tipoPartido === 'abierto' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Cupos disponibles</label>
              <input
                type="number"
                min={1}
                max={20}
                value={cupos}
                onChange={(e) => setCupos(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-xl border border-[#ACC2AB]/50 text-sm text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB]"
              />
            </div>
          )}

          <p className="text-xs text-[#3B4F38]/60">
            La reserva se creará con estado <strong>Pagada</strong> automáticamente.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2">
              <span className="shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCerrar}
              className="flex-1 text-sm text-[#3B4F38] border border-[#ACC2AB]/50 rounded-xl py-3 hover:bg-[#F4F8F3] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={enviar}
              disabled={!puedoEnviar}
              className="flex-1 bg-[#3B4F38] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#061F03] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando ? 'Creando...' : 'Crear reserva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type Equipamiento = {
  idEquipamiento: number
  nombre: string
  precio: number
  stock: number
  stockDisponible: number
  idComplejo: number
}

type FormEquip = { nombre: string; precio: string; stock: string }

function SeccionInventario({ idComplejo }: { idComplejo: number }) {
  const [equipamientos, setEquipamientos] = useState<Equipamiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Equipamiento | null>(null)
  const [form, setForm] = useState<FormEquip>({ nombre: '', precio: '', stock: '' })
  const [erroresForm, setErroresForm] = useState<Partial<FormEquip>>({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  const [confirmEliminar, setConfirmEliminar] = useState<Equipamiento | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (isNaN(idComplejo)) return
    setCargando(true)
    setErrorCarga(null)
    try {
      const res = await fetch(`/api/v1/complejos/${idComplejo}/equipamiento`)
      if (!res.ok) throw new Error('Error al cargar el inventario')
      setEquipamientos(await res.json() as Equipamiento[])
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }, [idComplejo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
  }, [cargar])

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

  function validar(): boolean {
    const errs: Partial<FormEquip> = {}
    if (!form.nombre.trim()) errs.nombre = 'Requerido'
    const precio = Number(form.precio)
    if (form.precio === '' || isNaN(precio) || precio < 0) errs.precio = 'Precio inválido'
    const stock = Number(form.stock)
    if (form.stock === '' || !Number.isInteger(stock) || stock < 0) errs.stock = 'Stock inválido'
    setErroresForm(errs)
    return Object.keys(errs).length === 0
  }

  async function guardar() {
    if (!validar()) return
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
      cargar()
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

  const inputCls = (err: boolean) =>
    `w-full px-3 py-2 rounded-xl border text-sm text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] ${
      err ? 'border-red-400' : 'border-[#ACC2AB]/50'
    }`

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#7FB584]" />
          <h2 className="font-bold text-[#061F03] text-lg">Inventario</h2>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-1.5 bg-[#3B4F38] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#061F03] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {cargando && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin w-7 h-7 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
        </div>
      )}

      {!cargando && errorCarga && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-3 text-sm">
          <span>{errorCarga}</span>
          <button onClick={cargar} className="underline shrink-0">Reintentar</button>
        </div>
      )}

      {!cargando && !errorCarga && equipamientos.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#ACC2AB]/20 p-8 text-center">
          <Package className="w-10 h-10 text-[#ACC2AB] mx-auto mb-3" />
          <p className="text-sm text-[#3B4F38]">Sin artículos registrados.</p>
        </div>
      )}

      {!cargando && !errorCarga && equipamientos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {equipamientos.map((e) => (
            <div key={e.idEquipamiento} className="bg-white rounded-2xl border border-[#ACC2AB]/20 p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[#061F03] text-sm">{e.nombre}</p>
                <span className="text-sm font-semibold text-[#3B4F38] shrink-0">${e.precio.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#3B4F38]">
                <span>Stock: <strong>{e.stock}</strong></span>
                <span>
                  Disp:{' '}
                  <strong className={e.stockDisponible === 0 ? 'text-red-600' : ''}>{e.stockDisponible}</strong>
                </span>
              </div>
              <div className="flex gap-2 mt-0.5">
                <button
                  onClick={() => abrirEditar(e)}
                  className="flex items-center gap-1 text-xs text-[#3B4F38] border border-[#ACC2AB]/40 rounded-lg px-2.5 py-1.5 hover:bg-[#F4F8F3] transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={() => { setErrorEliminar(null); setConfirmEliminar(e) }}
                  className="flex items-center gap-1 text-xs text-red-600 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-[#061F03] text-lg mb-4">
              {editando ? 'Editar artículo' : 'Nuevo artículo'}
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Nombre</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="ej. Pelota de Fútbol" className={inputCls(!!erroresForm.nombre)} />
                {erroresForm.nombre && <p className="text-xs text-red-500">{erroresForm.nombre}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Precio</label>
                <input type="number" min={0} step="0.01" value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  placeholder="0.00" className={inputCls(!!erroresForm.precio)} />
                {erroresForm.precio && <p className="text-xs text-red-500">{erroresForm.precio}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Stock total</label>
                <input type="number" min={0} value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0" className={inputCls(!!erroresForm.stock)} />
                {erroresForm.stock && <p className="text-xs text-red-500">{erroresForm.stock}</p>}
              </div>
              {errorGuardado && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{errorGuardado}</p>
              )}
              <div className="flex gap-3 mt-1">
                <button onClick={() => setModalAbierto(false)}
                  className="flex-1 text-sm text-[#3B4F38] border border-[#ACC2AB]/50 rounded-xl py-2.5 hover:bg-[#F4F8F3] transition-colors">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={guardando}
                  className="flex-1 bg-[#3B4F38] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#061F03] transition-colors disabled:opacity-50">
                  {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
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
              <button onClick={() => setConfirmEliminar(null)}
                className="flex-1 text-sm text-[#3B4F38] border border-[#ACC2AB]/50 rounded-xl py-2.5 hover:bg-[#F4F8F3] transition-colors">
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmEliminar)} disabled={eliminando}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

type Resena = {
  idResena: number
  comentario: string
  calificacion: number
  emailCliente: string
  idCancha: number
}

function SeccionResenas({ canchas }: { canchas: Cancha[] }) {
  const [resenasPorCancha, setResenasPorCancha] = useState<Record<number, Resena[]>>({})
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (canchas.length === 0) return
    setCargando(true)
    setError(null)
    try {
      const resultados = await Promise.all(
        canchas.map(async (c) => {
          const res = await fetch(`/api/v1/canchas/${c.idCancha}/resenas`)
          if (!res.ok) return { idCancha: c.idCancha, resenas: [] as Resena[] }
          return { idCancha: c.idCancha, resenas: await res.json() as Resena[] }
        })
      )
      const mapa: Record<number, Resena[]> = {}
      resultados.forEach(({ idCancha, resenas }) => { mapa[idCancha] = resenas })
      setResenasPorCancha(mapa)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }, [canchas])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
  }, [cargar])

  const totalResenas = Object.values(resenasPorCancha).reduce((s, arr) => s + arr.length, 0)

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareAux className="w-5 h-5 text-[#7FB584]" />
        <h2 className="font-bold text-[#061F03] text-lg">Reseñas del complejo</h2>
        {!cargando && totalResenas > 0 && (
          <span className="text-xs bg-[#D7E6D3] text-[#3B4F38] px-2 py-0.5 rounded-full">
            {totalResenas}
          </span>
        )}
      </div>

      {cargando && (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-7 h-7 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
        </div>
      )}

      {!cargando && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-3 text-sm">
          <span>{error}</span>
          <button onClick={cargar} className="underline shrink-0">Reintentar</button>
        </div>
      )}

      {!cargando && !error && totalResenas === 0 && (
        <div className="bg-white rounded-2xl border border-[#ACC2AB]/20 p-8 text-center">
          <MessageSquareAux className="w-10 h-10 text-[#ACC2AB] mx-auto mb-2" />
          <p className="text-sm text-[#3B4F38]/60">Ninguna cancha tiene reseñas todavía.</p>
        </div>
      )}

      {!cargando && !error && totalResenas > 0 && (
        <div className="flex flex-col gap-6">
          {canchas.map((cancha) => {
            const resenas = resenasPorCancha[cancha.idCancha] ?? []
            if (resenas.length === 0) return null
            const promedio = resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length
            return (
              <div key={cancha.idCancha}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="font-semibold text-[#061F03] text-sm">{cancha.nombre}</p>
                  <Estrellas modo="lectura" valor={Math.round(promedio * 10) / 10} size="sm" />
                  <span className="text-xs text-[#3B4F38]/60">
                    {(Math.round(promedio * 10) / 10).toFixed(1)} · {resenas.length} reseña{resenas.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {resenas.map((r) => (
                    <div key={r.idResena} className="bg-white rounded-xl border border-[#ACC2AB]/20 p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <Estrellas modo="lectura" valor={r.calificacion} size="sm" />
                        <span className="text-xs text-[#3B4F38]/50 truncate max-w-[160px]">{r.emailCliente}</span>
                      </div>
                      <p className="text-sm text-[#061F03]">{r.comentario}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// Alias local para evitar conflicto con el ícono importado como 'X'
function MessageSquareAux({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function PlaceholderSeccion({
  titulo,
  descripcion,
  Icono,
}: {
  titulo: string
  descripcion: string
  Icono: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#ACC2AB]/20 p-6 flex flex-col gap-3 opacity-50 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icono className="w-5 h-5 text-[#ACC2AB]" />
          <h3 className="font-semibold text-[#3B4F38]">{titulo}</h3>
        </div>
        <span className="text-xs bg-[#D7E6D3] text-[#3B4F38]/60 px-2 py-0.5 rounded-full">
          Próximamente
        </span>
      </div>
      <p className="text-sm text-[#3B4F38]/60">{descripcion}</p>
    </div>
  )
}
