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

type Params = { idEquipamiento: string }

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idEquipamiento: idStr } = await params
  const idEquipamiento = parseInt(idStr)
  if (isNaN(idEquipamiento)) return errorJson('BAD_REQUEST', 'ID inválido', 400)

  const prisma = getPrisma()
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { clerk_user_id: userId },
      select: { email: true, rol: true },
    })
    if (!usuario) return errorJson('UNAUTHORIZED', 'Usuario no encontrado', 401)
    if (usuario.rol === 'cliente') return errorJson('FORBIDDEN', 'Sin acceso para cliente', 403)

    const equip = await prisma.equipamiento.findUnique({ where: { id_equipamiento: idEquipamiento } })
    if (!equip) return errorJson('NOT_FOUND', 'Equipamiento no encontrado', 404)

    if (usuario.rol === 'admin') {
      const complejo = await prisma.complejo.findUnique({ where: { id_complejo: equip.id_complejo } })
      if (!complejo || complejo.email_administrador !== usuario.email) {
        return errorJson('FORBIDDEN', 'No sos el administrador de este complejo', 403)
      }
    } else {
      const auxiliar = await prisma.auxiliar.findUnique({ where: { email: usuario.email } })
      if (!auxiliar || auxiliar.id_complejo !== equip.id_complejo) {
        return errorJson('FORBIDDEN', 'No tenés permiso para modificar este equipamiento', 403)
      }
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return errorJson('BAD_REQUEST', 'Body JSON inválido', 400)
    }

    const { nombre, precio, stock } = body
    type UpdateData = { nombre?: string; precio?: number; stock?: number; stock_disponible?: number }
    const data: UpdateData = {}

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || !nombre.trim()) {
        return errorJson('VALIDATION_ERROR', 'El nombre no puede estar vacío', 400)
      }
      data.nombre = nombre.trim()
    }

    if (precio !== undefined) {
      const precioNum = Number(precio)
      if (isNaN(precioNum) || precioNum < 0) {
        return errorJson('VALIDATION_ERROR', 'El precio debe ser mayor o igual a 0', 400)
      }
      data.precio = precioNum
    }

    if (stock !== undefined) {
      const stockNuevo = Number(stock)
      if (!Number.isInteger(stockNuevo) || stockNuevo < 0) {
        return errorJson('VALIDATION_ERROR', 'El stock debe ser un entero >= 0', 400)
      }
      // stock_disponible_nuevo = stock_nuevo - unidades_comprometidas
      const comprometido = equip.stock - equip.stock_disponible
      const stockDisponibleNuevo = stockNuevo - comprometido
      if (stockDisponibleNuevo < 0) {
        return errorJson(
          'UNPROCESSABLE_ENTITY',
          `No se puede reducir el stock a ${stockNuevo}: hay ${comprometido} unidades comprometidas en reservas activas`,
          422
        )
      }
      data.stock = stockNuevo
      data.stock_disponible = stockDisponibleNuevo
    }

    if (Object.keys(data).length === 0) {
      return errorJson('BAD_REQUEST', 'No se enviaron campos a modificar', 400)
    }

    const actualizado = await prisma.equipamiento.update({
      where: { id_equipamiento: idEquipamiento },
      data,
    })

    return Response.json(equipamientoToResponse(actualizado))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PATCH /equipamiento/:id]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idEquipamiento: idStr } = await params
  const idEquipamiento = parseInt(idStr)
  if (isNaN(idEquipamiento)) return errorJson('BAD_REQUEST', 'ID inválido', 400)

  const prisma = getPrisma()
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { clerk_user_id: userId },
      select: { email: true, rol: true },
    })
    if (!usuario) return errorJson('UNAUTHORIZED', 'Usuario no encontrado', 401)
    if (usuario.rol === 'cliente') return errorJson('FORBIDDEN', 'Sin acceso para cliente', 403)

    const equip = await prisma.equipamiento.findUnique({ where: { id_equipamiento: idEquipamiento } })
    if (!equip) return errorJson('NOT_FOUND', 'Equipamiento no encontrado', 404)

    if (usuario.rol === 'admin') {
      const complejo = await prisma.complejo.findUnique({ where: { id_complejo: equip.id_complejo } })
      if (!complejo || complejo.email_administrador !== usuario.email) {
        return errorJson('FORBIDDEN', 'No sos el administrador de este complejo', 403)
      }
    } else {
      const auxiliar = await prisma.auxiliar.findUnique({ where: { email: usuario.email } })
      if (!auxiliar || auxiliar.id_complejo !== equip.id_complejo) {
        return errorJson('FORBIDDEN', 'No tenés permiso para eliminar este equipamiento', 403)
      }
    }

    // Bloquear si hay solicitudes en reservas activas (Pendiente/Pagada)
    const solicitudActiva = await prisma.reservaEquipamiento.findFirst({
      where: {
        id_equipamiento: idEquipamiento,
        reserva: { estado: { in: ['Pendiente', 'Pagada'] } },
      },
    })
    if (solicitudActiva) {
      return errorJson(
        'UNPROCESSABLE_ENTITY',
        'No se puede eliminar: hay solicitudes activas de este equipamiento en reservas pendientes o pagadas',
        422
      )
    }

    // Bloquear también si hay historial en reservas pasadas (integridad referencial)
    const tieneHistorial = await prisma.reservaEquipamiento.findFirst({
      where: { id_equipamiento: idEquipamiento },
    })
    if (tieneHistorial) {
      return errorJson(
        'UNPROCESSABLE_ENTITY',
        'No se puede eliminar: el equipamiento tiene historial de uso en reservas anteriores',
        422
      )
    }

    await prisma.equipamiento.delete({ where: { id_equipamiento: idEquipamiento } })

    return new Response(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[DELETE /equipamiento/:id]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}
