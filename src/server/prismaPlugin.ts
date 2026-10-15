import { Plugin } from 'vite';
import { handleApiRequest, serializedDailyCache, getPrisma } from './apiHandler';
import {
  initMidnightCatalogScheduler,
  setCatalogRefreshedCallback,
} from './dailyBooksService';

export function prismaApiPlugin(): Plugin {
  return {
    name: 'prisma-api-plugin',
    configureServer(server) {
      // Connect cache invalidation when catalog refreshes
      setCatalogRefreshedCallback((dateKey: string) => {
        serializedDailyCache.delete(dateKey);
        console.log(`[PrismaPlugin] Serialized cache invalidated for ${dateKey}`);
      });

      // Initialize midnight scheduler on dev server boot
      try {
        initMidnightCatalogScheduler(getPrisma());
      } catch (err) {
        console.error('[PrismaPlugin] Failed to initialize midnight catalog scheduler:', err);
      }

      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          const handled = await handleApiRequest(req, res);
          if (!handled) {
            next();
          }
        } catch (err) {
          console.error('[PrismaPlugin] Request handler error:', err);
          next(err);
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          const handled = await handleApiRequest(req, res);
          if (!handled) {
            next();
          }
        } catch (err) {
          next(err);
        }
      });
    },
  };
}
