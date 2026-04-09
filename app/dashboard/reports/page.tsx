'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useSidebar } from '../layout'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'

export default function ReportsPage() {
  const { toggleSidebar } = useSidebar()
  const [dateRange, setDateRange] = useState('today')
  const [stats, setStats] = useState({
    salesRevenue: 0,
    repairRevenue: 0,
    rechargeRevenue: 0,
    cashExchange: 0,
    totalRevenue: 0,
    salesCount: 0,
    repairsCount: 0,
    rechargesCount: 0
  })

  useEffect(() => {
    calculateStats()
  }, [dateRange])

  const calculateStats = async () => {
    const [
      { data: sales },
      { data: completedRepairs },
      { data: recharges },
      { data: cashExchanges }
    ] = await Promise.all([
      supabase.from('sales').select('*'),
      supabase.from('completed_repairs').select('*'),
      supabase.from('recharges').select('*'),
      supabase.from('cash_exchanges').select('*')
    ])

    const salesList = sales || []
    const repairsList = completedRepairs || []
    const rechargesList = recharges || []
    const exchangesList = cashExchanges || []

    const filterByDate = (item: any) => {
      const itemDate = new Date(item.sold_date || item.repaired_date || item.date)
      const now = new Date()
      
      if (dateRange === 'today') {
        return itemDate.toDateString() === now.toDateString()
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return itemDate >= weekAgo
      } else if (dateRange === 'month') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
      }
      return true
    }

    const filteredSales = salesList.filter(filterByDate)
    const filteredRepairs = repairsList.filter(filterByDate)
    const filteredRecharges = rechargesList.filter(filterByDate)
    const filteredExchanges = exchangesList.filter(filterByDate)

    const salesRevenue = filteredSales.reduce((sum: number, s: any) => sum + Number(s.price), 0)
    const repairRevenue = filteredRepairs.reduce((sum: number, r: any) => sum + Number(r.estimated_cost), 0)
    const rechargeRevenue = filteredRecharges.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
    const cashExchange = filteredExchanges.reduce((sum: number, c: any) => sum + Number(c.amount), 0)

    setStats({
      salesRevenue,
      repairRevenue,
      rechargeRevenue,
      cashExchange,
      totalRevenue: salesRevenue + repairRevenue,
      salesCount: filteredSales.length,
      repairsCount: filteredRepairs.length,
      rechargesCount: filteredRecharges.length
    })
  }

  const revenueData = [
    { name: 'Sales', value: stats.salesRevenue },
    { name: 'Repairs', value: stats.repairRevenue },
    { name: 'Recharge', value: stats.rechargeRevenue },
  ]

  const exportReport = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Sri Sai Mobiles', 105, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text('Financial Report', 105, 30, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Period: ${dateRange.toUpperCase()}`, 105, 40, { align: 'center' })
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 47, { align: 'center' })
    
    autoTable(doc, {
      head: [['Revenue Source', 'Amount']],
      body: [
        ['Product Sales', `Rs. ${stats.salesRevenue}`],
        ['Repair Services', `Rs. ${stats.repairRevenue}`],
        ['Recharge Services', `Rs. ${stats.rechargeRevenue}`],
        ['Cash Exchange', `Rs. ${stats.cashExchange}`],
        ['Total Revenue', `Rs. ${stats.totalRevenue}`],
      ],
      startY: 55,
    })
    
    doc.save(`report-${dateRange}-${Date.now()}.pdf`)
  }

  return (
    <div>
      <Header title="Financial Reports" onToggleSidebar={toggleSidebar} />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input-field w-48">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button onClick={exportReport} className="btn-primary">Export Report PDF</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <p className="text-sm text-ibm-gray-60 mb-2">Sales Revenue</p>
            <p className="text-3xl font-bold text-green-600">Rs. {stats.salesRevenue}</p>
          </div>
          <div className="card">
            <p className="text-sm text-ibm-gray-60 mb-2">Repair Revenue</p>
            <p className="text-3xl font-bold text-blue-600">Rs. {stats.repairRevenue}</p>
          </div>
          <div className="card">
            <p className="text-sm text-ibm-gray-60 mb-2">Recharge Revenue</p>
            <p className="text-3xl font-bold text-purple-600">Rs. {stats.rechargeRevenue}</p>
          </div>
          <div className="card">
            <p className="text-sm text-ibm-gray-60 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-ibm-blue-600">Rs. {stats.totalRevenue}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Revenue Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0F62FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Revenue Summary</h3>
            <div className="space-y-4 mt-8">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded">
                <span className="font-medium text-ibm-gray-100">Product Sales</span>
                <span className="text-xl font-bold text-green-600">Rs. {stats.salesRevenue}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded">
                <span className="font-medium text-ibm-gray-100">Repair Services</span>
                <span className="text-xl font-bold text-blue-600">Rs. {stats.repairRevenue}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded">
                <span className="font-medium text-ibm-gray-100">Recharge Services</span>
                <span className="text-xl font-bold text-purple-600">Rs. {stats.rechargeRevenue}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded">
                <span className="font-medium text-ibm-gray-100">Cash Exchange</span>
                <span className="text-xl font-bold text-orange-600">Rs. {stats.cashExchange}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-ibm-gray-100 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-ibm-gray-10 rounded">
              <p className="text-sm text-ibm-gray-60 mb-1">Highest Revenue Source</p>
              <p className="text-lg font-semibold text-ibm-gray-100">
                {stats.salesRevenue >= stats.repairRevenue && stats.salesRevenue >= stats.rechargeRevenue ? 'Product Sales' :
                 stats.repairRevenue >= stats.rechargeRevenue ? 'Repair Services' : 'Recharge Services'}
              </p>
            </div>
            <div className="p-4 bg-ibm-gray-10 rounded">
              <p className="text-sm text-ibm-gray-60 mb-1">Total Transactions</p>
              <p className="text-lg font-semibold text-ibm-gray-100">
                {stats.salesCount + stats.repairsCount + stats.rechargesCount}
              </p>
            </div>
            <div className="p-4 bg-ibm-gray-10 rounded">
              <p className="text-sm text-ibm-gray-60 mb-1">Average Transaction</p>
              <p className="text-lg font-semibold text-ibm-gray-100">
                Rs. {Math.round(stats.totalRevenue / Math.max(1, (stats.salesCount + stats.repairsCount + stats.rechargesCount)))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
