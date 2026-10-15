import { PrismaClient } from '@prisma/client';

export default async function handler(req: any, res: any) {
  try {
    const prisma = new PrismaClient();
    const count = await prisma.readingCircle.count();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', count, dbUrlConfigured: !!process.env.DATABASE_URL }));
    await prisma.$disconnect();
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message, stack: err?.stack, name: err?.name }));
  }
}
