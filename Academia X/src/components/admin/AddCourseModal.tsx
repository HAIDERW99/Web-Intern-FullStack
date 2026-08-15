/**
 * AddCourseModal Component
 * Modal for creating a new course with teacher assignment & course code validation.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Tag, AlignLeft, ChevronDown, X } from 'lucide-react';

import { createCourse, getTeachersForSelect } from '@services/admin.service';

const courseSchema = z.object({
  title:       z.string().min(2, 'Title must be at least 2 characters'),
  code:        z.string().min(1, 'Course code is required'),
  description: z.string().max(300, 'Max 300 characters').optional(),
  teacher_id:  z.string().min(1, 'Assign a teacher'),
});

type CourseFormValues = z.infer<typeof courseSchema>;
type TeacherOption = { id: string; full_name: string; avatar_url: string | null };

export interface AddCourseModalProps {
  onClose:   () => void;
  onSuccess: () => void;
}

export function AddCourseModal({ onClose, onSuccess }: AddCourseModalProps) {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: `CRS-${Math.floor(100 + Math.random() * 900)}`,
      description: '',
    },
  });

  useEffect(() => {
    getTeachersForSelect()
      .then(setTeachers)
      .catch(() => setTeachers([]))
      .finally(() => setTeachersLoading(false));
  }, []);

  const onSubmit = async (data: CourseFormValues) => {
    setServerError(null);
    try {
      const courseCode = (data.code ?? '').trim();
      await createCourse({
        title:       data.title.trim(),
        code:        courseCode,
        description: data.description ?? '',
        teacher_id:  data.teacher_id,
      });
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create course.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Create New Course</h2>
            <p className="text-xs text-slate-500 mt-0.5">Add a course and assign a lead instructor.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {serverError && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="modal-course-title" className="block text-sm font-medium text-slate-700">Course Title</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="modal-course-title"
                  type="text"
                  placeholder="e.g. Web Development"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  {...register('title')}
                />
              </div>
              {errors.title && <p role="alert" className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-course-code" className="block text-sm font-medium text-slate-700">Course Code</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="modal-course-code"
                  type="text"
                  placeholder="e.g. CS-101"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  {...register('code')}
                />
              </div>
              {errors.code && <p role="alert" className="text-xs text-red-600">{errors.code.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-course-desc" className="block text-sm font-medium text-slate-700">Description (optional)</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <textarea
                  id="modal-course-desc"
                  rows={3}
                  placeholder="Brief course description…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  {...register('description')}
                />
              </div>
              {errors.description && <p role="alert" className="text-xs text-red-600">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-course-teacher" className="block text-sm font-medium text-slate-700">Lead Instructor</label>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <select
                  id="modal-course-teacher"
                  disabled={teachersLoading}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm appearance-none pr-9 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-60"
                  {...register('teacher_id')}
                >
                  <option value="">{teachersLoading ? 'Loading teachers…' : 'Select a teacher'}</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
              {errors.teacher_id && <p role="alert" className="text-xs text-red-600">{errors.teacher_id.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Creating…' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddCourseModal;
