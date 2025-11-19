import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai';
import { DomainManagerService } from '../services/domainManager';
import { DatabaseService } from '../services/database';

export function createAIRouter(
  manager: DomainManagerService,
  db: DatabaseService
): Router {
  const router = Router();

  const getAIService = (): AIService | null => {
    const geminiCreds = db.getCredentials('gemini');
    if (!geminiCreds) return null;
    const { apiKey } = JSON.parse(geminiCreds);
    return new AIService(apiKey);
  };

  // Process natural language command
  router.post('/command', async (req: Request, res: Response) => {
    try {
      const { input } = req.body;
      if (!input) {
        return res.status(400).json({
          success: false,
          error: 'Input is required',
        });
      }

      const ai = getAIService();
      if (!ai) {
        return res.status(400).json({
          success: false,
          error: 'Gemini API key not configured',
        });
      }

      const parsed = await ai.parseCommand(input);

      if (!parsed.command) {
        db.addCommandHistory(input, null, { message: parsed.message });
        return res.json({
          success: true,
          data: {
            message: parsed.message,
            needsMoreInfo: true,
          },
        });
      }

      // Execute the command
      let result: unknown;
      const cmd = parsed.command;

      try {
        switch (cmd.action) {
          case 'list':
            if (cmd.domain) {
              // List records for a specific domain
              const provider = cmd.provider || 'all';
              if (provider === 'all') {
                // Try to find the domain in any provider
                const allDomains = await manager.listAllDomains();
                const domain = allDomains.find(
                  (d) => d.name === cmd.domain || d.id === cmd.domain
                );
                if (domain) {
                  result = await manager.listRecords(
                    domain.provider,
                    domain.provider === 'cloudflare' ? domain.id : domain.name
                  );
                } else {
                  throw new Error(`Domain ${cmd.domain} not found`);
                }
              } else {
                const domains = await manager.listDomains(provider as 'cloudflare' | 'porkbun');
                const domain = domains.find(
                  (d) => d.name === cmd.domain || d.id === cmd.domain
                );
                if (domain) {
                  result = await manager.listRecords(
                    provider as 'cloudflare' | 'porkbun',
                    provider === 'cloudflare' ? domain.id : domain.name
                  );
                } else {
                  throw new Error(`Domain ${cmd.domain} not found in ${provider}`);
                }
              }
            } else {
              // List domains
              if (cmd.provider === 'all' || !cmd.provider) {
                result = await manager.listAllDomains();
              } else {
                result = await manager.listDomains(cmd.provider as 'cloudflare' | 'porkbun');
              }
            }
            break;

          case 'create':
            if (!cmd.domain || !cmd.recordType || !cmd.recordContent) {
              throw new Error('Domain, record type, and content are required');
            }
            {
              const allDomains = await manager.listAllDomains();
              const targetDomain = allDomains.find((d) =>
                cmd.domain && (d.name === cmd.domain || cmd.recordName?.endsWith(d.name))
              );

              if (!targetDomain) {
                throw new Error(`Domain not found for ${cmd.domain}`);
              }

              result = await manager.createRecord(
                targetDomain.provider,
                targetDomain.provider === 'cloudflare' ? targetDomain.id : targetDomain.name,
                {
                  type: cmd.recordType,
                  name: cmd.recordName || cmd.domain,
                  content: cmd.recordContent,
                  ttl: cmd.ttl,
                  priority: cmd.priority,
                  proxied: cmd.proxied,
                }
              );
            }
            break;

          case 'delete':
            if (!cmd.domain) {
              throw new Error('Domain is required');
            }
            {
              const allDomains = await manager.listAllDomains();
              const targetDomain = allDomains.find((d) =>
                d.name === cmd.domain || cmd.recordName?.endsWith(d.name)
              );

              if (!targetDomain) {
                throw new Error(`Domain not found for ${cmd.domain}`);
              }

              // Find the record to delete
              const records = await manager.listRecords(
                targetDomain.provider,
                targetDomain.provider === 'cloudflare' ? targetDomain.id : targetDomain.name
              );

              let recordToDelete;
              if (cmd.recordId) {
                recordToDelete = records.find((r) => r.id === cmd.recordId);
              } else if (cmd.recordName && cmd.recordType) {
                recordToDelete = records.find(
                  (r) => r.name === cmd.recordName && r.type === cmd.recordType
                );
              } else if (cmd.recordName) {
                recordToDelete = records.find((r) => r.name === cmd.recordName);
              }

              if (!recordToDelete) {
                throw new Error('Record not found');
              }

              result = await manager.deleteRecord(
                targetDomain.provider,
                targetDomain.provider === 'cloudflare' ? targetDomain.id : targetDomain.name,
                recordToDelete.id
              );
            }
            break;

          case 'update':
            if (!cmd.domain || !cmd.recordId) {
              throw new Error('Domain and record ID are required');
            }
            {
              const allDomains = await manager.listAllDomains();
              const targetDomain = allDomains.find((d) => d.name === cmd.domain);

              if (!targetDomain) {
                throw new Error(`Domain ${cmd.domain} not found`);
              }

              result = await manager.updateRecord(
                targetDomain.provider,
                targetDomain.provider === 'cloudflare' ? targetDomain.id : targetDomain.name,
                cmd.recordId,
                {
                  type: cmd.recordType,
                  name: cmd.recordName,
                  content: cmd.recordContent,
                  ttl: cmd.ttl,
                  priority: cmd.priority,
                  proxied: cmd.proxied,
                }
              );
            }
            break;

          case 'search':
          case 'info':
            // For now, treat these as list operations
            if (cmd.domain) {
              const allDomains = await manager.listAllDomains();
              const domain = allDomains.find(
                (d) => d.name === cmd.domain || d.id === cmd.domain
              );
              if (domain) {
                const records = await manager.listRecords(
                  domain.provider,
                  domain.provider === 'cloudflare' ? domain.id : domain.name
                );
                result = { domain, records };
              } else {
                throw new Error(`Domain ${cmd.domain} not found`);
              }
            } else {
              result = await manager.listAllDomains();
            }
            break;

          default:
            throw new Error(`Unknown action: ${cmd.action}`);
        }

        db.addCommandHistory(input, cmd, { result });

        res.json({
          success: true,
          data: {
            message: parsed.message,
            command: cmd,
            result,
          },
        });
      } catch (execError) {
        db.addCommandHistory(input, cmd, {
          error: execError instanceof Error ? execError.message : 'Unknown error',
        });
        throw execError;
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get suggestions for a domain
  router.post('/suggest', async (req: Request, res: Response) => {
    try {
      const { domain, purpose } = req.body;
      if (!domain || !purpose) {
        return res.status(400).json({
          success: false,
          error: 'Domain and purpose are required',
        });
      }

      const ai = getAIService();
      if (!ai) {
        return res.status(400).json({
          success: false,
          error: 'Gemini API key not configured',
        });
      }

      const suggestions = await ai.suggestRecords(domain, purpose);
      res.json({ success: true, data: suggestions });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get command history
  router.get('/history', (_req: Request, res: Response) => {
    try {
      const history = db.getCommandHistory();
      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
