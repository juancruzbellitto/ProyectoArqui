import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { NextRequest } from 'next/server'

function getPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no configurado')
  return new PrismaClient({ adapter: new PrismaPg(url) })
}

function errorJson(code: string, message: string, status: number, details?: string) {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  )
}

function resenaToResponse(r: {
  id_resenia: number
  comentario: string
  calificacion: number
  email_cliente: string
  id_cancha: number
}) {
  return {
    idResena: r.id_resenia,
    comentario: r.comentario,
    calificacion: r.calificacion,
    emailCliente: r.email_cliente,
    idCancha: r.id_cancha,
  }
}

type Params = { idCancha: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { idCancha: idStr } = await params
  const idCancha = parseInt(idStr)
  if (isNaN(idCancha)) return errorJson('BAD_REQUEST', 'ID de cancha inválido', 400)

  const prisma = getPrisma()
  try {
    const cancha = await prisma.cancha.findUnique({ where: { id_cancha: idCancha } })
    if (!cancha) return errorJson('NOT_FOUND', 'Cancha no encontrada', 404)

    const resenas = await prisma.resenia.findMany({
      where: { id_cancha: idCancha },
      orderBy: { id_resenia: 'desc' },
    })

    return Response.json(resenas.map(resenaToResponse))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /canchas/:id/resenas]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idCancha: idStr } = await params
  const idCancha = parseInt(idStr)
  if (isNaN(idCancha)) return errorJson('BAD_REQUEST', 'ID de cancha inválido', 400)

  const prisma = getPrisma()
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { clerk_user_id: userId },
      select: { email: true, rol: true },
    })
    if (!usuario) return errorJson('UNAUTHORIZED', 'Usuario no encontrado', 401)
    if (usuario.rol !== 'cliente') return errorJson('FORBIDDEN', 'Solo los clientes pueden dejar reseñas', 403)

    const cancha = await prisma.cancha.findUnique({ where: { id_cancha: idCancha } })
    if (!cancha) return errorJson('NOT_FOUND', 'Cancha no encontrada', 404)

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return errorJson('BAD_REQUEST', 'Body JSON inválido', 400)
    }

    const { comentario, calificacion } = body

    if (comentario === undefined || comentario === null || typeof comentario !== 'string' || !comentario.trim()) {
      return errorJson('VALIDATION_ERROR', 'El comentario es requerido', 400)
    }
    if (comentario.trim().length > 1000) {
      return errorJson('VALIDATION_ERROR', 'El comentario no puede superar los 1000 caracteres', 400)
    }

    const calNum = Number(calificacion)
    if (
      calificacion === undefined ||
      calificacion === null ||
      !Number.isInteger(calNum) ||
      calNum < 1 ||
      calNum > 5
    ) {
      return errorJson('VALIDATION_ERROR', 'La calificación debe ser un entero entre 1 y 5', 400)
    }

    // Verificar unicidad: un cliente, una reseña por cancha
    const existente = await prisma.resenia.findFirst({
      where: { email_cliente: usuario.email, id_cancha: idCancha },
    })
    if (existente) {
      return errorJson('CONFLICT', 'Ya dejaste una reseña en esta cancha', 409)
    }

    const creada = await prisma.resenia.create({
      data: {
        comentario: comentario.trim(),
        calificacion: calNum,
        email_cliente: usuario.email,
        id_cancha: idCancha,
      },
    })

    return Response.json(resenaToResponse(creada), {
      status: 201,
      headers: { Location: `/api/v1/resenas/${creada.id_resenia}` },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /canchas/:id/resenas]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}
