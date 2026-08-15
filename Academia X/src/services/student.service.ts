/**
 * Student Service Layer
 * Supabase database access layer for the Student module.
 */

import { supabase } from '@lib/supabase';

export interface StudentStats {
  enrolledCourses:     number;
  pendingAssignments:  number;
  attendanceRate:      number;
}

export interface StudentCourseItem {
  id:           string;
  title:        string;
  code:         string;
  description:  string | null;
  teacher_name: string;
  schedule:     string;
  status:       string;
  enrolled_at:  string;
}

export interface AssignmentItem {
  id:           string;
  title:        string;
  description:  string | null;
  due_date:     string | null;
  max_score:    number;
  course_id:    string;
  course_title: string;
  file_url:     string | null;
  submission_id?:   string;
  submitted_at?:    string | null;
  submission_status?: 'submitted' | 'graded' | null;
  score?:           number | null;
  feedback?:        string | null;
  status:       'pending' | 'submitted' | 'graded';
}

export interface StudentProfile {
  id:             string;
  full_name:      string;
  email:          string;
  phone:          string | null;
  address:        string | null;
  avatar_url:     string | null;
  role:           string;
  roll_id:        string | null;
  enrollment_date: string | null;
  father_name:    string | null;
  batch:          string | null;
  timing:         string | null;
}

/**
 * Fetch real-time dashboard stats for a student.
 */
export async function getStudentDashboardStats(studentId: string): Promise<StudentStats> {
  try {
    // 1. Get enrolled courses
    const courses = await getStudentCourses(studentId);
    const enrolledCourses = (courses || []).length;
    const courseIds = (courses || []).map((c) => c.id).filter(Boolean);

    // 2. Get pending assignments count
    let pendingAssignments = 0;
    if (courseIds.length > 0) {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .in('course_id', courseIds);

      const assignIds = (assignments || []).map((a) => a.id).filter(Boolean);
      if (assignIds.length > 0) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('assignment_id, status')
          .eq('student_id', studentId)
          .in('assignment_id', assignIds);

        const submittedIds = new Set((subs || []).map((s) => s.assignment_id));
        pendingAssignments = assignIds.filter((id) => !submittedIds.has(id)).length;
      }
    }

    // 3. Attendance rate
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);

    const records = attendance || [];
    let attendanceRate = 0;
    if (records.length > 0) {
      const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
      attendanceRate = Math.round((present / records.length) * 100);
    }

    return {
      enrolledCourses,
      pendingAssignments,
      attendanceRate,
    };
  } catch {
    return { enrolledCourses: 0, pendingAssignments: 0, attendanceRate: 0 };
  }
}

/**
 * Fetch all courses a student is enrolled in.
 */
export async function getStudentCourses(studentId: string): Promise<StudentCourseItem[]> {
  try {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, enrolled_at')
      .eq('student_id', studentId);

    const courseIds = (enrollments || []).map((e) => e.course_id).filter(Boolean);
    if (courseIds.length === 0) {
      // Fallback: return all active courses if no enrollments
      const { data: allCourses } = await supabase.from('courses').select('*').limit(10);
      return (allCourses || []).map((c) => ({
        id:           c.id,
        title:        c.title ?? 'Untitled Course',
        code:         c.code ?? 'CRS-101',
        description:  c.description ?? null,
        teacher_name: 'Assigned Instructor',
        schedule:     'Mon & Wed • 10:00 AM – 12:00 PM',
        status:       c.status ?? 'Active',
        enrolled_at:  c.created_at ?? new Date().toISOString(),
      }));
    }

    const enrolledAtMap = new Map(
      (enrollments || []).map((e) => [e.course_id, e.enrolled_at]),
    );

    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);

    // Get teacher names
    const teacherIds = [...new Set((courses || []).map((c) => c.teacher_id).filter(Boolean))];
    let teacherMap = new Map<string, string>();
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds);
      (teachers || []).forEach((t) => teacherMap.set(t.id, t.full_name ?? 'Instructor'));
    }

    return (courses || []).map((c) => ({
      id:           c.id,
      title:        c.title ?? 'Untitled Course',
      code:         c.code ?? 'CRS-101',
      description:  c.description ?? null,
      teacher_name: c.teacher_id ? (teacherMap.get(c.teacher_id) ?? 'Instructor') : 'Instructor',
      schedule:     'Mon & Wed • 10:00 AM – 12:00 PM',
      status:       c.status ?? 'Active',
      enrolled_at:  enrolledAtMap.get(c.id) ?? c.created_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch assignments for a student's enrolled courses with submission status.
 */
export async function getStudentAssignments(studentId: string): Promise<AssignmentItem[]> {
  try {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);

    const courseIds = (enrollments || []).map((e) => e.course_id).filter(Boolean);

    let query = supabase
      .from('assignments')
      .select('id, title, description, due_date, max_score, course_id, file_url');

    if (courseIds.length > 0) {
      query = query.in('course_id', courseIds);
    }

    const { data: assignments } = await query.order('created_at', { ascending: false });
    const assignIds = (assignments || []).map((a) => a.id).filter(Boolean);

    // Fetch student submissions
    let subMap = new Map<string, any>();
    if (assignIds.length > 0) {
      const { data: subs } = await supabase
        .from('submissions')
        .select('id, assignment_id, status, submitted_at, score, feedback')
        .eq('student_id', studentId)
        .in('assignment_id', assignIds);

      (subs || []).forEach((s) => subMap.set(s.assignment_id, s));
    }

    // Fetch course titles
    let courseTitleMap = new Map<string, string>();
    if (courseIds.length > 0) {
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);
      (courses || []).forEach((c) => courseTitleMap.set(c.id, c.title ?? 'Course'));
    }

    return (assignments || []).map((a) => {
      const sub = subMap.get(a.id);
      let status: AssignmentItem['status'] = 'pending';
      if (sub) {
        status = sub.status === 'graded' ? 'graded' : 'submitted';
      }
      return {
        id:               a.id,
        title:            a.title ?? 'Untitled Assignment',
        description:      a.description ?? null,
        due_date:         a.due_date ?? null,
        max_score:        a.max_score ?? 100,
        course_id:        a.course_id,
        course_title:     courseTitleMap.get(a.course_id) ?? 'Course',
        file_url:         a.file_url ?? null,
        submission_id:    sub?.id,
        submitted_at:     sub?.submitted_at ?? null,
        submission_status: sub?.status ?? null,
        score:            sub?.score ?? null,
        feedback:         sub?.feedback ?? null,
        status,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Submit or update an assignment submission.
 */
export async function submitAssignment(params: {
  assignment_id: string;
  student_id: string;
  file_url?: string | null;
  notes?: string;
  submission_id?: string;
}): Promise<void> {
  const payload = {
    assignment_id: params.assignment_id,
    student_id:    params.student_id,
    file_url:      params.file_url ?? null,
    notes:         params.notes ?? '',
    status:        'submitted' as const,
    submitted_at:  new Date().toISOString(),
  };

  if (params.submission_id) {
    const { error } = await supabase
      .from('submissions')
      .update(payload as any)
      .eq('id', params.submission_id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('submissions')
      .insert(payload as any);
    if (error) throw error;
  }
}

/**
 * Upload a submission file to Supabase Storage.
 */
export async function uploadSubmissionFile(
  file: File,
  studentId: string,
  assignmentId: string,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${studentId}/${assignmentId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('assignment-submissions')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('assignment-submissions').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Fetch student's own profile.
 */
export async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error || !data) return null;

    return {
      id:             data.id,
      full_name:      data.full_name ?? '',
      email:          data.email ?? '',
      phone:          data.phone ?? null,
      address:        data.address ?? null,
      avatar_url:     data.avatar_url ?? null,
      role:           data.role ?? 'student',
      roll_id:        data.roll_id ?? data.roll_number ?? null,
      enrollment_date: data.enrollment_date ?? data.created_at ?? null,
      father_name:    data.father_name ?? null,
      batch:          data.batch ?? null,
      timing:         data.timing ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Update editable student profile fields (phone, address, avatar_url).
 */
export async function updateStudentProfile(
  studentId: string,
  updates: { phone?: string; address?: string; avatar_url?: string },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq('id', studentId);
  if (error) throw error;
}

/**
 * Upload a student avatar image.
 */
export async function uploadStudentAvatar(file: File, studentId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `avatars/${studentId}.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
