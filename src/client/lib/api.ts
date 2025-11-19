const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data.data;
}

// Domains
export async function listAllDomains() {
  return fetchApi<Domain[]>('/domains');
}

export async function listDomains(provider: string) {
  return fetchApi<Domain[]>(`/domains/${provider}`);
}

export async function listRecords(provider: string, domainId: string) {
  return fetchApi<DNSRecord[]>(`/domains/${provider}/${domainId}/records`);
}

export async function createRecord(
  provider: string,
  domainId: string,
  record: CreateRecordInput
) {
  return fetchApi<DNSRecord>(`/domains/${provider}/${domainId}/records`, {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function updateRecord(
  provider: string,
  domainId: string,
  recordId: string,
  record: UpdateRecordInput
) {
  return fetchApi<DNSRecord>(
    `/domains/${provider}/${domainId}/records/${recordId}`,
    {
      method: 'PUT',
      body: JSON.stringify(record),
    }
  );
}

export async function deleteRecord(
  provider: string,
  domainId: string,
  recordId: string
) {
  return fetchApi<boolean>(
    `/domains/${provider}/${domainId}/records/${recordId}`,
    {
      method: 'DELETE',
    }
  );
}

// Settings
export async function getCredentialsStatus() {
  return fetchApi<{
    credentials: { provider: string; hasCredentials: boolean }[];
    configuredProviders: string[];
  }>('/settings/credentials');
}

export async function setCloudflareCredentials(
  apiToken: string,
  accountId?: string
) {
  return fetchApi<{ message: string }>('/settings/credentials/cloudflare', {
    method: 'POST',
    body: JSON.stringify({ apiToken, accountId }),
  });
}

export async function setPorkbunCredentials(
  apiKey: string,
  secretKey: string
) {
  return fetchApi<{ message: string }>('/settings/credentials/porkbun', {
    method: 'POST',
    body: JSON.stringify({ apiKey, secretKey }),
  });
}

export async function setGeminiApiKey(apiKey: string) {
  return fetchApi<{ message: string }>('/settings/credentials/gemini', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  });
}

export async function deleteCredentials(provider: string) {
  return fetchApi<{ message: string }>(`/settings/credentials/${provider}`, {
    method: 'DELETE',
  });
}

// AI
export async function sendAICommand(input: string) {
  return fetchApi<{
    message: string;
    command?: unknown;
    result?: unknown;
    needsMoreInfo?: boolean;
  }>('/ai/command', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export async function getAISuggestions(domain: string, purpose: string) {
  return fetchApi<{
    message: string;
    suggestions?: unknown[];
  }>('/ai/suggest', {
    method: 'POST',
    body: JSON.stringify({ domain, purpose }),
  });
}

export async function getCommandHistory() {
  return fetchApi<
    {
      id: number;
      userInput: string;
      parsedCommand: string | null;
      result: string | null;
      createdAt: string;
    }[]
  >('/ai/history');
}

// Health
export async function getHealth() {
  return fetchApi<{
    status: string;
    timestamp: string;
    providers: string[];
  }>('/health');
}

// Types
export interface Domain {
  id: string;
  name: string;
  provider: 'cloudflare' | 'porkbun';
  status: string;
  expiresAt?: string;
  autoRenew?: boolean;
  nameservers?: string[];
}

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
