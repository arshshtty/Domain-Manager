import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  getCredentialsStatus,
  setCloudflareCredentials,
  setPorkbunCredentials,
  setGeminiApiKey,
  deleteCredentials,
} from '@/lib/api'

interface SettingsProps {
  onCredentialsUpdated?: () => void
}

export function Settings({ onCredentialsUpdated }: SettingsProps) {
  const [credentials, setCredentials] = useState<
    { provider: string; hasCredentials: boolean }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [cloudflareToken, setCloudflareToken] = useState('')
  const [cloudflareAccountId, setCloudflareAccountId] = useState('')
  const [porkbunApiKey, setPorkbunApiKey] = useState('')
  const [porkbunSecretKey, setPorkbunSecretKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const status = await getCredentialsStatus()
      setCredentials(status.credentials)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load credentials',
      })
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSaveCloudflare = async () => {
    if (!cloudflareToken) return
    setSaving(true)
    try {
      await setCloudflareCredentials(cloudflareToken, cloudflareAccountId || undefined)
      showMessage('success', 'Cloudflare credentials saved successfully')
      setCloudflareToken('')
      setCloudflareAccountId('')
      loadCredentials()
      onCredentialsUpdated?.()
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePorkbun = async () => {
    if (!porkbunApiKey || !porkbunSecretKey) return
    setSaving(true)
    try {
      await setPorkbunCredentials(porkbunApiKey, porkbunSecretKey)
      showMessage('success', 'Porkbun credentials saved successfully')
      setPorkbunApiKey('')
      setPorkbunSecretKey('')
      loadCredentials()
      onCredentialsUpdated?.()
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGemini = async () => {
    if (!geminiKey) return
    setSaving(true)
    try {
      await setGeminiApiKey(geminiKey)
      showMessage('success', 'Gemini API key saved successfully')
      setGeminiKey('')
      loadCredentials()
      onCredentialsUpdated?.()
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (provider: string) => {
    setSaving(true)
    try {
      await deleteCredentials(provider)
      showMessage('success', `${provider} credentials removed`)
      loadCredentials()
      onCredentialsUpdated?.()
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to remove credentials')
    } finally {
      setSaving(false)
    }
  }

  const hasCredentials = (provider: string) =>
    credentials.find((c) => c.provider === provider)?.hasCredentials ?? false

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">API Configuration</h2>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Cloudflare */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cloudflare</CardTitle>
              <CardDescription>
                Connect your Cloudflare account to manage DNS records
              </CardDescription>
            </div>
            {hasCredentials('cloudflare') ? (
              <Badge variant="default">Connected</Badge>
            ) : (
              <Badge variant="outline">Not configured</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasCredentials('cloudflare') ? (
            <Button
              variant="destructive"
              onClick={() => handleDelete('cloudflare')}
              disabled={saving}
            >
              Disconnect
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cf-token">API Token</Label>
                <Input
                  id="cf-token"
                  type="password"
                  placeholder="Your Cloudflare API token"
                  value={cloudflareToken}
                  onChange={(e) => setCloudflareToken(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cf-account">Account ID (optional)</Label>
                <Input
                  id="cf-account"
                  placeholder="Your Cloudflare account ID"
                  value={cloudflareAccountId}
                  onChange={(e) => setCloudflareAccountId(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSaveCloudflare}
                disabled={saving || !cloudflareToken}
              >
                {saving ? 'Saving...' : 'Connect'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Porkbun */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Porkbun</CardTitle>
              <CardDescription>
                Connect your Porkbun account to manage domains and DNS
              </CardDescription>
            </div>
            {hasCredentials('porkbun') ? (
              <Badge variant="default">Connected</Badge>
            ) : (
              <Badge variant="outline">Not configured</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasCredentials('porkbun') ? (
            <Button
              variant="destructive"
              onClick={() => handleDelete('porkbun')}
              disabled={saving}
            >
              Disconnect
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="pb-key">API Key</Label>
                <Input
                  id="pb-key"
                  type="password"
                  placeholder="Your Porkbun API key"
                  value={porkbunApiKey}
                  onChange={(e) => setPorkbunApiKey(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pb-secret">Secret Key</Label>
                <Input
                  id="pb-secret"
                  type="password"
                  placeholder="Your Porkbun secret key"
                  value={porkbunSecretKey}
                  onChange={(e) => setPorkbunSecretKey(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSavePorkbun}
                disabled={saving || !porkbunApiKey || !porkbunSecretKey}
              >
                {saving ? 'Saving...' : 'Connect'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gemini */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gemini API</CardTitle>
              <CardDescription>
                Enable natural language commands with Google Gemini
              </CardDescription>
            </div>
            {hasCredentials('gemini') ? (
              <Badge variant="default">Connected</Badge>
            ) : (
              <Badge variant="outline">Not configured</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasCredentials('gemini') ? (
            <Button
              variant="destructive"
              onClick={() => handleDelete('gemini')}
              disabled={saving}
            >
              Remove API Key
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="gemini-key">API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="Your Gemini API key"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSaveGemini}
                disabled={saving || !geminiKey}
              >
                {saving ? 'Saving...' : 'Save API Key'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
