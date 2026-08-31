-- =============================================================================
-- CS Course Allocation & Faculty Workload Management System
-- Database: PostgreSQL 15+ (Designed for Supabase / SERN Stack)
-- Target File: /database/schema.sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 0. CUSTOM ENUMS & TYPES
-- =============================================================================

CREATE TYPE user_role_enum AS ENUM (
    'admin',
    'dean',
    'hod',
    'convener',
    'coordinator',
    'faculty_member'
);

CREATE TYPE scope_level_enum AS ENUM (
    'programme',
    'semester',
    'section'
);

CREATE TYPE faculty_designation_enum AS ENUM (
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'Senior Lecturer',
    'Lecturer',
    'Lab Engineer',
    'Research Associate',
    'Adjunct Professor'
);

CREATE TYPE employment_type_enum AS ENUM (
    'full_time',
    'visiting',
    'contractual',
    'adjunct'
);

CREATE TYPE course_component_enum AS ENUM (
    'theory',
    'lab',
    'hybrid',
    'project'
);

CREATE TYPE allocation_status_enum AS ENUM (
    'draft',
    'proposed',
    'under_review',
    'approved',
    'published',
    'rejected'
);

CREATE TYPE conflict_severity_enum AS ENUM (
    'info',
    'warning',
    'critical'
);

CREATE TYPE conflict_type_enum AS ENUM (
    'workload_overflow',
    'workload_underflow',
    'time_slot_clash',
    'section_overlap',
    'max_preparations_exceeded',
    'domain_mismatch',
    'contract_cap_exceeded'
);

-- =============================================================================
-- 1. USERS & ROLES / GRANULAR ACCESS CONTROL
-- =============================================================================

-- Application Users (Compatible with Supabase auth.users & standalone setup)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    encrypted_password VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    employee_code VARCHAR(50) UNIQUE,
    phone_number VARCHAR(30),
    avatar_url TEXT,
    system_role user_role_enum NOT NULL DEFAULT 'faculty_member',
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Granular Team Permissions
CREATE TABLE team_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_code VARCHAR(100) NOT NULL, -- e.g., 'courses.create', 'allocations.approve', 'workload.override'
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_permission UNIQUE (user_id, permission_code)
);

-- =============================================================================
-- 2. ACADEMIC SETUP
-- =============================================================================

-- Academic Sessions (e.g., FA25, SP26, SU26)
CREATE TABLE academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'FA25', 'SP26'
    name VARCHAR(100) NOT NULL,              -- e.g., 'Fall 2025'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_session_dates CHECK (end_date > start_date)
);

-- Degree Programmes (e.g., BSCS, BSSE, BSAI, MSCS)
CREATE TABLE programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,          -- e.g., 'BSCS', 'BSSE'
    name VARCHAR(150) NOT NULL,                -- e.g., 'Bachelor of Science in Computer Science'
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
    degree_level VARCHAR(50) NOT NULL DEFAULT 'Undergraduate', -- 'Undergraduate', 'Graduate', 'Postgraduate'
    total_semesters INT NOT NULL DEFAULT 8,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_total_semesters CHECK (total_semesters BETWEEN 1 AND 12)
);

-- Semesters within a Programme & Academic Session
CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    semester_number INT NOT NULL,              -- 1 to 8 (or up to total_semesters)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_programme_session_semester UNIQUE (programme_id, session_id, semester_number),
    CONSTRAINT chk_semester_number CHECK (semester_number >= 1)
);

-- Sections per Semester (e.g., BSCS-3A, BSCS-3B)
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,                 -- e.g., 'A', 'B', 'C', 'Gold', 'Blue'
    student_count INT NOT NULL DEFAULT 40,
    shift VARCHAR(20) NOT NULL DEFAULT 'Morning', -- 'Morning', 'Evening', 'Weekend'
    room_preference VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_semester_section_name UNIQUE (semester_id, name),
    CONSTRAINT chk_student_count CHECK (student_count >= 0)
);

-- Hierarchical Scope for Role Assignment (Granular Access: Programme -> Semester -> Section)
CREATE TABLE team_scope (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scope_level scope_level_enum NOT NULL,
    programme_id UUID REFERENCES programmes(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    can_read BOOLEAN NOT NULL DEFAULT TRUE,
    can_write BOOLEAN NOT NULL DEFAULT FALSE,
    can_approve BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_scope_hierarchy CHECK (
        (scope_level = 'programme' AND programme_id IS NOT NULL AND semester_id IS NULL AND section_id IS NULL) OR
        (scope_level = 'semester'  AND programme_id IS NOT NULL AND semester_id IS NOT NULL AND section_id IS NULL) OR
        (scope_level = 'section'   AND programme_id IS NOT NULL AND semester_id IS NOT NULL AND section_id IS NOT NULL)
    ),
    CONSTRAINT uq_user_scope UNIQUE NULLS NOT DISTINCT (user_id, scope_level, programme_id, semester_id, section_id)
);

-- =============================================================================
-- 3. FACULTY & COURSES & WORKLOAD RULES
-- =============================================================================

-- Faculty Directory
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    faculty_code VARCHAR(50) NOT NULL UNIQUE,   -- e.g., 'FAC-CS-001'
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
    designation faculty_designation_enum NOT NULL,
    employment_type employment_type_enum NOT NULL DEFAULT 'full_time',
    specialization TEXT[] NOT NULL DEFAULT '{}', -- e.g., ARRAY['Artificial Intelligence', 'Software Engineering']
    min_credit_hours NUMERIC(4, 1) NOT NULL DEFAULT 6.0,
    max_credit_hours NUMERIC(4, 1) NOT NULL DEFAULT 12.0,
    max_preparations INT NOT NULL DEFAULT 2,    -- Max distinct courses
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_credit_bounds CHECK (max_credit_hours >= min_credit_hours AND min_credit_hours >= 0)
);

-- Visiting Faculty Extended Metadata
CREATE TABLE visiting_faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL UNIQUE REFERENCES faculty(id) ON DELETE CASCADE,
    primary_institution VARCHAR(200) NOT NULL,
    highest_degree VARCHAR(100) NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    hourly_remuneration NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_course_limit INT NOT NULL DEFAULT 2,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    nda_signed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_visiting_dates CHECK (contract_end_date >= contract_start_date),
    CONSTRAINT chk_max_course_limit CHECK (max_course_limit > 0)
);

-- Master Courses Catalog
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(30) NOT NULL UNIQUE,     -- e.g., 'CS-101', 'CS-302'
    title VARCHAR(200) NOT NULL,                 -- e.g., 'Object Oriented Programming'
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
    theory_credit_hours NUMERIC(3, 1) NOT NULL DEFAULT 3.0,
    lab_credit_hours NUMERIC(3, 1) NOT NULL DEFAULT 0.0,
    theory_contact_hours NUMERIC(3, 1) NOT NULL DEFAULT 3.0,
    lab_contact_hours NUMERIC(3, 1) NOT NULL DEFAULT 0.0,
    course_type course_component_enum NOT NULL DEFAULT 'theory',
    recommended_semester INT DEFAULT 1,
    is_elective BOOLEAN NOT NULL DEFAULT FALSE,
    prerequisite_course_codes TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_positive_credits CHECK (theory_credit_hours >= 0 AND lab_credit_hours >= 0),
    CONSTRAINT chk_total_credits CHECK ((theory_credit_hours + lab_credit_hours) > 0)
);

-- Course Offerings in an Academic Session for a Programme
CREATE TABLE course_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    semester_number INT NOT NULL,
    expected_sections INT NOT NULL DEFAULT 1,
    is_offered BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_programme_course UNIQUE (session_id, programme_id, course_id),
    CONSTRAINT chk_expected_sections CHECK (expected_sections >= 1)
);

-- Workload Compliance Rules per Designation / Employment Type
CREATE TABLE workload_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation faculty_designation_enum NOT NULL,
    employment_type employment_type_enum NOT NULL,
    min_credit_hours NUMERIC(4, 1) NOT NULL,
    max_credit_hours NUMERIC(4, 1) NOT NULL,
    max_preparations INT NOT NULL DEFAULT 2,
    max_contact_hours NUMERIC(4, 1) NOT NULL DEFAULT 18.0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rule_designation_type UNIQUE (designation, employment_type),
    CONSTRAINT chk_workload_bounds CHECK (max_credit_hours >= min_credit_hours AND min_credit_hours >= 0)
);

-- =============================================================================
-- 4. CORE ALLOCATION ENGINE & CONFLICT AUDITING
-- =============================================================================

-- Master Course Allocations
CREATE TABLE course_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    component_type course_component_enum NOT NULL, -- 'theory', 'lab'
    assigned_credit_hours NUMERIC(3, 1) NOT NULL,
    assigned_contact_hours NUMERIC(3, 1) NOT NULL,
    status allocation_status_enum NOT NULL DEFAULT 'draft',
    allocated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Prevent duplicate allocation of the exact same component for a section
    CONSTRAINT uq_section_course_component UNIQUE (section_id, course_id, component_type),
    CONSTRAINT chk_assigned_hours CHECK (assigned_credit_hours >= 0 AND assigned_contact_hours >= 0)
);

-- Allocation Versioning & Audit History
CREATE TABLE allocation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES course_allocations(id) ON DELETE CASCADE,
    previous_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    new_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    previous_status allocation_status_enum,
    new_status allocation_status_enum,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT NOT NULL,
    snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Engine Detected Conflicts & Violations
CREATE TABLE conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    allocation_id UUID REFERENCES course_allocations(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    conflict_type conflict_type_enum NOT NULL,
    severity conflict_severity_enum NOT NULL DEFAULT 'warning',
    message TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System-Wide Activity Log
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,        -- 'ALLOCATION_CREATED', 'STATUS_UPDATED', 'CONFLICT_RESOLVED'
    entity_name VARCHAR(100) NOT NULL,        -- 'course_allocations', 'faculty', 'courses'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. PERFORMANCE INDEXES
-- =============================================================================

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(system_role);

CREATE INDEX idx_team_permissions_user ON team_permissions(user_id);
CREATE INDEX idx_team_scope_lookup ON team_scope(user_id, scope_level);
CREATE INDEX idx_team_scope_programme ON team_scope(programme_id);
CREATE INDEX idx_team_scope_semester ON team_scope(semester_id);
CREATE INDEX idx_team_scope_section ON team_scope(section_id);

CREATE INDEX idx_semesters_lookup ON semesters(programme_id, session_id);
CREATE INDEX idx_sections_semester ON sections(semester_id);

CREATE INDEX idx_faculty_designation ON faculty(designation);
CREATE INDEX idx_faculty_employment ON faculty(employment_type);
CREATE INDEX idx_faculty_user_id ON faculty(user_id);

CREATE INDEX idx_course_offerings_lookup ON course_offerings(session_id, programme_id);
CREATE INDEX idx_course_offerings_course ON course_offerings(course_id);

CREATE INDEX idx_allocations_session_fac ON course_allocations(session_id, faculty_id);
CREATE INDEX idx_allocations_section ON course_allocations(section_id);
CREATE INDEX idx_allocations_course ON course_allocations(course_id);
CREATE INDEX idx_allocations_status ON course_allocations(status);

CREATE INDEX idx_allocation_history_alloc_id ON allocation_history(allocation_id);
CREATE INDEX idx_conflicts_session_faculty ON conflicts(session_id, faculty_id);
CREATE INDEX idx_conflicts_unresolved ON conflicts(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_name, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =============================================================================
-- 6. AUTOMATED TIMESTAMP & AUDIT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_academic_sessions_updated_at BEFORE UPDATE ON academic_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_programmes_updated_at BEFORE UPDATE ON programmes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_semesters_updated_at BEFORE UPDATE ON semesters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sections_updated_at BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_team_scope_updated_at BEFORE UPDATE ON team_scope FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_faculty_updated_at BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_visiting_faculty_updated_at BEFORE UPDATE ON visiting_faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_course_offerings_updated_at BEFORE UPDATE ON course_offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_workload_rules_updated_at BEFORE UPDATE ON workload_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_course_allocations_updated_at BEFORE UPDATE ON course_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_conflicts_updated_at BEFORE UPDATE ON conflicts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger for allocation changes
CREATE OR REPLACE FUNCTION log_allocation_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.faculty_id IS DISTINCT FROM NEW.faculty_id OR OLD.status IS DISTINCT FROM NEW.status) THEN
            INSERT INTO allocation_history (
                allocation_id,
                previous_faculty_id,
                new_faculty_id,
                previous_status,
                new_status,
                changed_by,
                change_reason,
                snapshot_data
            ) VALUES (
                NEW.id,
                OLD.faculty_id,
                NEW.faculty_id,
                OLD.status,
                NEW.status,
                NEW.allocated_by,
                COALESCE(NEW.remarks, 'Allocation modification logged automatically'),
                json_build_object(
                    'old_faculty_id', OLD.faculty_id,
                    'new_faculty_id', NEW.faculty_id,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'assigned_credit_hours', NEW.assigned_credit_hours
                )::jsonb
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_allocation_change
AFTER UPDATE ON course_allocations
FOR EACH ROW EXECUTE FUNCTION log_allocation_changes();

-- =============================================================================
-- 7. REALISTIC SEED DATA (CS Department Showcase)
-- =============================================================================

DO $$
DECLARE
    -- User IDs
    v_uid_admin UUID := 'a0000000-0000-0000-0000-000000000001';
    v_uid_hod UUID   := 'a0000000-0000-0000-0000-000000000002';
    v_uid_convener UUID := 'a0000000-0000-0000-0000-000000000003';
    v_uid_fac1 UUID  := 'a0000000-0000-0000-0000-000000000004';
    v_uid_fac2 UUID  := 'a0000000-0000-0000-0000-000000000005';
    v_uid_fac3 UUID  := 'a0000000-0000-0000-0000-000000000006';
    v_uid_visiting UUID := 'a0000000-0000-0000-0000-000000000007';

    -- Academic Session
    v_session_fa25 UUID := 'b0000000-0000-0000-0000-000000000001';
    v_session_sp26 UUID := 'b0000000-0000-0000-0000-000000000002';

    -- Programmes
    v_prog_bscs UUID := 'c0000000-0000-0000-0000-000000000001';
    v_prog_bsse UUID := 'c0000000-0000-0000-0000-000000000002';
    v_prog_mscs UUID := 'c0000000-0000-0000-0000-000000000003';

    -- Semesters
    v_sem_bscs_3 UUID := 'd0000000-0000-0000-0000-000000000001';
    v_sem_bscs_5 UUID := 'd0000000-0000-0000-0000-000000000002';
    v_sem_bsse_3 UUID := 'd0000000-0000-0000-0000-000000000003';

    -- Sections
    v_sec_bscs_3a UUID := 'e0000000-0000-0000-0000-000000000001';
    v_sec_bscs_3b UUID := 'e0000000-0000-0000-0000-000000000002';
    v_sec_bscs_5a UUID := 'e0000000-0000-0000-0000-000000000003';
    v_sec_bsse_3a UUID := 'e0000000-0000-0000-0000-000000000004';

    -- Faculty IDs
    v_fac_hod UUID   := 'f0000000-0000-0000-0000-000000000001';
    v_fac_prof UUID  := 'f0000000-0000-0000-0000-000000000002';
    v_fac_asst UUID  := 'f0000000-0000-0000-0000-000000000003';
    v_fac_lect UUID  := 'f0000000-0000-0000-0000-000000000004';
    v_fac_visit UUID := 'f0000000-0000-0000-0000-000000000005';

    -- Courses
    v_course_dsa  UUID := '10000000-0000-0000-0000-000000000001';
    v_course_db   UUID := '10000000-0000-0000-0000-000000000002';
    v_course_os   UUID := '10000000-0000-0000-0000-000000000003';
    v_course_ai   UUID := '10000000-0000-0000-0000-000000000004';
    v_course_adv_algo UUID := '10000000-0000-0000-0000-000000000005';

    -- Offerings
    v_off_dsa UUID := '20000000-0000-0000-0000-000000000001';
    v_off_db  UUID := '20000000-0000-0000-0000-000000000002';
    v_off_os  UUID := '20000000-0000-0000-0000-000000000003';

    -- Allocations
    v_alloc_1 UUID := '30000000-0000-0000-0000-000000000001';
    v_alloc_2 UUID := '30000000-0000-0000-0000-000000000002';
    v_alloc_3 UUID := '30000000-0000-0000-0000-000000000003';
BEGIN

    -- 1. Insert Users
    INSERT INTO users (id, email, encrypted_password, is_active) VALUES
    (v_uid_admin,    'admin@cs.university.edu',     crypt('Admin@123', gen_salt('bf')), TRUE),
    (v_uid_hod,      'hod.cs@university.edu',       crypt('Hod@123', gen_salt('bf')),   TRUE),
    (v_uid_convener, 'convener.cs@university.edu',  crypt('Conv@123', gen_salt('bf')),  TRUE),
    (v_uid_fac1,     'dr.shafiq@university.edu',    crypt('Fac@123', gen_salt('bf')),   TRUE),
    (v_uid_fac2,     'dr.amina@university.edu',     crypt('Fac@123', gen_salt('bf')),   TRUE),
    (v_uid_fac3,     'engr.bilal@university.edu',   crypt('Fac@123', gen_salt('bf')),   TRUE),
    (v_uid_visiting, 'zainab.visiting@industry.org',crypt('Fac@123', gen_salt('bf')),   TRUE);

    -- 2. Insert Profiles
    INSERT INTO profiles (user_id, full_name, employee_code, phone_number, system_role, department) VALUES
    (v_uid_admin,    'System Administrator', 'EMP-001', '+923001111111', 'admin',          'Computer Science'),
    (v_uid_hod,      'Dr. Kamran Malik',     'EMP-002', '+923002222222', 'hod',            'Computer Science'),
    (v_uid_convener, 'Dr. Sarah Ahmed',      'EMP-003', '+923003333333', 'convener',       'Computer Science'),
    (v_uid_fac1,     'Dr. Shafiq Ur Rehman', 'EMP-101', '+923004444444', 'faculty_member', 'Computer Science'),
    (v_uid_fac2,     'Dr. Amina Tariq',      'EMP-102', '+923005555555', 'faculty_member', 'Computer Science'),
    (v_uid_fac3,     'Engr. Bilal Hassan',   'EMP-103', '+923006666666', 'faculty_member', 'Computer Science'),
    (v_uid_visiting, 'Ms. Zainab Farooq',    'VIS-201', '+923007777777', 'faculty_member', 'Computer Science');

    -- 3. Insert Permissions
    INSERT INTO team_permissions (user_id, permission_code, granted_by) VALUES
    (v_uid_convener, 'allocations.create', v_uid_hod),
    (v_uid_convener, 'allocations.edit',   v_uid_hod),
    (v_uid_convener, 'allocations.propose',v_uid_hod),
    (v_uid_hod,      'allocations.approve',v_uid_admin);

    -- 4. Academic Sessions
    INSERT INTO academic_sessions (id, session_code, name, start_date, end_date, is_current, is_locked) VALUES
    (v_session_fa25, 'FA25', 'Fall Semester 2025',   '2025-09-01', '2026-01-20', TRUE,  FALSE),
    (v_session_sp26, 'SP26', 'Spring Semester 2026', '2026-02-01', '2026-06-25', FALSE, TRUE);

    -- 5. Programmes
    INSERT INTO programmes (id, code, name, department, degree_level, total_semesters) VALUES
    (v_prog_bscs, 'BSCS', 'Bachelor of Science in Computer Science',   'Computer Science', 'Undergraduate', 8),
    (v_prog_bsse, 'BSSE', 'Bachelor of Science in Software Engineering', 'Software Engineering', 'Undergraduate', 8),
    (v_prog_mscs, 'MSCS', 'Master of Science in Computer Science',     'Computer Science', 'Graduate', 4);

    -- 6. Semesters
    INSERT INTO semesters (id, programme_id, session_id, semester_number, is_active) VALUES
    (v_sem_bscs_3, v_prog_bscs, v_session_fa25, 3, TRUE),
    (v_sem_bscs_5, v_prog_bscs, v_session_fa25, 5, TRUE),
    (v_sem_bsse_3, v_prog_bsse, v_session_fa25, 3, TRUE);

    -- 7. Sections
    INSERT INTO sections (id, semester_id, name, student_count, shift, room_preference) VALUES
    (v_sec_bscs_3a, v_sem_bscs_3, 'Section A', 45, 'Morning', 'Lab-3 / CS-LH1'),
    (v_sec_bscs_3b, v_sem_bscs_3, 'Section B', 42, 'Morning', 'Lab-2 / CS-LH2'),
    (v_sec_bscs_5a, v_sem_bscs_5, 'Section A', 38, 'Morning', 'CS-LH3'),
    (v_sec_bsse_3a, v_sem_bsse_3, 'Section A', 40, 'Morning', 'SE-LH1');

    -- 8. Team Scope (Assign Convener scope over BSCS & Semester 3)
    INSERT INTO team_scope (user_id, scope_level, programme_id, semester_id, section_id, can_read, can_write, can_approve) VALUES
    (v_uid_convener, 'programme', v_prog_bscs, NULL,          NULL,          TRUE, TRUE, FALSE),
    (v_uid_convener, 'semester',  v_prog_bscs, v_sem_bscs_3,  NULL,          TRUE, TRUE, TRUE);

    -- 9. Workload Compliance Rules
    INSERT INTO workload_rules (designation, employment_type, min_credit_hours, max_credit_hours, max_preparations, max_contact_hours, description) VALUES
    ('Professor',           'full_time', 6.0, 9.0,  2, 12.0, 'Senior faculty with heavy research commitments'),
    ('Associate Professor', 'full_time', 9.0, 12.0, 2, 15.0, 'Core faculty balancing teaching and graduate supervision'),
    ('Assistant Professor', 'full_time', 9.0, 12.0, 3, 18.0, 'Undergraduate & graduate core instruction'),
    ('Lecturer',            'full_time', 12.0, 15.0, 3, 20.0, 'Primary focus on undergraduate theory & labs'),
    ('Lab Engineer',        'full_time', 12.0, 18.0, 3, 24.0, 'Lab demonstrations and practical evaluation'),
    ('Lecturer',            'visiting',  3.0, 6.0,  1, 8.0,  'Industry specialists taking evening/elective modules');

    -- 10. Faculty
    INSERT INTO faculty (id, user_id, faculty_code, full_name, email, phone, designation, employment_type, specialization, min_credit_hours, max_credit_hours, max_preparations) VALUES
    (v_fac_hod,   v_uid_hod,   'FAC-001', 'Dr. Kamran Malik',     'hod.cs@university.edu',       '+923002222222', 'Professor',           'full_time', ARRAY['Distributed Systems', 'Cloud Computing'], 3.0, 6.0, 1),
    (v_fac_prof,  v_uid_fac1,  'FAC-002', 'Dr. Shafiq Ur Rehman', 'dr.shafiq@university.edu',    '+923004444444', 'Professor',           'full_time', ARRAY['Algorithms', 'Theory of Computation'], 6.0, 9.0, 2),
    (v_fac_asst,  v_uid_fac2,  'FAC-003', 'Dr. Amina Tariq',      'dr.amina@university.edu',     '+923005555555', 'Assistant Professor', 'full_time', ARRAY['Database Systems', 'Data Science'], 9.0, 12.0, 2),
    (v_fac_lect,  v_uid_fac3,  'FAC-004', 'Engr. Bilal Hassan',   'engr.bilal@university.edu',   '+923006666666', 'Lecturer',            'full_time', ARRAY['Data Structures', 'C++ Programming'], 12.0, 15.0, 3),
    (v_fac_visit, v_uid_visiting,'VIS-001','Ms. Zainab Farooq',   'zainab.visiting@industry.org','+923007777777', 'Lecturer',            'visiting',  ARRAY['DevOps', 'Cloud Architecture'], 3.0, 6.0, 1);

    -- 11. Visiting Faculty Details
    INSERT INTO visiting_faculty (faculty_id, primary_institution, highest_degree, contract_start_date, contract_end_date, hourly_remuneration, max_course_limit, approved_by) VALUES
    (v_fac_visit, 'TechCorp Global Solutions', 'MS Software Engineering', '2025-09-01', '2026-01-31', 3500.00, 2, v_uid_hod);

    -- 12. Courses
    INSERT INTO courses (id, course_code, title, department, theory_credit_hours, lab_credit_hours, theory_contact_hours, lab_contact_hours, course_type, recommended_semester, prerequisite_course_codes) VALUES
    (v_course_dsa,      'CS-201', 'Data Structures & Algorithms', 'Computer Science', 3.0, 1.0, 3.0, 3.0, 'hybrid', 3, ARRAY['CS-101']),
    (v_course_db,       'CS-202', 'Database Systems',             'Computer Science', 3.0, 1.0, 3.0, 3.0, 'hybrid', 3, ARRAY['CS-201']),
    (v_course_os,       'CS-301', 'Operating Systems',            'Computer Science', 3.0, 1.0, 3.0, 3.0, 'hybrid', 5, ARRAY['CS-201']),
    (v_course_ai,       'CS-305', 'Artificial Intelligence',      'Computer Science', 3.0, 0.0, 3.0, 0.0, 'theory', 5, ARRAY['CS-201']),
    (v_course_adv_algo, 'CS-701', 'Advanced Analysis of Algorithms','Computer Science',3.0, 0.0, 3.0, 0.0, 'theory', 1, ARRAY[]::TEXT[]);

    -- 13. Course Offerings (FA25)
    INSERT INTO course_offerings (id, session_id, programme_id, course_id, semester_number, expected_sections) VALUES
    (v_off_dsa, v_session_fa25, v_prog_bscs, v_course_dsa, 3, 2),
    (v_off_db,  v_session_fa25, v_prog_bscs, v_course_db,  3, 2),
    (v_off_os,  v_session_fa25, v_prog_bscs, v_course_os,  5, 1);

    -- 14. Course Allocations
    INSERT INTO course_allocations (id, session_id, course_offering_id, course_id, section_id, faculty_id, component_type, assigned_credit_hours, assigned_contact_hours, status, allocated_by, remarks) VALUES
    (v_alloc_1, v_session_fa25, v_off_dsa, v_course_dsa, v_sec_bscs_3a, v_fac_prof, 'theory', 3.0, 3.0, 'approved', v_uid_convener, 'Dr. Shafiq assigned core DSA theory'),
    (v_alloc_2, v_session_fa25, v_off_dsa, v_course_dsa, v_sec_bscs_3a, v_fac_lect, 'lab',    1.0, 3.0, 'approved', v_uid_convener, 'Engr. Bilal taking DSA practical lab'),
    (v_alloc_3, v_session_fa25, v_off_db,  v_course_db,  v_sec_bscs_3a, v_fac_asst, 'theory', 3.0, 3.0, 'proposed', v_uid_convener, 'Dr. Amina proposed for DB Systems');

    -- 15. Initial Conflict Detection Example
    INSERT INTO conflicts (session_id, allocation_id, faculty_id, conflict_type, severity, message, details, is_resolved) VALUES
    (v_session_fa25, v_alloc_3, v_fac_asst, 'workload_underflow', 'info',
     'Faculty total allocated hours (3.0) is currently below minimum required quota (9.0)',
     json_build_object(
        'current_hours', 3.0,
        'min_required', 9.0,
        'missing_hours', 6.0
     )::jsonb,
     FALSE);

    -- 16. Activity Log Entry
    INSERT INTO activity_logs (user_id, action_type, entity_name, entity_id, old_values, new_values, ip_address) VALUES
    (v_uid_convener, 'ALLOCATION_CREATED', 'course_allocations', v_alloc_1, NULL,
     json_build_object('course_code', 'CS-201', 'section', 'BSCS-3A', 'faculty', 'Dr. Shafiq Ur Rehman')::jsonb,
     '192.168.1.50');

END $$;

-- =============================================================================
-- 8. USEFUL DATABASE VIEWS FOR SERN BACKEND
-- =============================================================================

-- View 1: Faculty Workload Summary per Session
CREATE OR REPLACE VIEW view_faculty_workload_summary AS
SELECT 
    f.id AS faculty_id,
    f.faculty_code,
    f.full_name,
    f.designation,
    f.employment_type,
    f.min_credit_hours,
    f.max_credit_hours,
    s.id AS session_id,
    s.session_code,
    COALESCE(SUM(ca.assigned_credit_hours), 0) AS total_allocated_credit_hours,
    COALESCE(SUM(ca.assigned_contact_hours), 0) AS total_allocated_contact_hours,
    COUNT(DISTINCT ca.course_id) AS total_preparations,
    COUNT(ca.id) AS total_allocations,
    CASE 
        WHEN COALESCE(SUM(ca.assigned_credit_hours), 0) > f.max_credit_hours THEN 'OVERLOADED'
        WHEN COALESCE(SUM(ca.assigned_credit_hours), 0) < f.min_credit_hours THEN 'UNDERLOADED'
        ELSE 'OPTIMAL'
    END AS workload_status
FROM faculty f
CROSS JOIN academic_sessions s
LEFT JOIN course_allocations ca ON ca.faculty_id = f.id AND ca.session_id = s.id AND ca.status != 'rejected'
WHERE f.is_active = TRUE
GROUP BY f.id, f.faculty_code, f.full_name, f.designation, f.employment_type, f.min_credit_hours, f.max_credit_hours, s.id, s.session_code;

-- View 2: Complete Course Allocation Grid
CREATE OR REPLACE VIEW view_section_allocation_grid AS
SELECT 
    ca.id AS allocation_id,
    sess.session_code,
    prog.code AS programme_code,
    sem.semester_number,
    sec.name AS section_name,
    c.course_code,
    c.title AS course_title,
    ca.component_type,
    ca.assigned_credit_hours,
    ca.assigned_contact_hours,
    f.faculty_code,
    f.full_name AS faculty_name,
    f.designation AS faculty_designation,
    ca.status AS allocation_status,
    ca.remarks
FROM course_allocations ca
JOIN academic_sessions sess ON sess.id = ca.session_id
JOIN sections sec ON sec.id = ca.section_id
JOIN semesters sem ON sem.id = sec.semester_id
JOIN programmes prog ON prog.id = sem.programme_id
JOIN courses c ON c.id = ca.course_id
JOIN faculty f ON f.id = ca.faculty_id;
