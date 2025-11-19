import { Router, Request, Response } from 'express';
import { DomainManagerService } from '../services/domainManager';
import { DatabaseService } from '../services/database';

export function createSettingsRouter(
  manager: DomainManagerService,
  db: DatabaseService
): Router {
  const router = Router();

  // Get all credentials status
  router.get('/credentials', (_req: Request, res: Response) => {
    try {
      const credentials = db.getAllCredentials();
      const providers = manager.getConfiguredProviders();
      res.json({
        success: true,
        data: {
          credentials,
          configuredProviders: providers,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Set Cloudflare credentials
  router.post('/credentials/cloudflare', async (req: Request, res: Response) => {
    try {
      const { apiToken, accountId } = req.body;
      if (!apiToken) {
        return res.status(400).json({
          success: false,
          error: 'API token is required',
        });
      }

      manager.setCloudflareCredentials(apiToken, accountId);

      // Verify the credentials
      const valid = await manager.verifyCloudflare();
      if (!valid) {
        manager.removeCloudflareCredentials();
        return res.status(400).json({
          success: false,
          error: 'Invalid Cloudflare credentials',
        });
      }

      res.json({ success: true, message: 'Cloudflare credentials saved' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Set Porkbun credentials
  router.post('/credentials/porkbun', async (req: Request, res: Response) => {
    try {
      const { apiKey, secretKey } = req.body;
      if (!apiKey || !secretKey) {
        return res.status(400).json({
          success: false,
          error: 'API key and secret key are required',
        });
      }

      manager.setPorkbunCredentials(apiKey, secretKey);

      // Verify the credentials
      const valid = await manager.verifyPorkbun();
      if (!valid) {
        manager.removePorkbunCredentials();
        return res.status(400).json({
          success: false,
          error: 'Invalid Porkbun credentials',
        });
      }

      res.json({ success: true, message: 'Porkbun credentials saved' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Set Gemini API key
  router.post('/credentials/gemini', (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required',
        });
      }

      db.setCredentials('gemini', { apiKey });
      res.json({ success: true, message: 'Gemini API key saved' });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Delete credentials
  router.delete('/credentials/:provider', (req: Request, res: Response) => {
    try {
      const { provider } = req.params;

      if (provider === 'cloudflare') {
        manager.removeCloudflareCredentials();
      } else if (provider === 'porkbun') {
        manager.removePorkbunCredentials();
      } else if (provider === 'gemini') {
        db.deleteCredentials('gemini');
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid provider',
        });
      }

      res.json({ success: true, message: `${provider} credentials removed` });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Verify credentials
  router.post('/credentials/:provider/verify', async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      let valid = false;

      if (provider === 'cloudflare') {
        valid = await manager.verifyCloudflare();
      } else if (provider === 'porkbun') {
        valid = await manager.verifyPorkbun();
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid provider',
        });
      }

      res.json({ success: true, valid });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
