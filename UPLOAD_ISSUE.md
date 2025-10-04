# Upload Flow Issue - Storage RLS Policy Blocking Uploads

## Problem Summary
File uploads are failing with error: **"Upload failed: new row violates row-level security policy"**

Despite moving all database operations to server-side APIs (which successfully bypass RLS), the **storage upload** is still blocked by RLS policies.

## Root Cause
**Supabase Storage bucket RLS policies use `auth.uid()` which returns `null` for Clerk-authenticated users.**

- Users authenticate with **Clerk** (not Supabase Auth)
- Clerk provides `userId` to our APIs
- But Supabase storage policies check `auth.uid()` (Supabase's auth system)
- Since users aren't in Supabase Auth, `auth.uid()` = `null`
- Policies fail and block uploads

## Current Architecture

### ✅ Working (Server-side with admin client):
```
/api/users/ensure          - Creates user if missing (bypasses RLS)
/api/content/check-duplicate - Checks for SHA-256 duplicates (bypasses RLS)
/api/content/create        - Creates content record (bypasses RLS)
/api/receipts/create       - Generates receipt (bypasses RLS)
```

### ❌ Broken (Client-side storage upload):
```javascript
// File: app/dashboard/upload/page.tsx:87-95
const { error: uploadError } = await supabase.storage
  .from('content-uploads')
  .upload(filePath, file)

// Uses anon key → auth.uid() = null → RLS policies fail
```

## Storage Bucket Configuration

**Bucket:** `content-uploads`
**Current RLS Policies:**

### Policy 1 - INSERT (Allow user uploads to own folder)
```sql
((bucket_id = 'content-uploads'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```
❌ **Problem:** `auth.uid()` is null for Clerk users

### Policy 2 - SELECT (Allow users to read own files)
```sql
((bucket_id = 'content-uploads'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```
❌ **Problem:** Same issue

### Policy 3 - DELETE (Allow users to delete own files)
```sql
((bucket_id = 'content-uploads'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```
❌ **Problem:** Same issue

## Solution Options

### Option 1: Make Storage Bucket Public (Quick Fix)
**Location:** Supabase Dashboard → Storage → content-uploads → Policies

Replace all 3 policies with:
```sql
true
```

**Pros:**
- Immediate fix
- No code changes

**Cons:**
- Anyone can upload/read/delete (security risk)
- Not production-ready

### Option 2: Server-Side Storage Upload (Recommended)
Move storage upload to API route using service role key.

**Changes needed:**

1. **Create `/api/storage/upload` endpoint:**
```typescript
// app/api/storage/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const fileName = formData.get('fileName') as string

  const supabase = createAdminClient()

  const { error } = await supabase.storage
    .from('content-uploads')
    .upload(`${userId}/${fileName}`, file)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, path: `${userId}/${fileName}` })
}
```

2. **Update upload page (app/dashboard/upload/page.tsx:87-95):**
```typescript
// Replace direct storage upload:
const formData = new FormData()
formData.append('file', file)
formData.append('fileName', fileName)

const uploadResponse = await fetch('/api/storage/upload', {
  method: 'POST',
  body: formData,
})

if (!uploadResponse.ok) {
  const errorData = await uploadResponse.json()
  throw new Error(`Upload failed: ${errorData.error}`)
}

const { path: storagePath } = await uploadResponse.json()
```

**Pros:**
- Secure (uses service_role key, bypasses RLS)
- Consistent with other API routes
- Proper access control

**Cons:**
- Requires code changes
- File goes through server (might be slower for large files)

### Option 3: Sync Clerk Users to Supabase Auth (Complex)
Use Clerk webhooks to create matching Supabase Auth users.

**Not recommended** - Too complex for this use case.

## Files Affected

### Primary File with Issue:
- `app/dashboard/upload/page.tsx:87-95` - Direct storage upload

### Storage Policies:
- Supabase Dashboard → Storage → Buckets → content-uploads → Policies

### Related Files:
- `lib/supabase/client.ts` - Client-side Supabase (uses anon key)
- `lib/supabase/server.ts` - Server-side Supabase (has admin client)

## Recommended Fix for Codex

**Implement Option 2: Server-Side Storage Upload**

1. Create `app/api/storage/upload/route.ts` as shown above
2. Update `app/dashboard/upload/page.tsx` to use FormData and call `/api/storage/upload`
3. Storage policies can remain as-is (admin client bypasses them)

This maintains security while fixing the auth mismatch issue.

## Testing After Fix

1. Sign in to https://certnode.io/sign-in
2. Go to https://certnode.io/dashboard/upload
3. Upload test file (sample-photo.png or test-upload.png)
4. Should see:
   - ✅ SHA-256 hash computed
   - ✅ Duplicate check (no duplicates first time)
   - ✅ Storage upload succeeds
   - ✅ Content record created
   - ✅ Receipt generated
   - ✅ Redirect to /dashboard/receipts

## Environment Details

- **Auth:** Clerk (NOT Supabase Auth)
- **Database:** Supabase PostgreSQL with RLS
- **Storage:** Supabase Storage with RLS policies
- **Deployment:** Vercel
- **Current URL:** https://certnode-rn6nslmbk-steven-bryants-projects.vercel.app

## Contact
Created: 2025-10-04
Issue: Storage RLS blocking Clerk-authenticated users from uploading files
