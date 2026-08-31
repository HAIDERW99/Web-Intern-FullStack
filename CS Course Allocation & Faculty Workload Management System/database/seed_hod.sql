-- =============================================================================
-- CS Course Allocation & Faculty Workload Management System
-- Supabase SQL Seeding: Head of Department (HOD) User Account (Schema Matched)
-- Target File: /database/seed_hod.sql
-- =============================================================================
--
-- HOD ACCOUNT CREDENTIALS:
-- Email:    haiderwahla199@gmail.com
-- Password: HodSecure@2026!
-- Role:     hod (Head of Department / Full Administrative Authority)
-- Name:     Dr. Kamran Malik
-- =============================================================================

-- Ensure required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'haiderwahla199@gmail.com';
    v_password TEXT := 'HodSecure@2026!';
    v_hashed_password TEXT;
    v_name TEXT := 'Dr. Kamran Malik';
    v_code TEXT := 'FAC-HOD-001';
BEGIN
    -- Hash password using standard bcrypt salt (cost factor 10)
    v_hashed_password := crypt(v_password, gen_salt('bf', 10));

    -- Check if user already exists in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(v_email) LIMIT 1;

    -- If not found in auth.users, check public.users
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM public.users WHERE LOWER(email) = LOWER(v_email) LIMIT 1;
    END IF;

    -- If still null, generate a fresh UUID
    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
    END IF;

    -- =========================================================================
    -- 1. SUPABASE auth.users TABLE
    -- =========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id OR LOWER(email) = LOWER(v_email)) THEN
            -- Update existing auth user
            UPDATE auth.users
            SET 
                encrypted_password = v_hashed_password,
                email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', array['email']),
                raw_user_meta_data = jsonb_build_object(
                    'full_name', v_name,
                    'system_role', 'hod',
                    'employee_code', v_code,
                    'faculty_code', v_code,
                    'department', 'Department of Computer Science'
                ),
                updated_at = NOW()
            WHERE id = v_user_id OR LOWER(email) = LOWER(v_email);
        ELSE
            -- Insert new auth user
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                v_user_id,
                'authenticated',
                'authenticated',
                v_email,
                v_hashed_password,
                NOW(),
                jsonb_build_object('provider', 'email', 'providers', array['email']),
                jsonb_build_object(
                    'full_name', v_name,
                    'system_role', 'hod',
                    'employee_code', v_code,
                    'faculty_code', v_code,
                    'department', 'Department of Computer Science'
                ),
                NOW(),
                NOW(),
                '',
                ''
            );
        END IF;

        -- Link into auth.identities
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
            IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
                INSERT INTO auth.identities (
                    id,
                    user_id,
                    identity_data,
                    provider,
                    provider_id,
                    last_sign_in_at,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    v_user_id,
                    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
                    'email',
                    v_email,
                    NOW(),
                    NOW(),
                    NOW()
                );
            ELSE
                UPDATE auth.identities
                SET 
                    identity_data = jsonb_build_object('sub', v_user_id::text, 'email', v_email),
                    updated_at = NOW()
                WHERE user_id = v_user_id;
            END IF;
        END IF;
    END IF;

    -- =========================================================================
    -- 2. PUBLIC users TABLE
    -- =========================================================================
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id OR LOWER(email) = LOWER(v_email)) THEN
        UPDATE public.users
        SET 
            encrypted_password = v_hashed_password,
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = v_user_id OR LOWER(email) = LOWER(v_email);
    ELSE
        INSERT INTO public.users (
            id,
            email,
            encrypted_password,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_email,
            v_hashed_password,
            TRUE,
            NOW(),
            NOW()
        );
    END IF;

    -- =========================================================================
    -- 3. PUBLIC profiles TABLE
    -- =========================================================================
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id) THEN
        UPDATE public.profiles
        SET
            full_name = v_name,
            employee_code = v_code,
            system_role = 'hod'::user_role_enum,
            department = 'Department of Computer Science',
            updated_at = NOW()
        WHERE user_id = v_user_id;
    ELSE
        INSERT INTO public.profiles (
            id,
            user_id,
            full_name,
            employee_code,
            phone_number,
            avatar_url,
            system_role,
            department,
            bio,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            v_name,
            v_code,
            '+92-300-1234567',
            NULL,
            'hod'::user_role_enum,
            'Department of Computer Science',
            'Head of Department & Academic Workload Chairperson',
            NOW(),
            NOW()
        );
    END IF;

    -- =========================================================================
    -- 4. HOD PERMISSIONS (team_permissions)
    -- =========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_permissions') THEN
        INSERT INTO public.team_permissions (user_id, permission_code, granted_at)
        VALUES 
            (v_user_id, 'allocations.create', NOW()),
            (v_user_id, 'allocations.edit', NOW()),
            (v_user_id, 'allocations.approve', NOW()),
            (v_user_id, 'allocations.delete', NOW()),
            (v_user_id, 'workload.override', NOW()),
            (v_user_id, 'conflicts.resolve', NOW()),
            (v_user_id, 'faculty.manage', NOW()),
            (v_user_id, 'courses.manage', NOW()),
            (v_user_id, 'sessions.lock', NOW())
        ON CONFLICT (user_id, permission_code) DO NOTHING;
    END IF;

    -- =========================================================================
    -- 5. FACULTY TABLE SYNC (Column names: faculty_code, phone)
    -- =========================================================================
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faculty') THEN
        IF EXISTS (SELECT 1 FROM public.faculty WHERE faculty_code = v_code OR LOWER(email) = LOWER(v_email)) THEN
            UPDATE public.faculty
            SET 
                user_id = v_user_id,
                email = v_email,
                full_name = v_name,
                designation = 'Professor'::faculty_designation_enum,
                employment_type = 'full_time'::employment_type_enum,
                min_credit_hours = 3.0,
                max_credit_hours = 6.0,
                is_active = TRUE,
                updated_at = NOW()
            WHERE faculty_code = v_code OR LOWER(email) = LOWER(v_email);
        ELSE
            INSERT INTO public.faculty (
                id,
                user_id,
                faculty_code,
                full_name,
                email,
                phone,
                department,
                designation,
                employment_type,
                specialization,
                min_credit_hours,
                max_credit_hours,
                max_preparations,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_user_id,
                v_code,
                v_name,
                v_email,
                '+92-300-1234567',
                'Department of Computer Science',
                'Professor'::faculty_designation_enum,
                'full_time'::employment_type_enum,
                ARRAY['Distributed Systems', 'Cloud Computing', 'Operating Systems'],
                3.0,
                6.0,
                2,
                TRUE,
                NOW(),
                NOW()
            );
        END IF;
    END IF;

    RAISE NOTICE '====================================================';
    RAISE NOTICE 'SUCCESS: HOD User Account Seeded Successfully!';
    RAISE NOTICE 'User ID:  %', v_user_id;
    RAISE NOTICE 'Email:    %', v_email;
    RAISE NOTICE 'Password: %', v_password;
    RAISE NOTICE 'Role:     hod (Head of Department)';
    RAISE NOTICE '====================================================';
END $$;
