import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Key,
  Ban,
  CheckCircle2,
  Trash2,
  Building2,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Skeleton } from '@components/common/Skeleton';
import { getInitials } from '@lib/utils';
import { superAdminService, type AdminUser } from '@services/superadmin.service';
import { CreateAdminModal } from '../modals/CreateAdminModal';

export default function AdminsPage() {
  const [admins,       setAdmins]       = useState<AdminUser[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getAllAdmins();
      setAdmins(data);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const handleToggleStatus = async (admin: AdminUser) => {
    const isSuspended = admin.status === 'active';
    try {
      await superAdminService.toggleAdminStatus(admin.id, isSuspended);
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === admin.id ? { ...a, status: isSuspended ? 'suspended' : 'active' } : a
        )
      );
      setNotification(`Admin account ${isSuspended ? 'suspended' : 'activated'}.`);
    } catch {
      setNotification('Failed to update admin status.');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await superAdminService.resetPassword(email);
      setNotification(`Password reset email sent to ${email}.`);
    } catch {
      setNotification('Failed to send password reset email.');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this admin account?')) return;
    try {
      await superAdminService.deleteAdmin(id);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      setNotification('Admin account removed.');
    } catch {
      setNotification('Failed to delete admin.');
    }
  };

  const filteredAdmins = admins.filter((a) =>
    a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage system administrators, institute managers, and branch access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            + Add New Admin
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={loadAdmins}
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex justify-between items-center">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="font-bold text-indigo-600">✕</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-4 bg-card border rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, email, or branch…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="text-xs text-muted-foreground ml-auto">
          Showing <span className="font-semibold text-foreground">{filteredAdmins.length}</span> of {admins.length} Admins
        </div>
      </div>

      {/* Management Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6 text-left">Admin User</th>
                <th className="py-3.5 px-4 text-left">Role / Privilege</th>
                <th className="py-3.5 px-4 text-left">Branch / Location</th>
                <th className="py-3.5 px-4 text-left">Status</th>
                <th className="py-3.5 px-4 text-left">Joined Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 px-6">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                    No administrators found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                    {/* User info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={admin.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-indigo-600/10 text-indigo-600 font-semibold text-xs">
                            {getInitials(admin.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground leading-snug">{admin.full_name}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={`gap-1 capitalize ${admin.role === 'super_admin' ? 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                        {admin.role === 'super_admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {admin.role.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Branch */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{admin.branch}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <Badge className={admin.status === 'active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-rose-100 text-rose-800 hover:bg-rose-100'}>
                        {admin.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>

                    {/* Joined date */}
                    <td className="py-4 px-4 text-xs text-muted-foreground tabular-nums">
                      {new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPassword(admin.email)}
                          title="Reset Password"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(admin)}
                          title={admin.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          className={`h-8 w-8 ${admin.status === 'active' ? 'text-slate-500 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          {admin.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAdmin(admin.id)}
                          title="Delete Admin"
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CreateAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newAdmin) => {
          setAdmins((prev) => [newAdmin, ...prev]);
          setNotification(`Successfully created admin ${newAdmin.full_name}.`);
        }}
      />
    </div>
  );
}
