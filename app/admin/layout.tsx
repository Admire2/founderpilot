// This layout isolates the admin routes from the main marketplace header/footer
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  )
}
