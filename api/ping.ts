export default function handler(req: any, res: any) {
  const envKeys = Object.keys(process.env).filter(
    (k) =>
      k.startsWith('DATA') ||
      k.startsWith('VITE') ||
      k.startsWith('CLERK') ||
      k.startsWith('GEMINI') ||
      k.startsWith('NEON')
  );

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ping: 'pong',
      nodeVersion: process.version,
      availableKeys: envKeys,
      time: new Date().toISOString(),
    })
  );
}
