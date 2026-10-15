export default async function handler(req: any, res: any) {
  const diagnostics: Record<string, any> = {
    step: 'start',
    nodeVersion: process.version,
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DATABASE_URL_UNPOOLED,
      dbUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : null,
    },
  };

  try {
    diagnostics.step = 'importing_prisma';
    const prismaModule = await import('@prisma/client');
    diagnostics.step = 'instantiating_client';
    const { PrismaClient } = prismaModule;
    const prisma = new PrismaClient();

    diagnostics.step = 'connecting_db';
    const count = await prisma.readingCircle.count();
    diagnostics.step = 'success';
    diagnostics.circleCount = count;

    await prisma.$disconnect();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, diagnostics }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        ok: false,
        diagnostics,
        error: {
          name: err?.name,
          message: err?.message,
          code: err?.code,
          stack: err?.stack,
        },
      })
    );
  }
}
