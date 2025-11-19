import axios, { AxiosInstance } from 'axios';
import {
  CloudflareZone,
  CloudflareDNSRecord,
  Domain,
  DNSRecord,
  CreateRecordInput,
  UpdateRecordInput,
} from '../types';

export class CloudflareService {
  private client: AxiosInstance;
  private accountId?: string;

  constructor(apiToken: string, accountId?: string) {
    this.accountId = accountId;
    this.client = axios.create({
      baseURL: 'https://api.cloudflare.com/client/v4',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async listZones(): Promise<Domain[]> {
    const response = await this.client.get<{
      result: CloudflareZone[];
      success: boolean;
      errors: unknown[];
    }>('/zones');

    if (!response.data.success) {
      throw new Error('Failed to fetch Cloudflare zones');
    }

    return response.data.result.map((zone) => ({
      id: zone.id,
      name: zone.name,
      provider: 'cloudflare' as const,
      status: zone.status,
      nameservers: zone.name_servers,
    }));
  }

  async getZone(zoneId: string): Promise<Domain> {
    const response = await this.client.get<{
      result: CloudflareZone;
      success: boolean;
      errors: unknown[];
    }>(`/zones/${zoneId}`);

    if (!response.data.success) {
      throw new Error('Failed to fetch Cloudflare zone');
    }

    const zone = response.data.result;
    return {
      id: zone.id,
      name: zone.name,
      provider: 'cloudflare',
      status: zone.status,
      nameservers: zone.name_servers,
    };
  }

  async listRecords(zoneId: string): Promise<DNSRecord[]> {
    const response = await this.client.get<{
      result: CloudflareDNSRecord[];
      success: boolean;
      errors: unknown[];
    }>(`/zones/${zoneId}/dns_records`);

    if (!response.data.success) {
      throw new Error('Failed to fetch DNS records');
    }

    return response.data.result.map((record) => ({
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      priority: record.priority,
      proxied: record.proxied,
      provider: 'cloudflare' as const,
      zoneId: record.zone_id,
      zoneName: record.zone_name,
    }));
  }

  async createRecord(zoneId: string, input: CreateRecordInput): Promise<DNSRecord> {
    const response = await this.client.post<{
      result: CloudflareDNSRecord;
      success: boolean;
      errors: unknown[];
    }>(`/zones/${zoneId}/dns_records`, {
      type: input.type,
      name: input.name,
      content: input.content,
      ttl: input.ttl || 1,
      priority: input.priority,
      proxied: input.proxied ?? false,
    });

    if (!response.data.success) {
      throw new Error('Failed to create DNS record');
    }

    const record = response.data.result;
    return {
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      priority: record.priority,
      proxied: record.proxied,
      provider: 'cloudflare',
      zoneId: record.zone_id,
      zoneName: record.zone_name,
    };
  }

  async updateRecord(
    zoneId: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<DNSRecord> {
    // First get the existing record
    const existingResponse = await this.client.get<{
      result: CloudflareDNSRecord;
      success: boolean;
    }>(`/zones/${zoneId}/dns_records/${recordId}`);

    if (!existingResponse.data.success) {
      throw new Error('Failed to fetch existing record');
    }

    const existing = existingResponse.data.result;

    const response = await this.client.put<{
      result: CloudflareDNSRecord;
      success: boolean;
      errors: unknown[];
    }>(`/zones/${zoneId}/dns_records/${recordId}`, {
      type: input.type || existing.type,
      name: input.name || existing.name,
      content: input.content || existing.content,
      ttl: input.ttl || existing.ttl,
      priority: input.priority ?? existing.priority,
      proxied: input.proxied ?? existing.proxied,
    });

    if (!response.data.success) {
      throw new Error('Failed to update DNS record');
    }

    const record = response.data.result;
    return {
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      priority: record.priority,
      proxied: record.proxied,
      provider: 'cloudflare',
      zoneId: record.zone_id,
      zoneName: record.zone_name,
    };
  }

  async deleteRecord(zoneId: string, recordId: string): Promise<boolean> {
    const response = await this.client.delete<{
      result: { id: string };
      success: boolean;
      errors: unknown[];
    }>(`/zones/${zoneId}/dns_records/${recordId}`);

    return response.data.success;
  }

  async verifyToken(): Promise<boolean> {
    try {
      const response = await this.client.get<{
        success: boolean;
        errors: unknown[];
      }>('/user/tokens/verify');
      return response.data.success;
    } catch {
      return false;
    }
  }
}
