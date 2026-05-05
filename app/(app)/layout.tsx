export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-screen bg-slate-50">{children}</div>;
}
