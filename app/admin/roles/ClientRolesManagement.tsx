'use client';

import React, { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, Users, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useProperty } from '@/contexts/property-context';
import { useSession } from 'next-auth/react';

export default function ClientRolesManagement({ initialRoles, groupedPermissions, initialStaff }: { initialRoles: any[], groupedPermissions: any, initialStaff: any[] }) {
  const { data: session } = useSession();
  const { properties } = useProperty();
  const isSuperAdmin = (session?.user as any)?.roleName === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'ROLES' | 'USERS'>('ROLES');
  
  // Roles State
  const [roles, setRoles] = useState(initialRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    permissionIds: [] as string[],
    propertyId: ''
  });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  
  // Staff State
  const [staff, setStaff] = useState(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();

  // --- ROLES LOGIC ---
  const toggleModule = (modName: string) => {
    setExpandedModules(prev => ({ ...prev, [modName]: !prev[modName] }));
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', status: 'ACTIVE', permissionIds: [], propertyId: '' });
    setExpandedModules({});
    setIsModalOpen(true);
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      status: role.status,
      permissionIds: role.permissions.map((p: any) => p.permissionId),
      propertyId: role.propertyId || ''
    });
    setExpandedModules({});
    setIsModalOpen(true);
  };

  const handleGrantAll = () => {
    const allIds = Object.values(groupedPermissions).flat().map((p: any) => p.id);
    setFormData(prev => ({ ...prev, permissionIds: allIds }));
  };

  const handleRevokeAll = () => {
    setFormData(prev => ({ ...prev, permissionIds: [] }));
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => {
      const isSelected = prev.permissionIds.includes(permId);
      if (isSelected) {
        return { ...prev, permissionIds: prev.permissionIds.filter(id => id !== permId) };
      } else {
        return { ...prev, permissionIds: [...prev.permissionIds, permId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingRole ? `/api/admin/rbac/roles/${editingRole.id}` : '/api/admin/rbac/roles';
      const method = editingRole ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        propertyId: formData.propertyId === '' ? null : formData.propertyId
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save role");
      }
    } catch (e) {
      toast.error("Network error saving role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role: any) => {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/rbac/roles/${role.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Role deleted");
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete role");
      }
    } catch (e) {
      toast.error("Error deleting role");
    }
  };

  // --- STAFF LOGIC ---
  const updateStaffRole = async (staffId: string, newRoleId: string) => {
    const previousStaff = [...staff];
    
    // Optimistic update
    setStaff(prev => prev.map(s => {
      if (s.id === staffId) {
        const newRole = roles.find(r => r.id === newRoleId);
        return { ...s, roleId: newRoleId, role: newRole };
      }
      return s;
    }));

    toast.loading("Updating authority level...", { id: 'roleUpdate' });
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Map roleId to role for compatibility with old endpoint, or update endpoint to accept roleId.
        body: JSON.stringify({ role: newRoleId }) 
      });
      
      if (res.ok) {
        toast.success("Authority updated successfully", { id: 'roleUpdate' });
        router.refresh();
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      toast.error("Failed to update staff role", { id: 'roleUpdate' });
      setStaff(previousStaff);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent text-[#FBFAF7] font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header (Matching Laural Layout) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight text-white">
              Access Control Center
            </h1>
            <p className="text-[#8E8C94] text-sm">
              Manage system users, define roles, and configure granular permissions across the platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { router.refresh(); window.location.reload(); }}
              className="p-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#8E8C94]" />
            </button>
            {activeTab === 'ROLES' && (
              <button 
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-[#D4AF37] text-black hover:bg-[#C3A030] px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create Role
              </button>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('ROLES')}
            className={`pb-4 text-sm font-bold tracking-wide flex items-center gap-2 transition-colors relative ${
              activeTab === 'ROLES' ? 'text-white' : 'text-[#8E8C94] hover:text-white/80'
            }`}
          >
            <Shield className="w-4 h-4" />
            Roles & Permissions ({roles.length})
            {activeTab === 'ROLES' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-t-full" />}
          </button>
          
          <button
            onClick={() => setActiveTab('USERS')}
            className={`pb-4 text-sm font-bold tracking-wide flex items-center gap-2 transition-colors relative ${
              activeTab === 'USERS' ? 'text-white' : 'text-[#8E8C94] hover:text-white/80'
            }`}
          >
            <Users className="w-4 h-4" />
            System Users ({staff.length})
            {activeTab === 'USERS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-t-full" />}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#121118]/80 rounded-xl border border-white/5 shadow-sm overflow-hidden min-h-[60vh]">
          
          {activeTab === 'ROLES' && (
            <>
              {/* Roles Search Bar (Visual match for Laural UI) */}
              <div className="p-4 border-b border-white/5 bg-black/20">
                <div className="relative max-w-3xl">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8C94]" />
                  <input 
                    type="text" 
                    placeholder="Search roles..." 
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              {/* Roles Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 text-[10px] font-bold text-[#8E8C94] uppercase tracking-wider border-b border-white/5">
                    <th className="p-4">Role Name</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-center">Assigned Users</th>
                    <th className="p-4 text-center">Permissions Level</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {roles.map(role => (
                    <tr key={role.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-white flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {role.name}
                            {!role.isCustom && <span className="bg-white/5 text-[#8E8C94] text-[10px] px-1.5 py-0.5 rounded font-bold border border-white/10">SYSTEM</span>}
                          </div>
                          {isSuperAdmin && (
                            <span className="text-[10px] text-[#8E8C94] uppercase font-mono">
                              {role.propertyId ? properties.find(p => p.id === role.propertyId)?.name || 'Unknown Property' : 'GLOBAL SCOPE'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-[#8E8C94] max-w-md truncate">
                        {role.description || 'System Authority Level'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm">{role._count.users} user(s)</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          role._count.permissions > 50 ? 'bg-red-500/10 text-red-400' :
                          role._count.permissions > 20 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {role._count.permissions > 50 ? 'HIGH' : role._count.permissions > 20 ? 'MEDIUM' : 'LOW'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => openEditModal(role)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded bg-white/5 text-[#8E8C94] hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(role)}
                          disabled={!role.isCustom || role._count.users > 0}
                          className="inline-flex items-center justify-center w-8 h-8 rounded bg-white/5 text-[#8E8C94] hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'USERS' && (
            <>
              {/* Users Search Bar */}
              <div className="p-4 border-b border-white/5 bg-black/20">
                <div className="relative max-w-3xl">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8C94]" />
                  <input 
                    type="text" 
                    placeholder="Search users by name or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              {/* Users Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 text-[10px] font-bold text-[#8E8C94] uppercase tracking-wider border-b border-white/5">
                    <th className="p-4">Personnel</th>
                    <th className="p-4">Assigned Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map(member => (
                      <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-white/5">
                              <span className="text-sm font-bold text-primary">{member.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{member.name}</div>
                              <div className="text-xs text-[#8E8C94]">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <select 
                            className="bg-black/40 border border-white/10 text-sm font-medium text-white rounded-lg px-4 py-2 focus:border-[#D4AF37] outline-none transition-all min-w-[200px]"
                            value={member.roleId || member.role?.id} // Depending on data structure
                            onChange={(e) => updateStaffRole(member.id, e.target.value)}
                          >
                            <option value="">-- Select Role --</option>
                            {roles.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-sm text-[#8E8C94]">
                        No personnel found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL (RBAC MATRIX) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#121118] border border-white/10 rounded-2xl w-full max-w-4xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 shrink-0">
              <div>
                <h3 className="text-xl font-bold font-serif text-[#D4AF37] flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {editingRole ? 'Edit Role Permissions' : 'Create Custom Role'}
                </h3>
                <p className="text-sm text-[#8E8C94] mt-1">Configure role access levels and permission matrix</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              
              {/* Role Basics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border border-white/5 bg-black/20">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8E8C94] uppercase tracking-wider">Role Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Regional Merchandiser"
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    disabled={editingRole && !editingRole.isCustom}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#8E8C94] uppercase tracking-wider">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    disabled={editingRole && !editingRole.isCustom}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                {isSuperAdmin && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8E8C94] uppercase tracking-wider">Property Scope</label>
                    <select 
                      value={formData.propertyId} 
                      onChange={e => setFormData({...formData, propertyId: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                      disabled={editingRole && !editingRole.isCustom}
                    >
                      <option value="">Global (All Properties)</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={`space-y-2 ${isSuperAdmin ? 'md:col-span-1' : 'md:col-span-2'}`}>
                  <label className="text-xs font-bold text-[#8E8C94] uppercase tracking-wider">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Role responsibilities and department scope..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors h-20 resize-none"
                    disabled={editingRole && !editingRole.isCustom}
                  />
                </div>
              </div>

              {/* Permission Modules Accordion */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Permission Modules</h4>
                    <p className="text-xs text-[#8E8C94]">{formData.permissionIds.length} permission flags enabled</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={handleGrantAll}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition-colors"
                    >
                      Grant All
                    </button>
                    <button 
                      type="button" 
                      onClick={handleRevokeAll}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition-colors"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(groupedPermissions).map(([modName, perms]: [string, any]) => {
                    const modulePerms = perms.map((p: any) => p.id);
                    const selectedInModule = formData.permissionIds.filter(id => modulePerms.includes(id));
                    const isAllSelected = selectedInModule.length === modulePerms.length && modulePerms.length > 0;
                    const isExpanded = expandedModules[modName];

                    return (
                      <div key={modName} className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
                        {/* Accordion Header */}
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                          onClick={() => toggleModule(modName)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="flex items-center justify-center cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAllSelected) {
                                  // Revoke module
                                  setFormData(prev => ({ ...prev, permissionIds: prev.permissionIds.filter(id => !modulePerms.includes(id)) }));
                                } else {
                                  // Grant module
                                  const newIds = new Set([...formData.permissionIds, ...modulePerms]);
                                  setFormData(prev => ({ ...prev, permissionIds: Array.from(newIds) }));
                                }
                              }}
                            >
                              {isAllSelected ? <CheckSquare className="w-5 h-5 text-[#D4AF37]" /> : <Square className="w-5 h-5 text-[#8E8C94]/50" />}
                            </div>
                            <span className="font-bold text-xs uppercase tracking-wider text-blue-400">{modName}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-[#8E8C94]">{selectedInModule.length}/{modulePerms.length} permissions</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8E8C94]" /> : <ChevronDown className="w-4 h-4 text-[#8E8C94]" />}
                          </div>
                        </div>

                        {/* Accordion Body */}
                        {isExpanded && (
                          <div className="p-4 border-t border-white/5 bg-black/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                              {perms.map((perm: any) => {
                                const isChecked = formData.permissionIds.includes(perm.id);
                                return (
                                  <label key={perm.id} className="flex items-start gap-3 cursor-pointer group p-2 rounded-md hover:bg-white/5 transition-colors">
                                    <div className="mt-0.5">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={isChecked}
                                        onChange={() => togglePermission(perm.id)}
                                      />
                                      {isChecked ? <CheckSquare className="w-4 h-4 text-[#D4AF37]" /> : <Square className="w-4 h-4 text-[#8E8C94]/50 group-hover:text-white/40" />}
                                    </div>
                                    <div>
                                      <div className={`text-sm transition-colors ${isChecked ? 'text-white font-medium' : 'text-[#8E8C94] group-hover:text-slate-300'}`}>
                                        {perm.displayName}
                                      </div>
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-white/10 flex items-center justify-between bg-black/40 shrink-0">
              <div className="text-xs text-[#8E8C94] font-mono">
                {formData.permissionIds.length} permissions selected
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-[#8E8C94] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold bg-[#D4AF37] text-black hover:bg-[#C3A030] rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : (editingRole ? 'Save Changes' : 'Create Role')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
