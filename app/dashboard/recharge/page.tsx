'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useSidebar } from '../layout'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'

type Recharge = {
  id: string
  phoneNumber: string
  provider: string
  amount: number
  date: string
}

export default function RechargePage() {
  const { toggleSidebar } = useSidebar()
  const [recharges, setRecharges] = useState<Recharge[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingRecharge, setEditingRecharge] = useState<Recharge | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProvider, setFilterProvider] = useState('all')
  const [formData, setFormData] = useState({
    phoneNumber: '',
    provider: 'Jio',
    amount: '',
  })

  useEffect(() => {
    fetchRecharges()
  }, [])

  const fetchRecharges = async () => {
    const { data, error } = await supabase
      .from('recharges')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching recharges:', error)
    } else {
      setRecharges((data || []).map(r => ({
        ...r,
        phoneNumber: r.phone_number,
        date: r.date
      })))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phone number
    if (formData.phoneNumber.length !== 10 || !/^\d+$/.test(formData.phoneNumber)) {
      alert('Phone number must be exactly 10 digits')
      return
    }

    if (editingRecharge) {
      const { data, error } = await supabase
        .from('recharges')
        .update({
          phone_number: formData.phoneNumber,
          provider: formData.provider,
          amount: Number(formData.amount)
        })
        .eq('id', editingRecharge.id)
        .select()
      
      if (error) {
        console.error('Error updating recharge:', error)
        alert('Failed to update recharge')
      } else if (data) {
        const updatedRecharge: Recharge = {
          ...data[0],
          phoneNumber: data[0].phone_number,
          date: data[0].date
        }
        setRecharges(recharges.map(r => r.id === editingRecharge.id ? updatedRecharge : r))
        resetForm()
      }
    } else {
      const newRechargeData = {
        phone_number: formData.phoneNumber,
        provider: formData.provider,
        amount: Number(formData.amount),
      }

      const { data, error } = await supabase.from('recharges').insert([newRechargeData]).select()
      
      if (error) {
        console.error('Error adding recharge:', error)
        alert('Failed to add recharge')
      } else if (data) {
        const addedRecharge: Recharge = {
          ...data[0],
          phoneNumber: data[0].phone_number,
          date: data[0].date
        }
        setRecharges([addedRecharge, ...recharges])
        resetForm()
      }
    }
  }

  const resetForm = () => {
    setFormData({ phoneNumber: '', provider: 'Jio', amount: '' })
    setEditingRecharge(null)
    setShowModal(false)
  }

  const handleEdit = (recharge: Recharge) => {
    setEditingRecharge(recharge)
    setFormData({ ...recharge, amount: recharge.amount.toString() })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this recharge entry?')) {
      const { error } = await supabase.from('recharges').delete().eq('id', id)
      if (error) {
        console.error('Error deleting recharge:', error)
        alert('Failed to delete recharge entry')
      } else {
        setRecharges(recharges.filter(r => r.id !== id))
      }
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Sri Sai Mobiles - Recharge History', 14, 15)
    autoTable(doc, {
      head: [['Phone Number', 'Provider', 'Amount', 'Date']],
      body: filteredRecharges.map(r => [
        r.phoneNumber, 
        r.provider, 
        'Rs. ' + r.amount.toFixed(2), 
        new Date(r.date).toLocaleString()
      ]),
      startY: 25,
    })
    doc.save('recharges.pdf')
  }

  const filteredRecharges = recharges.filter(r => {
    const matchesSearch = r.phoneNumber.includes(searchTerm)
    const matchesProvider = filterProvider === 'all' || r.provider === filterProvider
    return matchesSearch && matchesProvider
  })

  const totalAmount = filteredRecharges.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div>
      <Header title="Recharge Management" onToggleSidebar={toggleSidebar} />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-64"
            />
            <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className="input-field w-40">
              <option value="all">All Providers</option>
              <option value="Jio">Jio</option>
              <option value="Airtel">Airtel</option>
              <option value="VI">VI</option>
              <option value="BSNL">BSNL</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={exportPDF} className="btn-secondary">Export PDF</button>
            <button onClick={() => setShowModal(true)} className="btn-primary">Add Recharge</button>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-ibm-gray-100">Total Recharge Amount</h3>
            <p className="text-3xl font-bold text-ibm-blue-600">Rs. {totalAmount}</p>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Phone Number</th>
                  <th className="px-4 py-3 text-left">Provider</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecharges.map((recharge) => (
                  <tr key={recharge.id} className="border-b border-ibm-gray-20 hover:bg-ibm-gray-10">
                    <td className="px-4 py-3">{recharge.phoneNumber}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-ibm-blue-50 text-ibm-blue-600">
                        {recharge.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">Rs. {recharge.amount}</td>
                    <td className="px-4 py-3 text-sm">{new Date(recharge.date).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(recharge)} className="btn-edit text-sm">✏️ Edit</button>
                        <button onClick={() => handleDelete(recharge.id)} className="btn-delete text-sm">🗑️ Delete</button>
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
              <h2 className="text-2xl font-bold text-ibm-gray-100 mb-6">{editingRecharge ? 'Edit Recharge' : 'Add Recharge'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ibm-gray-90 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phoneNumber} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setFormData({...formData, phoneNumber: value})
                    }} 
                    className="input-field" 
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ibm-gray-90 mb-2">Provider</label>
                  <select value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})} className="input-field">
                    <option value="Jio">Jio</option>
                    <option value="Airtel">Airtel</option>
                    <option value="VI">VI</option>
                    <option value="BSNL">BSNL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ibm-gray-90 mb-2">Amount</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input-field" required />
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
