'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { UserPlus, Shield, ShieldCheck, Trash2 } from 'lucide-react'

interface Admin {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

interface AdminListProps {
  admins: Admin[]
  currentUserId: string
  userRole: string
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
}

export function AdminList({ admins, currentUserId, userRole }: AdminListProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isSuperAdmin = userRole === 'super_admin'

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create admin')
      }

      setIsModalOpen(false)
      setFullName('')
      setEmail('')
      setPassword('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to remove ${adminName}? This action cannot be undone.`)) {
      return
    }

    setRemovingId(adminId)

    try {
      const res = await fetch(`/api/admins/${adminId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove admin')
      }

      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-1">Manage admin users in your company</p>
        </div>
        {isSuperAdmin && (
          <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-5 h-5 mr-2" />
            Create Admin
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length > 0 ? (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      {admin.role === 'super_admin' ? (
                        <ShieldCheck className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Shield className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{admin.full_name}</p>
                      <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 ml-13 sm:ml-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${roleColors[admin.role] || roleColors.admin}`}>
                      {roleLabels[admin.role] || admin.role}
                    </span>
                    {admin.id === currentUserId && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 whitespace-nowrap">
                        You
                      </span>
                    )}
                    {isSuperAdmin && admin.id !== currentUserId && admin.role !== 'super_admin' && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id, admin.full_name)}
                        disabled={removingId === admin.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No admin users found.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Admin">
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Input
            label="Full Name *"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email *"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <p className="text-xs text-gray-500">
            The admin will use these credentials to log in. They will have access to the Dashboard, Estates, and Buyers sections.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
