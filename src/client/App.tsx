import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dashboard } from '@/pages/Dashboard'
import { Settings } from '@/pages/Settings'
import { CommandBar } from '@/components/CommandBar'
import { getCredentialsStatus } from '@/lib/api'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([])

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const status = await getCredentialsStatus()
      setConfiguredProviders(status.configuredProviders)
      setHasGeminiKey(status.credentials.some(c => c.provider === 'gemini' && c.hasCredentials))
    } catch (error) {
      console.error('Failed to load status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Domain Manager</h1>
            <div className="text-sm text-muted-foreground">
              {configuredProviders.length > 0 ? (
                <span>Connected: {configuredProviders.join(', ')}</span>
              ) : (
                <span>No providers configured</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {hasGeminiKey && (
          <div className="mb-6">
            <CommandBar onCommandExecuted={loadStatus} />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="settings">
            <Settings onCredentialsUpdated={loadStatus} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
