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

type Params = { idReserva: string; idEquipamiento: string }

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idReserva: idResStr, idEquipamiento: idEquipStr } = await params
  const idReserva = parseInt(idResStr)
  const idEquipamiento = parseInt(idEquipStr)

  if (isNaN(idReserva) || isNaN(idEquipamiento)) {
    return errorJson('BAD_REQUEST', 'IDs inválidos', 400)
  }

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
        'Solo se puede quitar equipamiento de reservas activas que todavía no comenzaron',
        422
      )
    }

    const re = await prisma.reservaEquipamiento.findUnique({
      where: {
        id_reserva_id_equipamiento: { id_reserva: idReserva, id_equipamiento: idEquipamiento },
      },
    })
    if (!re) return errorJson('NOT_FOUND', 'Ese equipamiento no está en la reserva', 404)

    // Eliminar y devolver stock en la misma transacción
    await prisma.$transaction(async (tx) => {
      await tx.reservaEquipamiento.delete({
        where: {
          id_reserva_id_equipamiento: { id_reserva: idReserva, id_equipamiento: idEquipamiento },
        },
      })
      await tx.equipamiento.update({
        where: { id_equipamiento: idEquipamiento },
        data: { stock_disponible: { increment: re.cantidad } },
      })
    })

    return new Response(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[DELETE /reservas/:id/equipamiento/:idEquip]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}
