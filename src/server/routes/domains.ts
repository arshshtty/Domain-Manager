import { Router, Request, Response } from 'express';
import { DomainManagerService } from '../services/domainManager';

export function createDomainsRouter(manager: DomainManagerService): Router {
  const router = Router();

  // List all domains from all providers
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const domains = await manager.listAllDomains();
      res.json({ success: true, data: domains });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List domains from specific provider
  router.get('/:provider', async (req: Request, res: Response) => {
    try {
      const provider = req.params.provider as 'cloudflare' | 'porkbun';
      if (provider !== 'cloudflare' && provider !== 'porkbun') {
        return res.status(400).json({
          success: false,
          error: 'Invalid provider. Must be "cloudflare" or "porkbun"',
        });
      }

      const domains = await manager.listDomains(provider);
      res.json({ success: true, data: domains });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List DNS records for a domain
  router.get('/:provider/:domainId/records', async (req: Request, res: Response) => {
    try {
      const { provider, domainId } = req.params;
      if (provider !== 'cloudflare' && provider !== 'porkbun') {
        return res.status(400).json({
          success: false,
          error: 'Invalid provider',
        });
      }

      const records = await manager.listRecords(provider, domainId);
      res.json({ success: true, data: records });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Create DNS record
  router.post('/:provider/:domainId/records', async (req: Request, res: Response) => {
    try {
      const { provider, domainId } = req.params;
      if (provider !== 'cloudflare' && provider !== 'porkbun') {
        return res.status(400).json({
          success: false,
          error: 'Invalid provider',
        });
      }

      const record = await manager.createRecord(provider, domainId, req.body);
      res.json({ success: true, data: record });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Update DNS record
  router.put(
    '/:provider/:domainId/records/:recordId',
    async (req: Request, res: Response) => {
      try {
        const { provider, domainId, recordId } = req.params;
        if (provider !== 'cloudflare' && provider !== 'porkbun') {
          return res.status(400).json({
            success: false,
            error: 'Invalid provider',
          });
        }

        const record = await manager.updateRecord(
          provider,
          domainId,
          recordId,
          req.body
        );
        res.json({ success: true, data: record });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Delete DNS record
  router.delete(
    '/:provider/:domainId/records/:recordId',
    async (req: Request, res: Response) => {
      try {
        const { provider, domainId, recordId } = req.params;
        if (provider !== 'cloudflare' && provider !== 'porkbun') {
          return res.status(400).json({
            success: false,
            error: 'Invalid provider',
          });
        }

        const success = await manager.deleteRecord(provider, domainId, recordId);
        res.json({ success });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  return router;
}
