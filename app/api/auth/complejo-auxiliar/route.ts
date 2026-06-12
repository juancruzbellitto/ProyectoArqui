import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    return Response.json({ error: 'DATABASE_URL no configurado' }, { status: 500 })
  }

  const adapter = new PrismaPg(url)
  const prisma = new PrismaClient({ adapter })

  try {
    const auxiliar = await prisma.auxiliar.findFirst({
      where: { usuario: { clerk_user_id: userId } },
      select: { id_complejo: true },
    })
    return Response.json({ id_complejo: auxiliar?.id_complejo ?? null })
  } finally {
    await prisma.$disconnect()
  }
}
