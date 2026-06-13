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

function equipamientoToResponse(e: {
  id_equipamiento: number
  nombre: string
  precio: unknown
  stock: number
  stock_disponible: number
  id_complejo: number
}) {
  return {
    idEquipamiento: e.id_equipamiento,
    nombre: e.nombre,
    precio: Number(e.precio),
    stock: e.stock,
    stockDisponible: e.stock_disponible,
    idComplejo: e.id_complejo,
  }
}

type Params = { idComplejo: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idComplejo: idStr } = await params
  const idComplejo = parseInt(idStr)
  if (isNaN(idComplejo)) return errorJson('BAD_REQUEST', 'ID inválido', 400)

  const prisma = getPrisma()
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { clerk_user_id: userId },
      select: { email: true, rol: true },
    })
    if (!usuario) return errorJson('UNAUTHORIZED', 'Usuario no encontrado', 401)

    const complejo = await prisma.complejo.findUnique({ where: { id_complejo: idComplejo } })
    if (!complejo) return errorJson('NOT_FOUND', 'Complejo no encontrado', 404)

    if (usuario.rol === 'admin') {
      if (complejo.email_administrador !== usuario.email) {
        return errorJson('FORBIDDEN', 'No sos el administrador de este complejo', 403)
      }
    } else if (usuario.rol === 'auxiliar') {
      const auxiliar = await prisma.auxiliar.findUnique({ where: { email: usuario.email } })
      if (!auxiliar || auxiliar.id_complejo !== idComplejo) {
        return errorJson('FORBIDDEN', 'Este complejo no está asignado a tu cuenta', 403)
      }
    } else {
      // Cliente: permitido solo si tiene una reserva activa en este complejo
      // (accede al catálogo en el contexto de su propia reserva)
      const reservaActiva = await prisma.reserva.findFirst({
        where: {
          email_cliente: usuario.email,
          estado: { in: ['Pendiente', 'Pagada'] },
          cancha: { id_complejo: idComplejo },
        },
      })
      if (!reservaActiva) {
        return errorJson('FORBIDDEN', 'No tenés reservas activas en este complejo', 403)
      }
    }

    const equipamientos = await prisma.equipamiento.findMany({
      where: { id_complejo: idComplejo },
      orderBy: { nombre: 'asc' },
    })

    return Response.json(equipamientos.map(equipamientoToResponse))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /complejos/:id/equipamiento]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idComplejo: idStr } = await params
  const idComplejo = parseInt(idStr)
  if (isNaN(idComplejo)) return errorJson('BAD_REQUEST', 'ID inválido', 400)

  const prisma = getPrisma()
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { clerk_user_id: userId },
      select: { email: true, rol: true },
    })
    if (!usuario) return errorJson('UNAUTHORIZED', 'Usuario no encontrado', 401)
    if (usuario.rol === 'cliente') return errorJson('FORBIDDEN', 'Sin acceso para cliente', 403)

    const complejo = await prisma.complejo.findUnique({ where: { id_complejo: idComplejo } })
    if (!complejo) return errorJson('NOT_FOUND', 'Complejo no encontrado', 404)

    if (usuario.rol === 'admin') {
      if (complejo.email_administrador !== usuario.email) {
        return errorJson('FORBIDDEN', 'No sos el administrador de este complejo', 403)
      }
    } else {
      const auxiliar = await prisma.auxiliar.findUnique({ where: { email: usuario.email } })
      if (!auxiliar || auxiliar.id_complejo !== idComplejo) {
        return errorJson('FORBIDDEN', 'Este complejo no está asignado a tu cuenta', 403)
      }
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return errorJson('BAD_REQUEST', 'Body JSON inválido', 400)
    }

    const { nombre, precio, stock } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return errorJson('VALIDATION_ERROR', 'El nombre es requerido', 400)
    }
    const precioNum = Number(precio)
    if (precio === undefined || precio === null || isNaN(precioNum) || precioNum < 0) {
      return errorJson('VALIDATION_ERROR', 'El precio debe ser un número >= 0', 400)
    }
    const stockNum = Number(stock)
    if (stock === undefined || stock === null || !Number.isInteger(stockNum) || stockNum < 0) {
      return errorJson('VALIDATION_ERROR', 'El stock debe ser un entero >= 0', 400)
    }

    const creado = await prisma.equipamiento.create({
      data: {
        nombre: nombre.trim(),
        precio: precioNum,
        stock: stockNum,
        stock_disponible: stockNum,
        id_complejo: idComplejo,
      },
    })

    return Response.json(equipamientoToResponse(creado), {
      status: 201,
      headers: { Location: `/api/v1/equipamiento/${creado.id_equipamiento}` },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /complejos/:id/equipamiento]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}
