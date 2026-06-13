'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Navbar from '@/src/components/Navbar'
import Footer from '@/src/components/Footer'
import Estrellas from '@/src/components/Estrellas'
import {
  ChevronLeft, MapPin, Clock, Dumbbell, X, CheckCircle2, Calendar, ChevronRight,
  Star, Trash2, MessageSquare,
} from 'lucide-react'

type Complejo = {
  id_complejo: number
  nombre: string
  direccion: string
}

type Cancha = {
  idCancha: number
  nombre: string
  deporte: string
  estadoOperativo: string
  horarioApertura: string
  horarioCierre: string
  duracionTurno: number
}

function etiquetaEstado(estado: string) {
  if (estado === 'disponible') return 'Disponible'
  if (estado === 'ocupada') return 'Ocupada'
  if (estado === 'en mantenimiento') return 'En mantenimiento'
  return estado
}

function clasesEstado(estado: string) {
  if (estado === 'disponible') return 'bg-[#D7E6D3] text-[#3B4F38]'
  if (estado === 'ocupada') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
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

function hoy(): string {
  return new Date().toISOString().substring(0, 10)
}

export default function PaginaDetalleComplejo() {
  const rawParams = useParams()
  const idComplejoStr = Array.isArray(rawParams.idComplejo)
    ? rawParams.idComplejo[0]
    : rawParams.idComplejo ?? ''
  const idComplejo = parseInt(idComplejoStr)

  const { user, isLoaded } = useUser()
  const meta = user?.publicMetadata as { rol?: string | string[] } | undefined
  const rolRaw = meta?.rol
  const rol = Array.isArray(rolRaw) ? rolRaw[0] : rolRaw

  const [complejo, setComplejo] = useState<Complejo | null>(null)
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [canchaParaReservar, setCanchaParaReservar] = useState<Cancha | null>(null)
  const [canchaResenas, setCanchaResenas] = useState<Cancha | null>(null)

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
    cargarDatos()
  }, [cargarDatos])

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F4F8F3]">
        <div className="max-w-5xl mx-auto px-4 py-12">

          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 text-sm text-[#3B4F38] hover:text-[#061F03] mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Explorar complejos
          </Link>

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

          {!cargando && !errorCarga && complejo && (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-[#061F03] mb-2">{complejo.nombre}</h1>
                <div className="flex items-center gap-1.5 text-[#3B4F38]">
                  <MapPin className="w-4 h-4 shrink-0 text-[#7FB584]" />
                  <span>{complejo.direccion}</span>
                </div>
              </div>

              <section>
                <h2 className="text-xl font-bold text-[#061F03] mb-5">Canchas</h2>

                {canchas.length === 0 && (
                  <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-10 text-center">
                    <Dumbbell className="w-12 h-12 text-[#ACC2AB] mx-auto mb-3" />
                    <p className="text-[#3B4F38]">Este complejo todavía no tiene canchas registradas.</p>
                  </div>
                )}

                {canchas.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {canchas.map((cancha) => (
                      <TarjetaCancha
                        key={cancha.idCancha}
                        cancha={cancha}
                        puedeReservar={isLoaded && rol === 'cliente' && cancha.estadoOperativo === 'disponible'}
                        onReservar={() => setCanchaParaReservar(cancha)}
                        onVerResenas={() => setCanchaResenas(cancha)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

        </div>
      </main>

      {canchaParaReservar && user && (
        <ModalReserva
          cancha={canchaParaReservar}
          emailCliente={user.primaryEmailAddress?.emailAddress ?? ''}
          onCerrar={() => setCanchaParaReservar(null)}
        />
      )}

      {canchaResenas && (
        <ModalResenas
          cancha={canchaResenas}
          emailUsuario={isLoaded && rol === 'cliente' ? (user?.primaryEmailAddress?.emailAddress ?? null) : null}
          onCerrar={() => setCanchaResenas(null)}
        />
      )}

      <Footer />
    </>
  )
}

function TarjetaCancha({
  cancha,
  puedeReservar,
  onReservar,
  onVerResenas,
}: {
  cancha: Cancha
  puedeReservar: boolean
  onReservar: () => void
  onVerResenas: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-[#061F03] leading-tight">{cancha.nombre}</h3>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clasesEstado(cancha.estadoOperativo)}`}
        >
          {etiquetaEstado(cancha.estadoOperativo)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-[#3B4F38]">
        <Dumbbell className="w-3.5 h-3.5 shrink-0 text-[#7FB584]" />
        <span>{cancha.deporte}</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-[#3B4F38]">
        <Clock className="w-3.5 h-3.5 shrink-0 text-[#7FB584]" />
        <span>{cancha.horarioApertura} – {cancha.horarioCierre}</span>
      </div>

      <p className="text-xs text-[#3B4F38]/60 ml-5">Turnos de {cancha.duracionTurno} min</p>

      <div className="flex gap-2 mt-1">
        <button
          onClick={onVerResenas}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm text-[#3B4F38] border border-[#ACC2AB]/50 rounded-xl py-2 hover:bg-[#F4F8F3] transition-colors"
        >
          <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
          Reseñas
        </button>

        {puedeReservar && (
          <button
            onClick={onReservar}
            className="flex-1 bg-[#3B4F38] text-white rounded-xl py-2 text-sm font-medium hover:bg-[#061F03] transition-colors"
          >
            Reservar
          </button>
        )}
      </div>
    </div>
  )
}

type PasoModal = 1 | 2 | 3 | 4 | 5

function ModalReserva({
  cancha,
  emailCliente,
  onCerrar,
}: {
  cancha: Cancha
  emailCliente: string
  onCerrar: () => void
}) {
  const [paso, setPaso] = useState<PasoModal>(1)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [tipoPartido, setTipoPartido] = useState<'abierto' | 'cerrado'>('cerrado')
  const [cupos, setCupos] = useState(2)
  const [pagarAhora, setPagarAhora] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([])
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false)

  const slots = calcularSlots(cancha.horarioApertura, cancha.horarioCierre, cancha.duracionTurno)

  async function irAPaso2() {
    setPaso(2)
    setHorasOcupadas([])
    setCargandoDisponibilidad(true)
    try {
      const res = await fetch(`/api/v1/canchas/${cancha.idCancha}/disponibilidad?fecha=${fecha}`)
      if (res.ok) {
        const data = await res.json() as { horasOcupadas: string[] }
        setHorasOcupadas(data.horasOcupadas ?? [])
      }
    } catch {
      // Si falla, igual mostramos los slots — el 409 avisará al confirmar
    } finally {
      setCargandoDisponibilidad(false)
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !exito) onCerrar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCerrar, exito])

  async function confirmar() {
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const body: Record<string, unknown> = {
        fecha,
        hora,
        tipoPartido,
        idCancha: cancha.idCancha,
        emailCliente,
        pagarAhora,
      }
      if (tipoPartido === 'abierto') body.cuposDisponibles = cupos

      const res = await fetch('/api/v1/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 201) {
        setExito(true)
        return
      }

      const json = await res.json().catch(() => ({}))
      const msg = (json as { error?: { message?: string } })?.error?.message ?? 'Error al crear la reserva'

      if (res.status === 409) {
        setErrorEnvio('Ese horario ya está ocupado. Volvé al paso 2 y elegí otro.')
      } else {
        setErrorEnvio(msg)
      }
    } catch {
      setErrorEnvio('Error de conexión. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const titulos: Record<PasoModal, string> = {
    1: 'Elegí una fecha',
    2: 'Elegí un horario',
    3: 'Tipo de partido',
    4: 'Método de pago',
    5: 'Confirmá tu reserva',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget && !exito) onCerrar() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ACC2AB]/20">
          <div>
            {!exito && (
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7FB584] mb-0.5">
                Reservar · Paso {paso} de 5
              </p>
            )}
            <h2 className="font-bold text-[#061F03]">
              {exito ? '¡Reserva confirmada!' : titulos[paso]}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            className="text-[#3B4F38]/60 hover:text-[#061F03] transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Info de la cancha */}
          {!exito && (
            <div className="bg-[#F4F8F3] rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 text-sm">
              <Dumbbell className="w-4 h-4 text-[#7FB584] shrink-0" />
              <span className="font-medium text-[#061F03]">{cancha.nombre}</span>
              <span className="text-[#3B4F38]/60">— {cancha.deporte}</span>
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 bg-[#D7E6D3] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#3B4F38]" />
              </div>
              <div>
                <p className="text-[#061F03] font-semibold mb-1">Tu reserva fue registrada</p>
                <p className="text-sm text-[#3B4F38]">
                  {cancha.nombre} · {fecha} · {hora}
                </p>
                <p className="text-sm text-[#3B4F38] mt-0.5">
                  {pagarAhora ? 'Pago: registrado' : 'Pago: al llegar'}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                <Link
                  href="/reservas"
                  className="w-full bg-[#3B4F38] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#061F03] transition-colors text-center"
                  onClick={onCerrar}
                >
                  Ver mis reservas
                </Link>
                <button
                  onClick={onCerrar}
                  className="w-full text-sm text-[#3B4F38] border border-[#ACC2AB]/50 rounded-xl py-2.5 hover:bg-[#F4F8F3] transition-colors"
                >
                  Seguir explorando
                </button>
              </div>
            </div>
          )}

          {/* Paso 1: Fecha */}
          {!exito && paso === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">
                  Seleccioná la fecha
                </label>
                <input
                  type="date"
                  min={hoy()}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#ACC2AB]/50 text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] bg-white"
                />
              </div>
              <button
                onClick={irAPaso2}
                disabled={!fecha}
                className="w-full flex items-center justify-center gap-2 bg-[#3B4F38] text-white rounded-xl py-3 font-medium hover:bg-[#061F03] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Paso 2: Hora */}
          {!exito && paso === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[#3B4F38]">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#7FB584]" />
                {fecha} · Turnos de {cancha.duracionTurno} min
              </p>
              {cargandoDisponibilidad ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin w-6 h-6 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-red-600">No hay horarios disponibles para esta cancha.</p>
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
                          onClick={() => { if (!ocupado) { setHora(s); setPaso(3) } }}
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
              <button
                onClick={() => setPaso(1)}
                className="text-sm text-[#3B4F38] underline text-left"
              >
                ← Cambiar fecha
              </button>
            </div>
          )}

          {/* Paso 3: Tipo de partido */}
          {!exito && paso === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {([
                  { valor: 'cerrado', titulo: 'Partido cerrado', desc: 'Solo tu grupo, sin cupos adicionales' },
                  { valor: 'abierto', titulo: 'Partido abierto', desc: 'Podés buscar jugadores para completar el equipo' },
                ] as { valor: 'abierto' | 'cerrado'; titulo: string; desc: string }[]).map(({ valor, titulo, desc }) => (
                  <button
                    key={valor}
                    onClick={() => setTipoPartido(valor)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                      tipoPartido === valor
                        ? 'border-[#3B4F38] bg-[#F4F8F3]'
                        : 'border-[#ACC2AB]/30 hover:border-[#ACC2AB]'
                    }`}
                  >
                    <p className="font-medium text-[#061F03] text-sm">{titulo}</p>
                    <p className="text-xs text-[#3B4F38]/60 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>

              {tipoPartido === 'abierto' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">
                    Cupos disponibles
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={cupos}
                    onChange={(e) => setCupos(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-xl border border-[#ACC2AB]/50 text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB]"
                  />
                </div>
              )}

              <button
                onClick={() => setPaso(4)}
                disabled={tipoPartido === 'abierto' && cupos < 1}
                className="w-full flex items-center justify-center gap-2 bg-[#3B4F38] text-white rounded-xl py-3 font-medium hover:bg-[#061F03] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setPaso(2)} className="text-sm text-[#3B4F38] underline text-left">
                ← Volver
              </button>
            </div>
          )}

          {/* Paso 4: Pago */}
          {!exito && paso === 4 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { valor: true, titulo: 'Pagar ahora', desc: 'Reserva confirmada de inmediato' },
                  { valor: false, titulo: 'Pagar al llegar', desc: 'La reserva queda pendiente' },
                ] as { valor: boolean; titulo: string; desc: string }[]).map(({ valor, titulo, desc }) => (
                  <button
                    key={String(valor)}
                    onClick={() => { setPagarAhora(valor); setPaso(5) }}
                    className={`text-left px-4 py-4 rounded-xl border-2 transition-colors ${
                      pagarAhora === valor
                        ? 'border-[#3B4F38] bg-[#F4F8F3]'
                        : 'border-[#ACC2AB]/30 hover:border-[#ACC2AB]'
                    }`}
                  >
                    <p className="font-medium text-[#061F03] text-sm">{titulo}</p>
                    <p className="text-xs text-[#3B4F38]/60 mt-1">{desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setPaso(3)} className="text-sm text-[#3B4F38] underline text-left">
                ← Volver
              </button>
            </div>
          )}

          {/* Paso 5: Resumen */}
          {!exito && paso === 5 && (
            <div className="flex flex-col gap-5">
              <div className="bg-[#F4F8F3] rounded-xl p-4 flex flex-col gap-2 text-sm">
                <FilaResumen label="Cancha" valor={cancha.nombre} />
                <FilaResumen label="Deporte" valor={cancha.deporte} />
                <FilaResumen label="Fecha" valor={fecha} />
                <FilaResumen label="Hora" valor={hora} />
                <FilaResumen
                  label="Tipo"
                  valor={tipoPartido === 'abierto' ? `Abierto (${cupos} cupos)` : 'Cerrado'}
                />
                <FilaResumen
                  label="Pago"
                  valor={pagarAhora ? 'Ahora (estado: pagada)' : 'Al llegar (estado: pendiente)'}
                />
              </div>

              {errorEnvio && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{errorEnvio}</span>
                </div>
              )}

              <button
                onClick={confirmar}
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 bg-[#3B4F38] text-white rounded-xl py-3 font-medium hover:bg-[#061F03] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar reserva
                  </>
                )}
              </button>
              <button onClick={() => setPaso(4)} className="text-sm text-[#3B4F38] underline text-left">
                ← Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type Resena = {
  idResena: number
  comentario: string
  calificacion: number
  emailCliente: string
  idCancha: number
}

function ocultarEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  return `${user.slice(0, 2)}***@${domain}`
}

function ModalResenas({
  cancha,
  emailUsuario,
  onCerrar,
}: {
  cancha: Cancha
  emailUsuario: string | null
  onCerrar: () => void
}) {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/canchas/${cancha.idCancha}/resenas`)
      if (!res.ok) throw new Error('Error al cargar las reseñas')
      setResenas(await res.json() as Resena[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }, [cancha.idCancha])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
  }, [cargar])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCerrar])

  const miResena = emailUsuario ? resenas.find((r) => r.emailCliente === emailUsuario) : undefined
  const otras = emailUsuario ? resenas.filter((r) => r.emailCliente !== emailUsuario) : resenas

  const promedio = resenas.length > 0
    ? Math.round((resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length) * 10) / 10
    : null

  async function publicar() {
    if (calificacion === 0) { setErrorEnvio('Elegí una calificación'); return }
    if (!comentario.trim()) { setErrorEnvio('Escribí un comentario'); return }
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const res = await fetch(`/api/v1/canchas/${cancha.idCancha}/resenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificacion, comentario: comentario.trim() }),
      })
      if (res.status === 201) {
        setCalificacion(0)
        setComentario('')
        cargar()
        return
      }
      if (res.status === 409) {
        cargar()
        return
      }
      const json = await res.json().catch(() => ({}))
      throw new Error((json as { error?: { message?: string } })?.error?.message ?? 'Error al publicar')
    } catch (e) {
      setErrorEnvio(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  async function eliminar() {
    if (!miResena) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/v1/resenas/${miResena.idResena}`, { method: 'DELETE' })
      if (res.status === 204) {
        setConfirmEliminar(false)
        cargar()
      }
    } catch {
      // silencioso — el usuario puede reintentar
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ACC2AB]/20">
          <div>
            <h2 className="font-bold text-[#061F03]">Reseñas — {cancha.nombre}</h2>
            {promedio !== null && (
              <div className="flex items-center gap-2 mt-1">
                <Estrellas modo="lectura" valor={promedio} size="sm" />
                <span className="text-sm text-[#3B4F38]">
                  {promedio.toFixed(1)} ({resenas.length} reseña{resenas.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}
          </div>
          <button onClick={onCerrar} className="text-[#3B4F38]/60 hover:text-[#061F03] p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">
          {cargando && (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-7 h-7 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
            </div>
          )}

          {!cargando && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-center gap-3">
              <span>{error}</span>
              <button onClick={cargar} className="underline shrink-0">Reintentar</button>
            </div>
          )}

          {!cargando && !error && (
            <>
              {/* Mi reseña */}
              {miResena && (
                <div>
                  <h3 className="text-xs font-semibold text-[#3B4F38]/70 uppercase tracking-wide mb-2">Tu reseña</h3>
                  <div className="bg-[#F4F8F3] rounded-xl p-4 border-2 border-[#3B4F38]/20 flex flex-col gap-2">
                    <Estrellas modo="lectura" valor={miResena.calificacion} size="sm" />
                    <p className="text-sm text-[#061F03]">{miResena.comentario}</p>
                    {!confirmEliminar ? (
                      <button
                        onClick={() => setConfirmEliminar(true)}
                        className="self-start flex items-center gap-1 text-xs text-red-600 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition-colors mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-[#3B4F38]">¿Confirmás?</span>
                        <button
                          onClick={eliminar}
                          disabled={eliminando}
                          className="text-xs bg-red-600 text-white rounded-lg px-3 py-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                        </button>
                        <button
                          onClick={() => setConfirmEliminar(false)}
                          className="text-xs text-[#3B4F38] border border-[#ACC2AB]/50 rounded-lg px-3 py-1.5 hover:bg-[#F4F8F3] transition-colors"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Formulario (solo si es cliente y no tiene reseña) */}
              {emailUsuario && !miResena && (
                <div>
                  <h3 className="text-xs font-semibold text-[#3B4F38]/70 uppercase tracking-wide mb-3">
                    Dejar una reseña
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Calificación</label>
                      <Estrellas modo="interactivo" valor={calificacion} onChange={setCalificacion} size="lg" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#3B4F38]/70 uppercase tracking-wide">Comentario</label>
                      <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Contá tu experiencia..."
                        className="w-full px-4 py-3 rounded-xl border border-[#ACC2AB]/50 text-sm text-[#061F03] focus:outline-none focus:ring-2 focus:ring-[#ACC2AB] resize-none placeholder:text-[#3B4F38]/40"
                      />
                      <p className="text-xs text-[#3B4F38]/50 text-right">{comentario.length}/1000</p>
                    </div>
                    {errorEnvio && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{errorEnvio}</p>
                    )}
                    <button
                      onClick={publicar}
                      disabled={enviando}
                      className="w-full bg-[#3B4F38] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#061F03] transition-colors disabled:opacity-50"
                    >
                      {enviando ? 'Publicando...' : 'Publicar reseña'}
                    </button>
                  </div>
                </div>
              )}

              {/* Reseñas de otros */}
              <div>
                <h3 className="text-xs font-semibold text-[#3B4F38]/70 uppercase tracking-wide mb-3">
                  {otras.length > 0
                    ? `${otras.length} reseña${otras.length !== 1 ? 's' : ''}`
                    : 'Reseñas'}
                </h3>
                {otras.length === 0 && !miResena && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-[#ACC2AB] mx-auto mb-2" />
                    <p className="text-sm text-[#3B4F38]/60">
                      Esta cancha todavía no tiene reseñas. ¡Sé el primero!
                    </p>
                  </div>
                )}
                {otras.length === 0 && miResena && (
                  <p className="text-sm text-[#3B4F38]/50">No hay otras reseñas aún.</p>
                )}
                {otras.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {otras.map((r) => (
                      <div key={r.idResena} className="bg-[#F4F8F3] rounded-xl p-4 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Estrellas modo="lectura" valor={r.calificacion} size="sm" />
                          <span className="text-xs text-[#3B4F38]/50">{ocultarEmail(r.emailCliente)}</span>
                        </div>
                        <p className="text-sm text-[#061F03]">{r.comentario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FilaResumen({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#3B4F38]/60">{label}</span>
      <span className="font-medium text-[#061F03] text-right">{valor}</span>
    </div>
  )
}
