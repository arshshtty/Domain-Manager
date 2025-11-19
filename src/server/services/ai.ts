import { GoogleGenerativeAI } from '@google/generative-ai';
import { AICommand, AIResponse } from '../types';

export class AIService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async parseCommand(userInput: string): Promise<AIResponse> {
    const systemPrompt = `You are a DNS management assistant. Parse the user's natural language request and convert it to a structured command.

Available actions:
- list: List domains or DNS records
- create: Create a new DNS record
- update: Update an existing DNS record
- delete: Delete a DNS record
- search: Search for specific records
- info: Get information about a domain

Available providers: cloudflare, porkbun, all

DNS record types: A, AAAA, CNAME, MX, TXT, NS, SRV, CAA

Respond with a JSON object containing:
{
  "message": "Human-readable description of what will be done",
  "command": {
    "action": "list|create|update|delete|search|info",
    "provider": "cloudflare|porkbun|all",
    "domain": "domain name if specified",
    "recordType": "DNS record type if specified",
    "recordName": "full record name if specified",
    "recordContent": "record content/value if specified",
    "recordId": "record ID if specified for update/delete",
    "ttl": TTL value if specified,
    "priority": priority value if specified (for MX records),
    "proxied": true/false for Cloudflare proxy setting
  }
}

If the request is unclear or you need more information, set the message to explain what's needed and don't include a command.

Examples:
- "list all my domains" -> action: list, provider: all
- "show DNS records for example.com" -> action: list, domain: example.com
- "add an A record for api.example.com pointing to 192.168.1.1" -> action: create, domain: example.com, recordType: A, recordName: api.example.com, recordContent: 192.168.1.1
- "delete the TXT record for _dmarc.example.com" -> action: delete, domain: example.com, recordType: TXT, recordName: _dmarc.example.com`;

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: `User request: ${userInput}` },
      ]);

      const response = result.response.text();

      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          message: 'I could not understand your request. Please try rephrasing it.',
          error: 'Failed to parse AI response',
        };
      }

      const parsed = JSON.parse(jsonMatch[0]) as AIResponse;
      return parsed;
    } catch (error) {
      console.error('AI parsing error:', error);
      return {
        message: 'An error occurred while processing your request.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateSummary(data: unknown, context: string): Promise<string> {
    const prompt = `Summarize the following ${context} data in a clear, concise way for the user:

${JSON.stringify(data, null, 2)}

Provide a brief, informative summary that highlights the key information.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('AI summary error:', error);
      return 'Unable to generate summary.';
    }
  }

  async suggestRecords(domain: string, purpose: string): Promise<AIResponse> {
    const prompt = `Suggest DNS records for the domain "${domain}" that would be useful for: ${purpose}

Provide recommendations in JSON format:
{
  "message": "Description of recommended records",
  "suggestions": [
    {
      "type": "record type",
      "name": "record name",
      "content": "suggested content",
      "ttl": suggested TTL,
      "explanation": "why this record is useful"
    }
  ]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          message: 'Unable to generate suggestions.',
          error: 'Failed to parse AI response',
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI suggestion error:', error);
      return {
        message: 'An error occurred while generating suggestions.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
