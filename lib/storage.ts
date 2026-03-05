/**
 * Derives a full URL from a Supabase Storage path or an external OAuth URL.
 *
 * Rules:
 *  - null/empty path            → null (show fallback)
 *  - starts with http/https     → external URL (Google, GitHub OAuth avatar) → return as-is
 *  - anything else              → treat as Supabase storage path → construct URL
 *
 * This keeps the DB portable: only paths are stored, and this single function
 * is the only place that knows about the Supabase URL. If you migrate projects,
 * change NEXT_PUBLIC_SUPABASE_URL — zero DB rows need updating.
 */
export function buildStorageUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null
  // OAuth provider avatars (Google, GitHub, etc.) arrive as full URLs
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  // Internal Supabase Storage path → construct deterministic public URL
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}
