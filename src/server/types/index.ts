export interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied?: boolean;
  provider: 'cloudflare' | 'porkbun';
  zoneId?: string;
  zoneName?: string;
}

export interface Domain {
  id: string;
  name: string;
  provider: 'cloudflare' | 'porkbun';
  status: string;
  expiresAt?: string;
  autoRenew?: boolean;
  nameservers?: string[];
  records?: DNSRecord[];
}

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  name_servers: string[];
}

export interface CloudflareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  zone_id: string;
  zone_name: string;
}

export interface PorkbunDomain {
  domain: string;
  status: string;
  tld: string;
  createDate: string;
  expireDate: string;
  securityLock: string;
  whoisPrivacy: string;
  autoRenew: number;
  notLocal: number;
}

export interface PorkbunDNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: string;
  prio?: string;
  notes?: string;
}

export interface CreateRecordInput {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

export interface UpdateRecordInput {
  type?: string;
  name?: string;
  content?: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

export interface APICredentials {
  cloudflare?: {
    apiToken: string;
    accountId?: string;
  };
  porkbun?: {
    apiKey: string;
    secretKey: string;
  };
  gemini?: {
    apiKey: string;
  };
}

export interface AICommand {
  action: 'list' | 'create' | 'update' | 'delete' | 'search' | 'info';
  provider?: 'cloudflare' | 'porkbun' | 'all';
  domain?: string;
  recordType?: string;
  recordName?: string;
  recordContent?: string;
  recordId?: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

export interface AIResponse {
  message: string;
  command?: AICommand;
  data?: unknown;
  error?: string;
}
