'use client'

export default function Header({ 
  title, 
  onToggleSidebar 
}: { 
  title: string
  onToggleSidebar?: () => void 
}) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="bg-white border-b-2 border-ibm-gray-20 px-8 py-5 shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="text-2xl text-ibm-gray-70 hover:text-ibm-blue-600 transition-colors p-2 hover:bg-ibm-gray-10 rounded-lg"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-80 bg-clip-text text-transparent">{title}</h1>
            <p className="text-sm text-ibm-gray-60 mt-1 font-medium">{currentDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-ibm-gray-100">Admin User</p>
            <p className="text-xs text-ibm-gray-60 font-medium">Administrator</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-ibm-blue-600 to-ibm-blue-800 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
            A
          </div>
        </div>
      </div>
    </header>
  )
}
