import { CloudflareService } from './cloudflare';
import { PorkbunService } from './porkbun';
import { DatabaseService } from './database';
import { Domain, DNSRecord, CreateRecordInput, UpdateRecordInput } from '../types';

export class DomainManagerService {
  private cloudflare?: CloudflareService;
  private porkbun?: PorkbunService;
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
    this.loadCredentials();
  }

  private loadCredentials() {
    // Load Cloudflare credentials from database, fallback to env vars
    const cfCreds = this.db.getCredentials('cloudflare');
    if (cfCreds) {
      const { apiToken, accountId } = JSON.parse(cfCreds);
      this.cloudflare = new CloudflareService(apiToken, accountId);
    } else if (process.env.CLOUDFLARE_API_TOKEN) {
      this.cloudflare = new CloudflareService(
        process.env.CLOUDFLARE_API_TOKEN,
        process.env.CLOUDFLARE_ACCOUNT_ID
      );
    }

    // Load Porkbun credentials from database, fallback to env vars
    const pbCreds = this.db.getCredentials('porkbun');
    if (pbCreds) {
      const { apiKey, secretKey } = JSON.parse(pbCreds);
      this.porkbun = new PorkbunService(apiKey, secretKey);
    } else if (process.env.PORKBUN_API_KEY && process.env.PORKBUN_SECRET_KEY) {
      this.porkbun = new PorkbunService(
        process.env.PORKBUN_API_KEY,
        process.env.PORKBUN_SECRET_KEY
      );
    }
  }

  setCloudflareCredentials(apiToken: string, accountId?: string) {
    this.db.setCredentials('cloudflare', { apiToken, accountId });
    this.cloudflare = new CloudflareService(apiToken, accountId);
  }

  setPorkbunCredentials(apiKey: string, secretKey: string) {
    this.db.setCredentials('porkbun', { apiKey, secretKey });
    this.porkbun = new PorkbunService(apiKey, secretKey);
  }

  removeCloudflareCredentials() {
    this.db.deleteCredentials('cloudflare');
    this.cloudflare = undefined;
  }

  removePorkbunCredentials() {
    this.db.deleteCredentials('porkbun');
    this.porkbun = undefined;
  }

  async verifyCloudflare(): Promise<boolean> {
    if (!this.cloudflare) return false;
    return this.cloudflare.verifyToken();
  }

  async verifyPorkbun(): Promise<boolean> {
    if (!this.porkbun) return false;
    return this.porkbun.ping();
  }

  async listAllDomains(): Promise<Domain[]> {
    const domains: Domain[] = [];

    if (this.cloudflare) {
      try {
        const cfDomains = await this.cloudflare.listZones();
        domains.push(...cfDomains);
      } catch (error) {
        console.error('Error fetching Cloudflare domains:', error);
      }
    }

    if (this.porkbun) {
      try {
        const pbDomains = await this.porkbun.listDomains();
        domains.push(...pbDomains);
      } catch (error) {
        console.error('Error fetching Porkbun domains:', error);
      }
    }

    return domains;
  }

  async listDomains(provider: 'cloudflare' | 'porkbun'): Promise<Domain[]> {
    if (provider === 'cloudflare') {
      if (!this.cloudflare) throw new Error('Cloudflare not configured');
      return this.cloudflare.listZones();
    } else {
      if (!this.porkbun) throw new Error('Porkbun not configured');
      return this.porkbun.listDomains();
    }
  }

  async listRecords(
    provider: 'cloudflare' | 'porkbun',
    domainOrZoneId: string
  ): Promise<DNSRecord[]> {
    if (provider === 'cloudflare') {
      if (!this.cloudflare) throw new Error('Cloudflare not configured');
      return this.cloudflare.listRecords(domainOrZoneId);
    } else {
      if (!this.porkbun) throw new Error('Porkbun not configured');
      return this.porkbun.listRecords(domainOrZoneId);
    }
  }

  async createRecord(
    provider: 'cloudflare' | 'porkbun',
    domainOrZoneId: string,
    input: CreateRecordInput
  ): Promise<DNSRecord> {
    if (provider === 'cloudflare') {
      if (!this.cloudflare) throw new Error('Cloudflare not configured');
      return this.cloudflare.createRecord(domainOrZoneId, input);
    } else {
      if (!this.porkbun) throw new Error('Porkbun not configured');
      return this.porkbun.createRecord(domainOrZoneId, input);
    }
  }

  async updateRecord(
    provider: 'cloudflare' | 'porkbun',
    domainOrZoneId: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<DNSRecord> {
    if (provider === 'cloudflare') {
      if (!this.cloudflare) throw new Error('Cloudflare not configured');
      return this.cloudflare.updateRecord(domainOrZoneId, recordId, input);
    } else {
      if (!this.porkbun) throw new Error('Porkbun not configured');
      return this.porkbun.updateRecord(domainOrZoneId, recordId, input);
    }
  }

  async deleteRecord(
    provider: 'cloudflare' | 'porkbun',
    domainOrZoneId: string,
    recordId: string
  ): Promise<boolean> {
    if (provider === 'cloudflare') {
      if (!this.cloudflare) throw new Error('Cloudflare not configured');
      return this.cloudflare.deleteRecord(domainOrZoneId, recordId);
    } else {
      if (!this.porkbun) throw new Error('Porkbun not configured');
      return this.porkbun.deleteRecord(domainOrZoneId, recordId);
    }
  }

  getConfiguredProviders(): string[] {
    const providers: string[] = [];
    if (this.cloudflare) providers.push('cloudflare');
    if (this.porkbun) providers.push('porkbun');
    return providers;
  }
}
