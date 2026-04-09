'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import StatCard from '@/components/StatCard'
import { useSidebar } from './layout'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const { toggleSidebar } = useSidebar()
  const [stats, setStats] = useState({
    totalProducts: 0,
    soldToday: 0,
    pendingRepairs: 0,
    completedRepairs: 0,
    todayRepairRevenue: 0,
  })

  const [salesData, setSalesData] = useState<any[]>([])
  const [repairRevenueData, setRepairRevenueData] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [recentRepairs, setRecentRepairs] = useState<any[]>([])
  const [recentRecharges, setRecentRecharges] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    const [
      { data: products },
      { data: sales },
      { data: repairs },
      { data: completedRepairs },
      { data: recharges }
    ] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('repairs').select('*'),
      supabase.from('completed_repairs').select('*'),
      supabase.from('recharges').select('*')
    ])

    const productsList = products || []
    const salesList = sales || []
    const repairsList = repairs || []
    const completedList = completedRepairs || []
    const rechargesList = recharges || []

    const today = new Date().toDateString()
    
    // Calculate today's completed repairs
    const todayCompletedRepairs = completedList
      .filter((r: any) => new Date(r.repaired_date).toDateString() === today)
    
    // Calculate today's repair revenue
    const todayRepairRevenue = todayCompletedRepairs
      .reduce((sum: number, r: any) => sum + Number(r.estimated_cost || 0), 0)
    
    setStats({
      totalProducts: productsList.length,
      soldToday: salesList.filter((s: any) => new Date(s.sold_date).toDateString() === today).length,
      pendingRepairs: repairsList.length,
      completedRepairs: todayCompletedRepairs.length,
      todayRepairRevenue: todayRepairRevenue,
    })

    // Calculate weekly sales data
    const weeklySales = calculateWeeklyData(salesList, 'sold_date', 'price')
    setSalesData(weeklySales)

    // Calculate weekly repair revenue data
    const weeklyRepairs = calculateWeeklyData(completedList, 'repaired_date', 'estimated_cost')
    setRepairRevenueData(weeklyRepairs)

    // Set recent data
    setRecentSales(salesList.slice(-5).reverse())
    setRecentRepairs(completedList.slice(-5).reverse())
    setRecentRecharges(rechargesList.slice(-5).reverse())
    
    setIsLoading(false)
  }

  const calculateWeeklyData = (data: any[], dateField: string, valueField: string) => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weekData = daysOfWeek.map(day => ({ name: day, value: 0, count: 0 }))

    data.forEach((item: any) => {
      const date = new Date(item[dateField])
      const dayIndex = date.getDay()
      weekData[dayIndex].value += Number(item[valueField] || 0)
      weekData[dayIndex].count += 1
    })

    return weekData
  }

  const repairStatusData = [
    { name: 'Pending', value: stats.pendingRepairs || 0 },
    { name: 'Completed Today', value: stats.completedRepairs || 0 },
  ]

  const COLORS = ['#FF6B6B', '#4ECDC4']

  return (
    <div>
      <Header title="Dashboard" onToggleSidebar={toggleSidebar} />
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Products" value={stats.totalProducts} icon="📦" color="blue" />
          <StatCard title="Sold Today" value={stats.soldToday} icon="✅" color="green" />
          <StatCard title="Pending Repairs" value={stats.pendingRepairs} icon="⏳" color="orange" />
          <StatCard title="Today's Repairs" value={`Rs. ${stats.todayRepairRevenue.toLocaleString('en-IN')}`} icon="🔧" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Weekly Sales</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} sales`, 'Count']} />
                <Bar dataKey="count" fill="#0F62FE" name="Sales Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Repair Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={repairStatusData} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false} 
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80} 
                  fill="#8884d8" 
                  dataKey="value"
                >
                  {repairStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Weekly Repairs Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={repairRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`Rs. ${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Recent Sales</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (recentSales.length === 0) {
                      return (
                        <tr className="border-b border-ibm-gray-20">
                          <td colSpan={3} className="px-4 py-3 text-sm text-center text-ibm-gray-60">
                            {isLoading ? 'Loading...' : 'No sales yet'}
                          </td>
                        </tr>
                      )
                    }
                    
                    return recentSales.map((sale: any) => (
                      <tr key={sale.id} className="border-b border-ibm-gray-20 hover:bg-ibm-gray-10">
                        <td className="px-4 py-3 text-sm">{sale.product_name}</td>
                        <td className="px-4 py-3 text-sm">{sale.customer_name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">Rs. {sale.price}</td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Recent Repairs</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Device</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (recentRepairs.length === 0) {
                      return (
                        <tr className="border-b border-ibm-gray-20">
                          <td colSpan={3} className="px-4 py-3 text-sm text-center text-ibm-gray-60">
                            {isLoading ? 'Loading...' : 'No repairs yet'}
                          </td>
                        </tr>
                      )
                    }
                    
                    return recentRepairs.map((repair: any) => (
                      <tr key={repair.id} className="border-b border-ibm-gray-20 hover:bg-ibm-gray-10">
                        <td className="px-4 py-3 text-sm">{repair.customer_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{repair.device_model}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Recent Recharges</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Provider</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (recentRecharges.length === 0) {
                      return (
                        <tr className="border-b border-ibm-gray-20">
                          <td colSpan={3} className="px-4 py-3 text-sm text-center text-ibm-gray-60">
                            {isLoading ? 'Loading...' : 'No recharges yet'}
                          </td>
                        </tr>
                      )
                    }
                    
                    return recentRecharges.map((recharge: any) => (
                      <tr key={recharge.id} className="border-b border-ibm-gray-20 hover:bg-ibm-gray-10">
                        <td className="px-4 py-3 text-sm">{recharge.phone_number}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 rounded text-xs bg-ibm-blue-50 text-ibm-blue-600">
                            {recharge.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-purple-600">Rs. {recharge.amount}</td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
