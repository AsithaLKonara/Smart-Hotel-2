"use client"

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, Check, X } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function StaffDirectoryPage() {
  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ['staff-directory'],
    queryFn: async () => {
      const res = await fetch('/api/staff')
      return res.json()
    }
  })

  const { data: roleData, isLoading: loadingRoles } = useQuery({
    queryKey: ['staff-roles'],
    queryFn: async () => {
      // Auto seed RBAC if empty
      await fetch('/api/staff/seed', { method: 'POST' })
      const res = await fetch('/api/staff/roles')
      return res.json()
    }
  })

  if (loadingStaff || loadingRoles) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading RBAC configuration..." />
      </div>
    )
  }

  const staff = staffData?.staff || []
  const roles = roleData?.roles || []
  const allPermissions = roleData?.allPermissions || []

  // Check if a role has a specific permission
  const roleHasPerm = (role: any, action: string) => {
    if (role.name === 'GENERAL_MANAGER') return true
    return role.permissions.some((rp: any) => rp.permission.action === action)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div>
        <h1 className="text-3xl font-serif text-slate-900 tracking-tight flex items-center">
          <Shield className="w-8 h-8 mr-3 text-primary" /> Staff & Access Control
        </h1>
        <p className="text-slate-500 mt-2">Manage employee roles and view the enterprise permission matrix.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Staff Directory */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-600" /> Internal Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {staff.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div>
                    <h4 className="font-semibold text-slate-900">{user.name || 'Unnamed Staff'}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {user.role?.name?.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="text-center py-6 text-sm text-slate-500">
                  No internal staff found. Create a user via DB or auth flow.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center">
                <Shield className="w-4 h-4 mr-2 text-primary" /> RBAC Permission Matrix
              </CardTitle>
              <CardDescription>Visual mapping of which roles have access to which enterprise modules.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Permission / Action</th>
                    {roles.map((r: any) => (
                      <th key={r.id} className="px-4 py-3 font-semibold text-center">{r.name.replace('_', ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPermissions.map((perm: any) => (
                    <tr key={perm.id} className="border-b hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-800 font-medium">{perm.action}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{perm.description}</div>
                      </td>
                      {roles.map((r: any) => {
                        const hasAccess = roleHasPerm(r, perm.action)
                        return (
                          <td key={r.id} className="px-4 py-3 text-center">
                            {hasAccess ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                <Check className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                                <X className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
