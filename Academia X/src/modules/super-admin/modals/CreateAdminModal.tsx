import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ShieldCheck, User, Mail, Lock, Building2 } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { superAdminService, type AdminUser } from '@services/superadmin.service';

const createAdminSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email:     z.string().email('Enter a valid email address'),
  password:  z.string().min(6, 'Password must be at least 6 characters'),
  role:      z.enum(['admin', 'super_admin']),
  branch:    z.string().min(2, 'Branch or location name is required'),
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

interface CreateAdminModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onSuccess: (newAdmin: AdminUser) => void;
}

export function CreateAdminModal({ isOpen, onClose, onSuccess }: CreateAdminModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      role:   'admin',
      branch: 'Main Campus',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: CreateAdminFormValues) => {
    setServerError(null);
    try {
      const newAdmin = await superAdminService.createAdmin({
        full_name: data.full_name,
        email:     data.email,
        password:  data.password,
        role:      data.role,
        branch:    data.branch,
        permissions: ['User Management', 'Course Access'],
      });
      reset();
      onSuccess(newAdmin);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create admin.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Provision System Admin</h2>
            <p className="text-xs text-muted-foreground">Add a new institute admin or system administrator</p>
          </div>
        </div>

        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs font-semibold">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="full_name"
                placeholder="e.g. Dr. Sarah Jenkins"
                className="pl-9 text-sm"
                {...register('full_name')}
              />
            </div>
            {errors.full_name && <p className="text-xs text-rose-500">{errors.full_name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="sarah.j@academiax.edu"
                className="pl-9 text-sm"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">Initial Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9 text-sm"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
          </div>

          {/* Role & Branch in 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* System Role */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-semibold">System Privilege</Label>
              <select
                id="role"
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:ring-1 focus:ring-primary"
                {...register('role')}
              >
                <option value="admin">Institute Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <Label htmlFor="branch" className="text-xs font-semibold">Branch / Location</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="branch"
                  placeholder="Main Campus"
                  className="pl-9 text-sm"
                  {...register('branch')}
                />
              </div>
              {errors.branch && <p className="text-xs text-rose-500">{errors.branch.message}</p>}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? 'Creating…' : 'Create Admin Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
