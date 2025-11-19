import axios, { AxiosInstance } from 'axios';
import {
  PorkbunDomain,
  PorkbunDNSRecord,
  Domain,
  DNSRecord,
  CreateRecordInput,
  UpdateRecordInput,
} from '../types';

export class PorkbunService {
  private client: AxiosInstance;
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.client = axios.create({
      baseURL: 'https://porkbun.com/api/json/v3',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getAuthBody() {
    return {
      apikey: this.apiKey,
      secretapikey: this.secretKey,
    };
  }

  async listDomains(): Promise<Domain[]> {
    const response = await this.client.post<{
      status: string;
      domains: PorkbunDomain[];
    }>('/domain/listAll', this.getAuthBody());

    if (response.data.status !== 'SUCCESS') {
      throw new Error('Failed to fetch Porkbun domains');
    }

    return (response.data.domains || []).map((domain) => ({
      id: domain.domain,
      name: domain.domain,
      provider: 'porkbun' as const,
      status: domain.status,
      expiresAt: domain.expireDate,
      autoRenew: domain.autoRenew === 1,
    }));
  }

  async listRecords(domain: string): Promise<DNSRecord[]> {
    const response = await this.client.post<{
      status: string;
      records: PorkbunDNSRecord[];
    }>(`/dns/retrieve/${domain}`, this.getAuthBody());

    if (response.data.status !== 'SUCCESS') {
      throw new Error('Failed to fetch DNS records');
    }

    return (response.data.records || []).map((record) => ({
      id: record.id,
      type: record.type,
      name: record.name ? `${record.name}.${domain}` : domain,
      content: record.content,
      ttl: parseInt(record.ttl, 10),
      priority: record.prio ? parseInt(record.prio, 10) : undefined,
      provider: 'porkbun' as const,
      zoneName: domain,
    }));
  }

  async createRecord(domain: string, input: CreateRecordInput): Promise<DNSRecord> {
    // Extract subdomain from full name
    let subdomain = input.name;
    if (input.name.endsWith(`.${domain}`)) {
      subdomain = input.name.replace(`.${domain}`, '');
    } else if (input.name === domain) {
      subdomain = '';
    }

    const response = await this.client.post<{
      status: string;
      id: number;
    }>(`/dns/create/${domain}`, {
      ...this.getAuthBody(),
      type: input.type,
      name: subdomain,
      content: input.content,
      ttl: input.ttl?.toString() || '600',
      prio: input.priority?.toString(),
    });

    if (response.data.status !== 'SUCCESS') {
      throw new Error('Failed to create DNS record');
    }

    return {
      id: response.data.id.toString(),
      type: input.type,
      name: subdomain ? `${subdomain}.${domain}` : domain,
      content: input.content,
      ttl: input.ttl || 600,
      priority: input.priority,
      provider: 'porkbun',
      zoneName: domain,
    };
  }

  async updateRecord(
    domain: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<DNSRecord> {
    // First get the existing record to merge with updates
    const records = await this.listRecords(domain);
    const existing = records.find((r) => r.id === recordId);

    if (!existing) {
      throw new Error('Record not found');
    }

    // Extract subdomain from name
    let subdomain = input.name || existing.name;
    if (subdomain.endsWith(`.${domain}`)) {
      subdomain = subdomain.replace(`.${domain}`, '');
    } else if (subdomain === domain) {
      subdomain = '';
    }

    const response = await this.client.post<{
      status: string;
    }>(`/dns/edit/${domain}/${recordId}`, {
      ...this.getAuthBody(),
      type: input.type || existing.type,
      name: subdomain,
      content: input.content || existing.content,
      ttl: (input.ttl || existing.ttl).toString(),
      prio: (input.priority ?? existing.priority)?.toString(),
    });

    if (response.data.status !== 'SUCCESS') {
      throw new Error('Failed to update DNS record');
    }

    return {
      id: recordId,
      type: input.type || existing.type,
      name: subdomain ? `${subdomain}.${domain}` : domain,
      content: input.content || existing.content,
      ttl: input.ttl || existing.ttl,
      priority: input.priority ?? existing.priority,
      provider: 'porkbun',
      zoneName: domain,
    };
  }

  async deleteRecord(domain: string, recordId: string): Promise<boolean> {
    const response = await this.client.post<{
      status: string;
    }>(`/dns/delete/${domain}/${recordId}`, this.getAuthBody());

    return response.data.status === 'SUCCESS';
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.client.post<{
        status: string;
      }>('/ping', this.getAuthBody());
      return response.data.status === 'SUCCESS';
    } catch {
      return false;
    }
  }
}
