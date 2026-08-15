import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Users, Calendar } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { superAdminService, type BranchItem } from '@services/superadmin.service';

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    superAdminService.getBranches().then((b) => {
      setBranches(b);
      setLoading(false);
    });
  }, []);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Multi-Tenant Branches</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Institutes & Branches</h1>
          <p className="text-sm text-muted-foreground">Overview of registered institute campuses and branches.</p>
        </div>

        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          + Create New Branch
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card border rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search branches by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-sm text-muted-foreground col-span-3">Loading branches…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-3">No branches found.</p>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 border-indigo-200 uppercase mb-2">
                    {b.code}
                  </Badge>
                  <h3 className="text-lg font-bold text-foreground leading-tight">{b.name}</h3>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.admin_count} Assigned Admins</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created {new Date(b.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
