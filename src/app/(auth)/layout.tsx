export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Social Studio</h1>
          <p className="text-sm text-slate-500 mt-1">KI-gestütztes Social-Media-Management</p>
        </div>
        {children}
      </div>
    </div>
  )
}
