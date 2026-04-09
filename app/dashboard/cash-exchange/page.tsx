'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useSidebar } from '../sidebar-context'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'

type CashExchange = {
  id: string
  customerPhone: string
  amount: number
  paymentMethod: string
  date: string
}

export default function CashExchangePage() {
  const { toggleSidebar } = useSidebar()
  const [exchanges, setExchanges] = useState<CashExchange[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingExchange, setEditingExchange] = useState<CashExchange | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMethod, setFilterMethod] = useState('all')
  const [formData, setFormData] = useState({
    customerPhone: '',
    amount: '',
    paymentMethod: 'GPay',
  })

  useEffect(() => {
    fetchExchanges()
  }, [])

  const fetchExchanges = async () => {
    const { data, error } = await supabase
      .from('cash_exchanges')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching exchanges:', error)
    } else {
      setExchanges((data || []).map(ex => ({
        ...ex,
        customerPhone: ex.customer_phone,
        paymentMethod: ex.payment_method,
        date: ex.date
      })))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phone number
    if (formData.customerPhone.length !== 10 || !/^\d+$/.test(formData.customerPhone)) {
      alert('Phone number must be exactly 10 digits')
      return
    }

    if (editingExchange) {
      const { data, error } = await supabase
        .from('cash_exchanges')
        .update({
          customer_phone: formData.customerPhone,
          amount: Number(formData.amount),
          payment_method: formData.paymentMethod
        })
        .eq('id', editingExchange.id)
        .select()
      
      if (error) {
        console.error('Error updating exchange:', error)
        alert('Failed to update transaction')
      } else if (data) {
        const updatedExchange: CashExchange = {
          ...data[0],
          customerPhone: data[0].customer_phone,
          paymentMethod: data[0].payment_method,
          date: data[0].date
        }
        setExchanges(exchanges.map(ex => ex.id === editingExchange.id ? updatedExchange : ex))
        resetForm()
      }
    } else {
      const newExchangeData = {
        customer_phone: formData.customerPhone,
        amount: Number(formData.amount),
        payment_method: formData.paymentMethod,
      }

      const { data, error } = await supabase.from('cash_exchanges').insert([newExchangeData]).select()
      
      if (error) {
        console.error('Error adding exchange:', error)
        alert('Failed to add transaction')
      } else if (data) {
        const addedExchange: CashExchange = {
          ...data[0],
          customerPhone: data[0].customer_phone,
          paymentMethod: data[0].payment_method,
          date: data[0].date
        }
        setExchanges([addedExchange, ...exchanges])
        resetForm()
      }
    }
  }

  const resetForm = () => {
    setFormData({ customerPhone: '', amount: '', paymentMethod: 'GPay' })
    setEditingExchange(null)
    setShowModal(false)
  }

  const handleEdit = (exchange: CashExchange) => {
    setEditingExchange(exchange)
    setFormData({ ...exchange, amount: exchange.amount.toString() })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction?')) {
      const { error } = await supabase.from('cash_exchanges').delete().eq('id', id)
      if (error) {
        console.error('Error deleting exchange:', error)
        alert('Failed to delete transaction')
      } else {
        setExchanges(exchanges.filter(ex => ex.id !== id))
      }
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Sri Sai Mobiles - Cash Exchange', 14, 15)
    autoTable(doc, {
      head: [['Phone', 'Amount', 'Method', 'Date']],
      body: filteredExchanges.map(ex => [
        ex.customerPhone, 
        'Rs. ' + ex.amount.toFixed(2), 
        ex.paymentMethod, 
        new Date(ex.date).toLocaleString()
      ]),
      startY: 25,
    })
    doc.save('cash-exchange.pdf')
  }

  const filteredExchanges = exchanges.filter(ex => {
    const matchesSearch = ex.customerPhone.includes(searchTerm)
    const matchesMethod = filterMethod === 'all' || ex.paymentMethod === filterMethod
    return matchesSearch && matchesMethod
  })

  const totalAmount = filteredExchanges.reduce((sum, ex) => sum + ex.amount, 0)

  return (
    <div>
      <Header title="Cash Exchange (Digital to Cash)" onToggleSidebar={toggleSidebar} />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-64"
            />
            <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="input-field w-40">
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="GPay">GPay</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Paytm">Paytm</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={exportPDF} className="btn-secondary">Export PDF</button>
            <button onClick={() => setShowModal(true)} className="btn-primary">Add Transaction</button>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-ibm-gray-100">Total Cash Exchange</h3>
            <p className="text-3xl font-bold text-green-600">Rs. {totalAmount}</p>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Customer Phone</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Payment Method</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExchanges.map((exchange) => (
                  <tr key={exchange.id} className="border-b border-ibm-gray-20 hover:bg-ibm-gray-10">
                    <td className="px-4 py-3">{exchange.customerPhone}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">Rs. {exchange.amount}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-purple-50 text-purple-600">
                        {exchange.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(exchange.date).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(exchange)} className="btn-edit text-sm">✏️ Edit</button>
                        <button onClick={() => handleDelete(exchange.id)} className="btn-delete text-sm">🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-ibm-gray-100 mb-6">{editingExchange ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ibm-gray-90 mb-2">Customer Phone</label>
                  <input 
                    type="tel" 
                    value={formData.customerPhone} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setFormData({...formData, customerPhone: value})
                    }} 
                    className="input-field" 
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ibm-gray-90 mb-2">Amount</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ibm-gray-90 mb-2">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="input-field">
                    <option value="Cash">Cash</option>
                    <option value="GPay">GPay</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
