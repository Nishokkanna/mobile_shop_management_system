'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple auth - replace with proper authentication
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true')
      router.push('/dashboard')
    } else {
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ibm-blue-800 via-ibm-blue-700 to-ibm-blue-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      <div className="card w-full max-w-md relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <img src="/logo.png" alt="Sri Sai Mobiles" className="w-full h-full object-contain drop-shadow-xl" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-80 bg-clip-text text-transparent mb-2">Sri Sai Mobiles</h1>
          <p className="text-ibm-gray-60 font-medium">Admin Dashboard Portal</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-ibm-gray-90 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ibm-gray-90 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full text-lg py-3">
            Sign In
          </button>
        </form>
        <div className="mt-6 p-4 bg-ibm-blue-50 rounded-lg border border-ibm-blue-200">
          <p className="text-xs text-ibm-gray-70 text-center font-medium">
            Default credentials: <span className="font-bold">admin</span> / <span className="font-bold">admin123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
