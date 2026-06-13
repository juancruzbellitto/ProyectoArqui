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

type Params = { idResena: string }

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { userId } = await auth()
  if (!userId) return errorJson('UNAUTHORIZED', 'No autenticado', 401)

  const { idResena: idStr } = await params
  const idResena = parseInt(idStr)
  if (isNaN(idResena)) return errorJson('BAD_REQUEST', 'ID de reseña inválido', 400)

  const prisma = getPrisma()
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { clerk_user_id: userId },
      select: { email: true, rol: true },
    })
    if (!usuario) return errorJson('UNAUTHORIZED', 'Usuario no encontrado', 401)

    const resena = await prisma.resenia.findUnique({ where: { id_resenia: idResena } })
    if (!resena) return errorJson('NOT_FOUND', 'Reseña no encontrada', 404)

    if (resena.email_cliente !== usuario.email) {
      return errorJson('FORBIDDEN', 'Solo podés eliminar tus propias reseñas', 403)
    }

    await prisma.resenia.delete({ where: { id_resenia: idResena } })

    return new Response(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[DELETE /resenas/:id]', msg)
    return errorJson('INTERNAL_ERROR', 'Error interno del servidor', 500, msg)
  } finally {
    await prisma.$disconnect()
  }
}
