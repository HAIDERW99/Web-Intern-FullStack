import { useState } from 'react';
import { Settings, Shield, Database, Download, Save, RefreshCw } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';

export default function SuperAdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedMessage('Global settings updated successfully.');
    }, 600);
  };

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">System Configuration</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Global Settings</h1>
        <p className="text-sm text-muted-foreground">Configure system-wide settings, data backups, and security policies.</p>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          {savedMessage}
        </div>
      )}

      {/* Platform Branding */}
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          Platform Identity & Branding
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">System Title</Label>
            <Input defaultValue="AcademiaX Education System" className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Support Contact Email</Label>
            <Input defaultValue="support@academiax.edu" className="text-sm" />
          </div>
        </div>
      </div>

      {/* Data Backup & Export */}
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          System Backups & Export
        </h2>
        <p className="text-xs text-muted-foreground">
          Trigger automatic system snapshots or export database audit logs for compliance.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="outline" className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Trigger System Backup
          </Button>
          <Button variant="outline" className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export Full Audit Log (CSV)
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving Changes…' : 'Save Global Settings'}
        </Button>
      </div>
    </div>
  );
}
