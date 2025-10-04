# Upload Flow Issue - Storage RLS Policy Blocking Uploads

## ✅ SOLUTION IMPLEMENTED (2025-10-04)

**Server-side storage upload has been implemented and deployed.**

All Supabase operations (database + storage) now go through server-side APIs using admin client (service_role key), completely bypassing RLS policies.

**Test the fix at:** https://certnode-ggxtyqcr5-steven-bryants-projects.vercel.app/dashboard/upload

⚠️ **IMPORTANT:** Make sure you're testing on the LATEST deployment URL above. Old deployment URLs won't have the fix.

---

## Problem Summary (RESOLVED)
File uploads were failing with error: **"Upload failed: new row violates row-level security policy"**

Despite moving all database operations to server-side APIs (which successfully bypass RLS), the **storage upload** was still blocked by RLS policies.

## Root Cause
**Supabase Storage bucket RLS policies use `auth.uid()` which returns `null` for Clerk-authenticated users.**

- Users authenticate with **Clerk** (not Supabase Auth)
- Clerk provides `userId` to our APIs
- But Supabase storage policies check `auth.uid()` (Supabase's auth system)
- Since users aren't in Supabase Auth, `auth.uid()` = `null`
- Policies fail and block uploads

## Final Architecture (ALL SERVER-SIDE)

### ✅ All Operations Server-Side with Admin Client:
```
/api/users/ensure          - Creates user if missing (bypasses RLS)
/api/content/check-duplicate - Checks for SHA-256 duplicates (bypasses RLS)
/api/storage/upload        - Uploads file to storage (bypasses RLS) ← NEW
/api/content/create        - Creates content record (bypasses RLS)
/api/receipts/create       - Generates receipt (bypasses RLS)
```

### ❌ Old Broken Approach (Client-side storage):
```javascript
// OLD: File: app/dashboard/upload/page.tsx:87-95
const { error: uploadError } = await supabase.storage
  .from('content-uploads')
  .upload(filePath, file)

// Uses anon key → auth.uid() = null → RLS policies fail
```

## Storage Bucket Configuration

**Bucket:** `content-uploads`
**Current RLS Policies:** ✅ **DELETED** (not needed with admin client)

All storage bucket policies were deleted because:
- Admin client (service_role key) bypasses ALL policies
- Client-side storage access is not used anywhere in the app
- All storage operations go through `/api/storage/upload` endpoint

**Supabase Dashboard Status:**
- CONTENT-UPLOADS bucket: No policies created
- OTHER POLICIES UNDER STORAGE.OBJECTS: No policies created
- POLICIES UNDER STORAGE.BUCKETS: No policies created

This is the correct configuration ✅

---

## Implementation Details

### ✅ Server-Side Storage Upload (IMPLEMENTED)

**File Created:** `app/api/storage/upload/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string

    if (!file || !fileName) {
      return NextResponse.json({ error: 'Missing file or fileName' }, { status: 400 })
    }

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    const supabase = createAdminClient()

    // Upload using admin client (bypasses RLS)
    const filePath = `${userId}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('content-uploads')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Storage Upload] Failed:', uploadError)
      return NextResponse.json({
        error: `Upload failed: ${uploadError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      storagePath: filePath
    })

  } catch (error) {
    console.error('[Storage Upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**File Updated:** `app/dashboard/upload/page.tsx` (lines 90-108)
```typescript
// OLD (client-side, blocked by RLS):
const { error: uploadError } = await supabase.storage
  .from('content-uploads')
  .upload(filePath, file)

// NEW (server-side via API, bypasses RLS):
const fileName = `${Date.now()}-${file.name}`

const uploadFormData = new FormData()
uploadFormData.append('file', file)
uploadFormData.append('fileName', fileName)

const uploadResponse = await fetch('/api/storage/upload', {
  method: 'POST',
  body: uploadFormData,
})

if (!uploadResponse.ok) {
  const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }))
  throw new Error(errorData.error || 'Upload failed')
}

const { storagePath } = await uploadResponse.json()
```

### Files Changed in Implementation

1. ✅ **Created:** `nextjs-pricing/app/api/storage/upload/route.ts`
2. ✅ **Modified:** `nextjs-pricing/app/dashboard/upload/page.tsx`
   - Removed direct client-side storage upload
   - Added FormData upload to `/api/storage/upload`
   - Updated progress tracking for storage step

### Git Commit
```bash
git commit -m "feat: move storage upload to server-side API to bypass RLS

Final fix for upload flow - storage uploads now go through
/api/storage/upload endpoint using admin client.

This completes the architecture where ALL Supabase operations
(database + storage) use server-side APIs with service_role key,
bypassing RLS policies that conflict with Clerk authentication."
```

**Deployed:** https://certnode-ggxtyqcr5-steven-bryants-projects.vercel.app

## Testing Instructions

⚠️ **CRITICAL:** Make sure you're testing on the LATEST deployment URL:
**https://certnode-ggxtyqcr5-steven-bryants-projects.vercel.app**

Old deployment URLs (like `certnode-m6nslmbk-*` or `certnode-rn6nslmbk-*`) do NOT have the fix!

### Test Steps:
1. Sign in: https://certnode-ggxtyqcr5-steven-bryants-projects.vercel.app/sign-in
2. Go to upload: https://certnode-ggxtyqcr5-steven-bryants-projects.vercel.app/dashboard/upload
3. Upload test file (sample-photo.png or test-upload.png)
4. Expected flow:
   - ✅ SHA-256 hash computed (10%)
   - ✅ Duplicate check (20%)
   - ✅ Storage upload via /api/storage/upload (30-60%)
   - ✅ Content record created (60-80%)
   - ✅ Receipt generated with ES256 signature (80-100%)
   - ✅ Redirect to /dashboard/receipts

## Environment Details

- **Auth:** Clerk (NOT Supabase Auth)
- **Database:** Supabase PostgreSQL with RLS (admin client bypasses)
- **Storage:** Supabase Storage with NO policies (admin client has full access)
- **Deployment:** Vercel
- **Latest URL:** https://certnode-ggxtyqcr5-steven-bryants-projects.vercel.app
- **Supabase Project:** obasoslqkymvjyjbmlfv.supabase.co

## Key Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://obasoslqkymvjyjbmlfv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin access)
```

## Summary for Codex

**Problem:** Clerk-authenticated users couldn't upload files because Supabase RLS policies check `auth.uid()` which is null for Clerk users.

**Solution:** Moved ALL Supabase operations (database + storage) to server-side API routes that use `createAdminClient()` with service_role key, completely bypassing RLS.

**Status:** ✅ Implemented and deployed

**Test URL:** https://certnode-ggxtyqcr5-steven-bryants-projects.vercel.app/dashboard/upload

---

Created: 2025-10-04
Updated: 2025-10-04 (Solution implemented)
