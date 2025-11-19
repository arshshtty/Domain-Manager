import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { sendAICommand } from '@/lib/api'

interface CommandBarProps {
  onCommandExecuted?: () => void
}

export function CommandBar({ onCommandExecuted }: CommandBarProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{
    message: string
    result?: unknown
    error?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    setLoading(true)
    setResponse(null)

    try {
      const result = await sendAICommand(input)
      setResponse({
        message: result.message,
        result: result.result,
      })
      setInput('')
      onCommandExecuted?.()
    } catch (error) {
      setResponse({
        message: 'Command failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Type a command (e.g., 'list all domains', 'add A record for api.example.com')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? 'Processing...' : 'Run'}
          </Button>
        </form>

        {response && (
          <div className="mt-4 p-4 rounded-md bg-muted">
            <p className="font-medium">{response.message}</p>
            {response.error && (
              <p className="text-destructive text-sm mt-2">{response.error}</p>
            )}
            {response.result && (
              <pre className="mt-2 text-xs overflow-auto max-h-48">
                {JSON.stringify(response.result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
