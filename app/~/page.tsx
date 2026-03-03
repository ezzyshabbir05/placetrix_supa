// app/~/page.tsx
// Required by Next.js parallel routes — the layout renders the
// correct named slot (@candidate, @institute, etc.) based on RBAC.
// This default children slot is intentionally empty.
export default function DashboardPage() {
  return null;
}