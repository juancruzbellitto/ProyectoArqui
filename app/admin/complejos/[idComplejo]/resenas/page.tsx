'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Navbar from '@/src/components/Navbar'
import Footer from '@/src/components/Footer'
import Estrellas from '@/src/components/Estrellas'
import { ChevronLeft, MessageSquare } from 'lucide-react'

type Cancha = {
  idCancha: number
  nombre: string
  deporte: string
}

type Resena = {
  idResena: number
  comentario: string
  calificacion: number
  emailCliente: string
  idCancha: number
}

export default function PaginaResenasAdmin() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const rawParams = useParams()
  const idComplejoStr = Array.isArray(rawParams.idComplejo)
    ? rawParams.idComplejo[0]
    : rawParams.idComplejo ?? ''
  const idComplejo = parseInt(idComplejoStr)

  const [nombreComplejo, setNombreComplejo] = useState('')
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [resenasPorCancha, setResenasPorCancha] = useState<Record<number, Resena[]>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.replace('/sign-in'); return }
    const rolRaw = (user.publicMetadata as { rol?: string | string[] }).rol
    const rol = Array.isArray(rolRaw) ? rolRaw[0] : rolRaw
    if (rol !== 'admin') router.replace('/')
  }, [isLoaded, user, router])

  const cargar = useCallback(async () => {
    if (isNaN(idComplejo)) return
    setCargando(true)
    setError(null)
    try {
      const [resComplejo, resCanchas] = await Promise.all([
        fetch(`/api/v1/complejos/${idComplejo}`),
        fetch(`/api/v1/complejos/${idComplejo}/canchas`),
      ])
      if (!resComplejo.ok) throw new Error('Error al cargar el complejo')
      if (!resCanchas.ok) throw new Error('Error al cargar las canchas')

      const [complejoData, canchasData] = await Promise.all([
        resComplejo.json() as Promise<{ nombre: string }>,
        resCanchas.json() as Promise<Cancha[]>,
      ])
      setNombreComplejo(complejoData.nombre)
      setCanchas(canchasData)

      const resultados = await Promise.all(
        canchasData.map(async (c) => {
          const res = await fetch(`/api/v1/canchas/${c.idCancha}/resenas`)
          return {
            idCancha: c.idCancha,
            resenas: res.ok ? (await res.json() as Resena[]) : [] as Resena[],
          }
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
  }, [idComplejo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isLoaded && user) cargar()
  }, [isLoaded, user, cargar])

  const totalResenas = Object.values(resenasPorCancha).reduce((s, a) => s + a.length, 0)

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

          <div className="mb-8">
            <p className="text-xs font-semibold text-[#7FB584] uppercase tracking-wider mb-0.5">
              {nombreComplejo || `Complejo #${idComplejo}`}
            </p>
            <h1 className="text-3xl font-bold text-[#061F03]">Reseñas</h1>
          </div>

          {cargando && (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-[#ACC2AB] border-t-[#3B4F38] rounded-full" />
            </div>
          )}

          {!cargando && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-4">
              <span>{error}</span>
              <button onClick={cargar} className="underline text-sm shrink-0">Reintentar</button>
            </div>
          )}

          {!cargando && !error && totalResenas === 0 && (
            <div className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-12 text-center">
              <MessageSquare className="w-14 h-14 text-[#ACC2AB] mx-auto mb-4" />
              <p className="text-[#061F03] font-semibold mb-1">Sin reseñas</p>
              <p className="text-[#3B4F38] text-sm">Ninguna cancha de este complejo tiene reseñas todavía.</p>
            </div>
          )}

          {!cargando && !error && totalResenas > 0 && (
            <div className="flex flex-col gap-8">
              {canchas.map((cancha) => {
                const resenas = resenasPorCancha[cancha.idCancha] ?? []
                if (resenas.length === 0) return null
                const promedio = resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length
                return (
                  <section key={cancha.idCancha}>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h2 className="font-bold text-[#061F03]">{cancha.nombre}</h2>
                      <span className="text-xs text-[#3B4F38]/60">{cancha.deporte}</span>
                      <Estrellas modo="lectura" valor={Math.round(promedio * 10) / 10} size="sm" />
                      <span className="text-xs text-[#3B4F38]/60">
                        {(Math.round(promedio * 10) / 10).toFixed(1)} · {resenas.length} reseña{resenas.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {resenas.map((r) => (
                        <div key={r.idResena} className="bg-white rounded-2xl border border-[#ACC2AB]/30 p-4 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <Estrellas modo="lectura" valor={r.calificacion} size="sm" />
                            <span className="text-xs text-[#3B4F38]/50">{r.emailCliente}</span>
                          </div>
                          <p className="text-sm text-[#061F03]">{r.comentario}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
