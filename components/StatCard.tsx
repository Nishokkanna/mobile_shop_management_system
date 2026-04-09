export default function StatCard({
  title,
  value,
  icon,
  color = 'blue',
}: {
  title: string
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'orange' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-ibm-blue-600 text-white shadow-blue-200',
    green: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-200',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-200',
    red: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-200',
  }

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ibm-gray-60 mb-2 uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-ibm-gray-100 bg-gradient-to-r from-ibm-blue-600 to-ibm-blue-800 bg-clip-text text-transparent">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
