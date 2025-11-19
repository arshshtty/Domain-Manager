import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import {
  listRecords,
  createRecord,
  deleteRecord,
  Domain,
  DNSRecord,
  CreateRecordInput,
} from '@/lib/api'

interface DomainRecordsProps {
  domain: Domain
  onBack: () => void
}

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']

export function DomainRecords({ domain, onBack }: DomainRecordsProps) {
  const [records, setRecords] = useState<DNSRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<DNSRecord | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [newRecord, setNewRecord] = useState<CreateRecordInput>({
    type: 'A',
    name: '',
    content: '',
    ttl: 3600,
    proxied: false,
  })

  useEffect(() => {
    loadRecords()
  }, [domain])

  const loadRecords = async () => {
    setLoading(true)
    setError(null)
    try {
      const domainId = domain.provider === 'cloudflare' ? domain.id : domain.name
      const data = await listRecords(domain.provider, domainId)
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const domainId = domain.provider === 'cloudflare' ? domain.id : domain.name
      await createRecord(domain.provider, domainId, newRecord)
      setCreateDialogOpen(false)
      setNewRecord({
        type: 'A',
        name: '',
        content: '',
        ttl: 3600,
        proxied: false,
      })
      loadRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!recordToDelete) return
    setDeleting(true)
    try {
      const domainId = domain.provider === 'cloudflare' ? domain.id : domain.name
      await deleteRecord(domain.provider, domainId, recordToDelete.id)
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
      loadRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record')
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = (record: DNSRecord) => {
    setRecordToDelete(record)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{domain.name}</h2>
            <p className="text-sm text-muted-foreground">DNS Records</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRecords}>
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Record</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create DNS Record</DialogTitle>
                <DialogDescription>
                  Add a new DNS record to {domain.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    id="type"
                    value={newRecord.type}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, type: e.target.value })
                    }
                  >
                    {RECORD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder={`subdomain or ${domain.name}`}
                    value={newRecord.name}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Input
                    id="content"
                    placeholder="e.g., 192.168.1.1"
                    value={newRecord.content}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, content: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ttl">TTL (seconds)</Label>
                  <Input
                    id="ttl"
                    type="number"
                    value={newRecord.ttl}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        ttl: parseInt(e.target.value) || 3600,
                      })
                    }
                  />
                </div>
                {newRecord.type === 'MX' && (
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={newRecord.priority || 10}
                      onChange={(e) =>
                        setNewRecord({
                          ...newRecord,
                          priority: parseInt(e.target.value) || 10,
                        })
                      }
                    />
                  </div>
                )}
                {domain.provider === 'cloudflare' && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="proxied">Proxy through Cloudflare</Label>
                    <Switch
                      id="proxied"
                      checked={newRecord.proxied}
                      onCheckedChange={(checked) =>
                        setNewRecord({ ...newRecord, proxied: checked })
                      }
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading records...</p>
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No DNS records found for this domain.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{record.type}</Badge>
                    <CardTitle className="text-base font-medium">
                      {record.name}
                    </CardTitle>
                    {record.proxied && (
                      <Badge variant="secondary">Proxied</Badge>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmDelete(record)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Content:</span>{' '}
                    <code className="bg-muted px-1 rounded">{record.content}</code>
                  </p>
                  <p>
                    <span className="text-muted-foreground">TTL:</span>{' '}
                    {record.ttl === 1 ? 'Auto' : `${record.ttl}s`}
                  </p>
                  {record.priority !== undefined && (
                    <p>
                      <span className="text-muted-foreground">Priority:</span>{' '}
                      {record.priority}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {recordToDelete?.type} record
              for {recordToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
