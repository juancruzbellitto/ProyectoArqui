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

function formatDate(val: Date | string | unknown): string {
  if (val instanceof Date) return val.toISOString().substring(0, 10)
  return String(val).substring(0, 10)
}

function formatTime(val: Date | string | unknown): string {
  if (val instanceof Date) return val.toISOString().substring(11, 16)
  return String(val).substring(0, 5)
}

function esActivaYFutura(estado: string, fecha: unknown, hora: unknown): boolean {
  if (estado !== 'Pendiente' && estado !== 'Pagada') return false
  const fechaStr = formatDate(fecha)
  const horaStr = formatTime(hora)
  const fechaHora = new Date(`${fechaStr}T${horaStr}:00.000Z`)
  return fechaHora > new Date()
}

type Params = { idReserva: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idReserva: idStr } = await params
  const idReserva = parseInt(idStr)
  if (isNaN(idReserva)) return errorJson('BAD_REQUEST', 'ID de reserva inválido', 400)

  const prisma = getPrisma()
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { clerk_user_id: userId },
      select: { email: true, rol: true },
    })
    if (!usuario) return errorJson('UNAUTHORIZED', 'Usuario no encontrado', 401)
    if (usuario.rol === 'admin') return errorJson('FORBIDDEN', 'Sin acceso para admin', 403)

    const reserva = await prisma.reserva.findUnique({ where: { id_reserva: idReserva } })
    if (!reserva) return errorJson('NOT_FOUND', 'Reserva no encontrada', 404)

    if (usuario.rol === 'cliente') {
      if (reserva.email_cliente !== usuario.email) {
        return errorJson('FORBIDDEN', 'No tenés acceso a esta reserva', 403)
      }
    } else {
      const auxiliar = await prisma.auxiliar.findUnique({ where: { email: usuario.email } })
      if (!auxiliar) return errorJson('FORBIDDEN', 'Auxiliar no encontrado', 403)
      const cancha = await prisma.cancha.findUnique({ where: { id_cancha: reserva.id_cancha } })
      if (!cancha || cancha.id_complejo !== auxiliar.id_complejo) {
        return errorJson('FORBIDDEN', 'No tenés acceso a esta reserva', 403)
      }
    }

    const items = await prisma.reservaEquipamiento.findMany({
      where: { id_reserva: idReserva },
      include: { equipamiento: true },
    })

    const respuesta = items.map((item) => ({
      idEquipamiento: item.id_equipamiento,
      nombre: item.equipamiento.nombre,
      precio: Number(item.equipamiento.precio),
      cantidad: item.cantidad,
      stockDisponible: item.equipamiento.stock_disponible,
    }))

    return Response.json(respuesta)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /reservas/:id/equipamiento]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idReserva: idStr } = await params
  const idReserva = parseInt(idStr)
  if (isNaN(idReserva)) return errorJson('BAD_REQUEST', 'ID de reserva inválido', 400)

  const prisma = getPrisma()
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { clerk_user_id: userId },
      select: { email: true, rol: true },
    })
    if (!usuario) return errorJson('UNAUTHORIZED', 'Usuario no encontrado', 401)
    if (usuario.rol === 'admin') return errorJson('FORBIDDEN', 'Sin acceso para admin', 403)

    const reserva = await prisma.reserva.findUnique({ where: { id_reserva: idReserva } })
    if (!reserva) return errorJson('NOT_FOUND', 'Reserva no encontrada', 404)

    if (usuario.rol === 'cliente') {
      if (reserva.email_cliente !== usuario.email) {
        return errorJson('FORBIDDEN', 'No tenés acceso a esta reserva', 403)
      }
    } else {
      const auxiliar = await prisma.auxiliar.findUnique({ where: { email: usuario.email } })
      if (!auxiliar) return errorJson('FORBIDDEN', 'Auxiliar no encontrado', 403)
      const cancha = await prisma.cancha.findUnique({ where: { id_cancha: reserva.id_cancha } })
      if (!cancha || cancha.id_complejo !== auxiliar.id_complejo) {
        return errorJson('FORBIDDEN', 'No tenés acceso a esta reserva', 403)
      }
    }

    // Validar reserva activa y futura
    if (!esActivaYFutura(reserva.estado, reserva.fecha, reserva.hora)) {
      return errorJson(
        'UNPROCESSABLE_ENTITY',
        'Solo se puede agregar equipamiento a reservas activas que todavía no comenzaron',
        422
      )
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return errorJson('BAD_REQUEST', 'Body JSON inválido', 400)
    }

    const { idEquipamiento, cantidad } = body

    if (!idEquipamiento || typeof idEquipamiento !== 'number' || !Number.isInteger(idEquipamiento)) {
      return errorJson('VALIDATION_ERROR', 'idEquipamiento es requerido', 400)
    }
    const cantidadNum = Number(cantidad)
    if (!cantidad || !Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      return errorJson('VALIDATION_ERROR', 'cantidad debe ser un entero positivo', 400)
    }

    // Verificar que el equipamiento pertenece al complejo de la cancha de la reserva
    const cancha = await prisma.cancha.findUnique({ where: { id_cancha: reserva.id_cancha } })
    if (!cancha) return errorJson('NOT_FOUND', 'Cancha de la reserva no encontrada', 404)

    const equip = await prisma.equipamiento.findUnique({ where: { id_equipamiento: idEquipamiento } })
    if (!equip) return errorJson('NOT_FOUND', 'Equipamiento no encontrado', 404)

    if (equip.id_complejo !== cancha.id_complejo) {
      return errorJson('VALIDATION_ERROR', 'El equipamiento no pertenece al complejo de esta reserva', 422)
    }

    // Verificar stock disponible
    if (equip.stock_disponible < cantidadNum) {
      return errorJson(
        'UNPROCESSABLE_ENTITY',
        `Stock insuficiente. Disponible: ${equip.stock_disponible}, solicitado: ${cantidadNum}`,
        422
      )
    }

    // Decisión: si ya existe el item, sumar la cantidad; ajustar stock en la misma transacción
    const existente = await prisma.reservaEquipamiento.findUnique({
      where: {
        id_reserva_id_equipamiento: { id_reserva: idReserva, id_equipamiento: idEquipamiento },
      },
    })

    await prisma.$transaction(async (tx) => {
      if (existente) {
        await tx.reservaEquipamiento.update({
          where: {
            id_reserva_id_equipamiento: { id_reserva: idReserva, id_equipamiento: idEquipamiento },
          },
          data: { cantidad: { increment: cantidadNum } },
        })
      } else {
        await tx.reservaEquipamiento.create({
          data: { id_reserva: idReserva, id_equipamiento: idEquipamiento, cantidad: cantidadNum },
        })
      }
      await tx.equipamiento.update({
        where: { id_equipamiento: idEquipamiento },
        data: { stock_disponible: { decrement: cantidadNum } },
      })
    })

    const updatedRE = await prisma.reservaEquipamiento.findUnique({
      where: {
        id_reserva_id_equipamiento: { id_reserva: idReserva, id_equipamiento: idEquipamiento },
      },
      include: { equipamiento: true },
    })

    return Response.json(
      {
        idEquipamiento,
        nombre: updatedRE!.equipamiento.nombre,
        precio: Number(updatedRE!.equipamiento.precio),
        cantidad: updatedRE!.cantidad,
        stockDisponible: updatedRE!.equipamiento.stock_disponible,
      },
      { status: 201 }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /reservas/:id/equipamiento]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}
