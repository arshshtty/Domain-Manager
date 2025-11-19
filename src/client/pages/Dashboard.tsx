import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DomainRecords } from '@/components/DomainRecords'
import { listAllDomains, Domain } from '@/lib/api'

export function Dashboard() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)

  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAllDomains()
      setDomains(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domains')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading domains...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadDomains}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedDomain) {
    return (
      <DomainRecords
        domain={selectedDomain}
        onBack={() => setSelectedDomain(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Domains</h2>
        <Button variant="outline" onClick={loadDomains}>
          Refresh
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No domains found. Configure your API credentials in Settings to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => (
            <Card
              key={`${domain.provider}-${domain.id}`}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedDomain(domain)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{domain.name}</CardTitle>
                  <Badge variant={domain.provider === 'cloudflare' ? 'default' : 'secondary'}>
                    {domain.provider}
                  </Badge>
                </div>
                <CardDescription>
                  Status: {domain.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {domain.expiresAt && (
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(domain.expiresAt).toLocaleDateString()}
                  </p>
                )}
                {domain.nameservers && domain.nameservers.length > 0 && (
                  <p className="text-sm text-muted-foreground truncate">
                    NS: {domain.nameservers[0]}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
