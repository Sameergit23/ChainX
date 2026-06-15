# Verification System Setup Guide

This document explains the complete verification and registration system implementation.

## Overview

The system implements:
1. **Multi-step registration** with all mandatory details
2. **Admin verification panel** for backend team review
3. **User ID generation** (10 digits for contractors, 8 for workers)
4. **Credential delivery** via Email/WhatsApp/SMS
5. **Password change requirement** on first login

## Database Setup

### Step 1: Run the SQL scripts

1. Run `scripts/001_create_tables.sql` (if not already done)
2. Run `scripts/002_create_trigger.sql` (if not already done)
3. Run `scripts/003_add_verification_schema.sql` (NEW - adds verification fields)

```sql
-- Run in Supabase SQL Editor
-- This adds all verification-related columns and tables
```

### Step 2: Create Storage Bucket

Create a storage bucket in Supabase for user documents:

```sql
-- In Supabase Storage, create bucket named "user-documents"
-- Set it to private or public based on your needs
-- Add RLS policies if private
```

Or via Supabase Dashboard:
1. Go to Storage
2. Create bucket: `user-documents`
3. Set privacy level (public recommended for now)
4. Add policies if needed

## Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
```

**⚠️ IMPORTANT**: The service role key should NEVER be exposed to the client. It's only used in server-side API routes.

## Admin Access Setup

### Create Admin User

Run this SQL in Supabase to create an admin user:

```sql
-- First, create a user in Supabase Auth dashboard manually
-- Then run this to add them as admin:

INSERT INTO public.admin_users (id, email, full_name, role, is_active)
VALUES (
  'user-uuid-from-auth-users',  -- Get from auth.users table
  'admin@chainx.com',
  'Admin User',
  'super_admin',
  TRUE
);
```

Or via the Supabase dashboard:
1. Go to Authentication → Users
2. Create a new user (or use existing)
3. Copy the user UUID
4. Insert into `admin_users` table

## Features

### 1. Registration Flow

**Route**: `/auth/register`

- **Step 1**: Basic info (name, email, phone, user type)
- **Step 2**: Personal details (DOB, address, emergency contact, etc.)
- **Step 3**: Documents (Aadhar front/back, photo)

After submission:
- User account created with temporary password
- Profile saved with all details
- Added to verification queue
- Redirected to success page

### 2. Admin Verification Panel

**Route**: `/admin/verification`

Features:
- View all pending/approved/rejected users
- Filter by status
- Review all user details and documents
- Approve or reject users
- Auto-generate User ID (10 digits contractor, 8 digits worker)
- Send credentials via email/WhatsApp/SMS

### 3. Credential Sending

When admin approves:
1. User ID generated automatically
2. Temporary password set
3. Credentials sent via chosen method (email/WhatsApp/SMS)
4. Logged in `credential_logs` table

**⚠️ TODO**: Integrate actual services:
- **Email**: SendGrid, Resend, AWS SES
- **WhatsApp**: Twilio WhatsApp API
- **SMS**: Twilio SMS, AWS SNS

Current implementation logs to console - replace with actual service calls.

### 4. Login & Password Change

**Login Flow**:
1. User logs in with received credentials
2. System checks verification status
3. If verified but has temp password → redirect to change password
4. If not verified → show appropriate message
5. After password change → redirect to dashboard

**Change Password Route**: `/auth/change-password`

- Requires current (temporary) password
- Validates new password strength
- Updates password in Supabase Auth
- Marks `has_temp_password = false`

## Integration Points

### Email Service (Example: Resend)

```typescript
// In app/api/send-credentials/route.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'ChainX <noreply@chainx.com>',
  to: email,
  subject: 'Your ChainX Account Credentials',
  html: `
    <h2>Welcome to ChainX!</h2>
    <p>Your account has been verified.</p>
    <p><strong>User ID:</strong> ${generatedUserId}</p>
    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p>Login at: https://chainx.com/auth/login</p>
  `
})
```

### WhatsApp (Example: Twilio)

```typescript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

await client.messages.create({
  from: 'whatsapp:+14155238886',
  to: `whatsapp:${phone}`,
  body: `ChainX: User ID: ${generatedUserId}, Password: ${tempPassword}`
})
```

### SMS (Example: Twilio)

```typescript
await client.messages.create({
  from: '+1234567890',
  to: phone,
  body: `ChainX: User ID: ${generatedUserId}, Password: ${tempPassword}`
})
```

## User ID Format

- **Contractors**: 10 digits (e.g., `1234567890`)
- **Workers**: 8 digits (e.g., `12345678`)

Generated automatically using PostgreSQL function `generate_user_id(user_type)`.

## Security Considerations

1. **Service Role Key**: Never expose to client. Only use in server routes.
2. **File Uploads**: Validate file types and sizes on server.
3. **Admin Access**: Add authentication middleware to `/admin/*` routes.
4. **Rate Limiting**: Add rate limiting to registration endpoint.
5. **Email Validation**: Verify email addresses before sending credentials.

## Next Steps

1. ✅ Database schema created
2. ✅ Registration form implemented
3. ✅ Admin panel created
4. ✅ User ID generation implemented
5. ✅ Password change flow implemented
6. ⚠️ **TODO**: Integrate actual email/WhatsApp/SMS services
7. ⚠️ **TODO**: Add admin authentication middleware
8. ⚠️ **TODO**: Add file upload validation on server
9. ⚠️ **TODO**: Add rate limiting
10. ⚠️ **TODO**: Set up storage bucket policies

## Testing

1. Register a new user via `/auth/register`
2. Check verification queue in Supabase
3. Login as admin and go to `/admin/verification`
4. Approve the user
5. Check `credential_logs` table for sent credentials
6. Try logging in with the credentials
7. Should redirect to password change page
8. Change password and verify redirect to dashboard

## Troubleshooting

**Issue**: "generate_user_id function not found"
- **Solution**: Run `scripts/003_add_verification_schema.sql` completely

**Issue**: "Storage bucket not found"
- **Solution**: Create `user-documents` bucket in Supabase Storage

**Issue**: "Service role key error"
- **Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

**Issue**: "Admin can't access verification panel"
- **Solution**: Verify user exists in `admin_users` table with `is_active = TRUE`

