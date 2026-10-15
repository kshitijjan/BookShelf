import { handleApiRequest } from '../src/server/apiHandler';

export default async function handler(req: any, res: any) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Endpoint not found', url: req.url }));
    }
  } catch (err: any) {
    console.error('[VercelAPI] Unhandled error in api/index.ts:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Internal server error', details: err?.message }));
  }
}
