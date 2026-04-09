'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useSidebar } from '../sidebar-context'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'

type Repair = {
  id: string
  customerName: string
  phoneNumber: string
  deviceModel: string
  estimatedCost: number
  createdAt: string
}

type CompletedRepair = {
  id: string
  repairId: string
  customerName: string
  phoneNumber: string
  deviceModel: string
  estimatedCost: number
  repairedDate: string
}

export default function RepairsPage() {
  const { toggleSidebar } = useSidebar()
  const [activeTab, setActiveTab] = useState<'repairs' | 'history'>('repairs')
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [completedRepairs, setCompletedRepairs] = useState<CompletedRepair[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRepairedModal, setShowRepairedModal] = useState(false)
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null)
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    deviceModel: '',
    estimatedCost: '',
  })

  useEffect(() => {
    fetchRepairs()
    fetchCompletedRepairs()
  }, [])

  const fetchRepairs = async () => {
    const { data, error } = await supabase
      .from('repairs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching repairs:', error)
    } else {
      setRepairs((data || []).map(r => ({
        ...r,
        customerName: r.customer_name,
        phoneNumber: r.phone_number,
        deviceModel: r.device_model,
        estimatedCost: r.estimated_cost,
        createdAt: r.created_at
      })))
    }
  }

  const fetchCompletedRepairs = async () => {
    const { data, error } = await supabase
      .from('completed_repairs')
      .select('*')
      .order('repaired_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching completed repairs:', error)
    } else {
      setCompletedRepairs((data || []).map(r => ({
        ...r,
        repairId: r.repair_id,
        customerName: r.customer_name,
        phoneNumber: r.phone_number,
        deviceModel: r.device_model,
        estimatedCost: r.estimated_cost,
        repairedDate: r.repaired_date
      })))
    }
  }

  const handleAddRepair = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate phone number if provided
    if (formData.phoneNumber && (formData.phoneNumber.length !== 10 || !/^\d+$/.test(formData.phoneNumber))) {
      alert('Phone number must be exactly 10 digits')
      return
    }

    const newRepair = {
      customer_name: formData.customerName,
      phone_number: formData.phoneNumber,
      device_model: formData.deviceModel,
      estimated_cost: Number(formData.estimatedCost),
    }

    const { data, error } = await supabase.from('repairs').insert([newRepair]).select()
    
    if (error) {
      console.error('Error adding repair:', error)
      alert('Failed to add repair entry')
    } else if (data) {
      const addedRepair: Repair = {
        ...data[0],
        customerName: data[0].customer_name,
        phoneNumber: data[0].phone_number,
        deviceModel: data[0].device_model,
        estimatedCost: data[0].estimated_cost,
        createdAt: data[0].created_at
      }
      setRepairs([addedRepair, ...repairs])
      setFormData({ customerName: '', phoneNumber: '', deviceModel: '', estimatedCost: '' })
      setShowAddModal(false)
    }
  }

  const handleEditRepair = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRepair) return
    
    // Validate phone number if provided
    if (formData.phoneNumber && (formData.phoneNumber.length !== 10 || !/^\d+$/.test(formData.phoneNumber))) {
      alert('Phone number must be exactly 10 digits')
      return
    }
    
    const { data, error } = await supabase
      .from('repairs')
      .update({
        customer_name: formData.customerName,
        phone_number: formData.phoneNumber,
        device_model: formData.deviceModel,
        estimated_cost: Number(formData.estimatedCost)
      })
      .eq('id', editingRepair.id)
      .select()

    if (error) {
      console.error('Error updating repair:', error)
      alert('Failed to update repair entry')
    } else if (data) {
      const updatedRepair: Repair = {
        ...data[0],
        customerName: data[0].customer_name,
        phoneNumber: data[0].phone_number,
        deviceModel: data[0].device_model,
        estimatedCost: data[0].estimated_cost,
        createdAt: data[0].created_at
      }
      setRepairs(repairs.map(r => r.id === editingRepair.id ? updatedRepair : r))
      setFormData({ customerName: '', phoneNumber: '', deviceModel: '', estimatedCost: '' })
      setEditingRepair(null)
      setShowEditModal(false)
    }
  }

  const handleDeleteRepair = async (repairId: string) => {
    if (confirm('Are you sure you want to delete this repair entry?')) {
      const { error } = await supabase.from('repairs').delete().eq('id', repairId)
      if (error) {
        console.error('Error deleting repair:', error)
        alert('Failed to delete repair entry')
      } else {
        setRepairs(repairs.filter(r => r.id !== repairId))
      }
    }
  }

  const handleDeleteCompletedRepair = async (repairId: string) => {
    if (confirm('Are you sure you want to delete this repair record?')) {
      const { error } = await supabase.from('completed_repairs').delete().eq('id', repairId)
      if (error) {
        console.error('Error deleting repair record:', error)
        alert('Failed to delete repair record')
      } else {
        setCompletedRepairs(completedRepairs.filter(r => r.id !== repairId))
      }
    }
  }

  const handleClearAllCompletedRepairs = async () => {
    if (confirm('Are you sure you want to clear all repair history? This action cannot be undone.')) {
      const { error } = await supabase.from('completed_repairs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) {
        console.error('Error clearing history:', error)
        alert('Failed to clear repair history')
      } else {
        setCompletedRepairs([])
      }
    }
  }

  const openEditModal = (repair: Repair) => {
    setEditingRepair(repair)
    setFormData({
      customerName: repair.customerName,
      phoneNumber: repair.phoneNumber,
      deviceModel: repair.deviceModel,
      estimatedCost: repair.estimatedCost.toString(),
    })
    setShowEditModal(true)
  }

  const handleMarkAsRepaired = (repair: Repair) => {
    setSelectedRepair(repair)
    setShowRepairedModal(true)
  }

  const confirmRepaired = async () => {
    if (!selectedRepair) return

    const completedRepairData = {
      repair_id: selectedRepair.id,
      customer_name: selectedRepair.customerName,
      phone_number: selectedRepair.phoneNumber,
      device_model: selectedRepair.deviceModel,
      estimated_cost: selectedRepair.estimatedCost,
    }

    const { data: completedData, error: completedError } = await supabase
      .from('completed_repairs')
      .insert([completedRepairData])
      .select()
    
    if (completedError) {
      console.error('Error marking as repaired:', completedError)
      alert('Failed to mark as repaired')
      return
    }

    const { error: deleteError } = await supabase.from('repairs').delete().eq('id', selectedRepair.id)
    if (deleteError) {
      console.error('Error removing pending repair:', deleteError)
    } else {
      setRepairs(repairs.filter(r => r.id !== selectedRepair.id))
    }

    if (completedData) {
      const addedCompleted: CompletedRepair = {
        ...completedData[0],
        repairId: completedData[0].repair_id,
        customerName: completedData[0].customer_name,
        phoneNumber: completedData[0].phone_number,
        deviceModel: completedData[0].device_model,
        estimatedCost: completedData[0].estimated_cost,
        repairedDate: completedData[0].repaired_date
      }
      setCompletedRepairs([addedCompleted, ...completedRepairs])
      
      // Generate invoice directly
      generateInvoice(addedCompleted)
    }
    
    // Close repaired modal and reset
    setShowRepairedModal(false)
    setSelectedRepair(null)
  }

  const generateInvoice = (repair: CompletedRepair) => {
    const doc = new jsPDF()
    
    // Add logo
    const logoImg = new Image()
    logoImg.src = '/logo.png'
    logoImg.onload = () => {
      try {
        // Header with logo
        doc.addImage(logoImg, 'PNG', 85, 10, 20, 20)
      } catch (e) {
        console.log('Logo not loaded, continuing without it')
      }
      
      generatePDFContent(doc, repair)
    }
    
    // If logo fails to load, generate PDF without it
    logoImg.onerror = () => {
      generatePDFContent(doc, repair)
    }
  }

  const generatePDFContent = (doc: jsPDF, repair: CompletedRepair) => {
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Sri Sai Mobiles', 105, 38, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Mobile Shop & Services', 105, 46, { align: 'center' })
    doc.text('Phone: +91 9092446695', 105, 52, { align: 'center' })
    
    // Line separator
    doc.setLineWidth(0.5)
    doc.line(20, 58, 190, 58)
    
    // Invoice details
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('REPAIR INVOICE', 20, 68)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const repairDate = new Date(repair.repairedDate)
    doc.text('Invoice No: ' + repair.id.slice(-8).toUpperCase(), 20, 76)
    doc.text('Date: ' + repairDate.toLocaleDateString('en-IN'), 20, 82)
    doc.text('Time: ' + repairDate.toLocaleTimeString('en-IN'), 20, 88)
    
    let yPosition = 100
    
    // Customer details (only if provided)
    if (repair.customerName || repair.phoneNumber) {
      doc.setFont('helvetica', 'bold')
      doc.text('Customer Details:', 20, yPosition)
      yPosition += 8
      doc.setFont('helvetica', 'normal')
      if (repair.customerName) {
        doc.text('Name: ' + repair.customerName, 20, yPosition)
        yPosition += 6
      }
      if (repair.phoneNumber) {
        doc.text('Phone: ' + repair.phoneNumber, 20, yPosition)
        yPosition += 6
      }
      yPosition += 2
    }
    
    // Line separator
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    
    // Service details header
    doc.setFont('helvetica', 'bold')
    doc.text('Service', 20, yPosition)
    doc.text('Amount', 160, yPosition)
    
    yPosition += 4
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    
    // Service details
    doc.setFont('helvetica', 'normal')
    doc.text('Repair Service - ' + repair.deviceModel, 20, yPosition)
    doc.text('Rs. ' + repair.estimatedCost.toFixed(2), 160, yPosition)
    
    yPosition += 6
    // Line separator
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    
    // Total
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total Amount:', 120, yPosition)
    doc.text('Rs. ' + repair.estimatedCost.toFixed(2), 160, yPosition)
    
    // Footer
    yPosition += 26
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('Thank you for your business!', 105, yPosition, { align: 'center' })
    doc.text('Visit us again', 105, yPosition + 6, { align: 'center' })
    
    doc.save('repair-invoice-' + repair.id + '.pdf')
  }

  const exportRepairHistory = () => {
    const doc = new jsPDF()
    doc.text('Sri Sai Mobiles - Repair History', 14, 15)
    autoTable(doc, {
      head: [['Invoice No', 'Customer', 'Phone', 'Device', 'Cost', 'Date']],
      body: filteredCompleted.map(r => [
        r.id.slice(-8).toUpperCase(),
        r.customerName || 'N/A',
        r.phoneNumber || 'N/A',
        r.deviceModel,
        'Rs. ' + r.estimatedCost.toFixed(2),
        new Date(r.repairedDate).toLocaleString('en-IN')
      ]),
      startY: 25,
    })
    doc.save('repair-history.pdf')
  }

  const filteredRepairs = repairs.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phoneNumber.includes(searchTerm) ||
    r.deviceModel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCompleted = completedRepairs.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phoneNumber.includes(searchTerm) ||
    r.deviceModel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <Header title="Repair Services" onToggleSidebar={toggleSidebar} />
      <div className="p-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('repairs')}
            className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-md ${
              activeTab === 'repairs'
                ? 'bg-gradient-to-r from-ibm-blue-600 to-ibm-blue-700 text-white shadow-lg transform scale-105'
                : 'bg-white text-ibm-gray-70 hover:bg-ibm-gray-10 hover:shadow-lg'
            }`}
          >
            🔧 Pending Repairs
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-md ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-ibm-blue-600 to-ibm-blue-700 text-white shadow-lg transform scale-105'
                : 'bg-white text-ibm-gray-70 hover:bg-ibm-gray-10 hover:shadow-lg'
            }`}
          >
            ✅ History
          </button>
        </div>

        {/* Search and Add Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={activeTab === 'repairs' ? '🔍 Search repairs...' : '🔍 Search history...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-4"
            />
          </div>
          {activeTab === 'repairs' && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
              <span className="text-xl">+</span>
              Add Repair
            </button>
          )}
        </div>

        {/* Repairs Tab */}
        {activeTab === 'repairs' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">Customer Name</th>
                    <th className="px-6 py-4 text-left">Phone</th>
                    <th className="px-6 py-4 text-left">Device</th>
                    <th className="px-6 py-4 text-left">Cost</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepairs.map((repair) => (
                    <tr key={repair.id} className="border-b border-ibm-gray-20 hover:bg-gradient-to-r hover:from-ibm-blue-50 hover:to-transparent transition-all duration-200">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-ibm-blue-600">
                        {repair.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 font-semibold">{repair.customerName}</td>
                      <td className="px-6 py-4 text-ibm-gray-70">{repair.phoneNumber}</td>
                      <td className="px-6 py-4">{repair.deviceModel}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg text-orange-600">
                          Rs. {repair.estimatedCost.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkAsRepaired(repair)}
                            className="btn-success"
                          >
                            ✓ Repaired
                          </button>
                          <button
                            onClick={() => openEditModal(repair)}
                            className="btn-edit"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRepair(repair.id)}
                            className="btn-delete"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRepairs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="text-6xl mb-4">🔧</div>
                        <p className="text-xl font-semibold text-ibm-gray-70 mb-2">No pending repairs</p>
                        <p className="text-ibm-gray-60">Add a repair entry to get started</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="flex justify-end mb-4 gap-3">
              <button onClick={handleClearAllCompletedRepairs} className="btn-delete">
                🗑️ Clear All History
              </button>
              <button onClick={exportRepairHistory} className="btn-secondary">
                Export PDF
              </button>
            </div>
            <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-4 text-left">Invoice No</th>
                    <th className="px-6 py-4 text-left">Customer Name</th>
                    <th className="px-6 py-4 text-left">Phone</th>
                    <th className="px-6 py-4 text-left">Device</th>
                    <th className="px-6 py-4 text-left">Cost</th>
                    <th className="px-6 py-4 text-left">Date & Time</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompleted.map((repair) => (
                    <tr key={repair.id} className="border-b border-ibm-gray-20 hover:bg-gradient-to-r hover:from-green-50 hover:to-transparent transition-all duration-200">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-green-600">
                        {repair.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-semibold">{repair.customerName}</td>
                      <td className="px-6 py-4 text-ibm-gray-70">{repair.phoneNumber}</td>
                      <td className="px-6 py-4">{repair.deviceModel}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg text-green-600">
                          Rs. {repair.estimatedCost.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-ibm-gray-70">
                        {new Date(repair.repairedDate).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => generateInvoice(repair)}
                            className="text-3xl hover:scale-125 transition-transform duration-200 filter hover:drop-shadow-lg"
                            title="Download PDF"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => handleDeleteCompletedRepair(repair.id)}
                            className="btn-delete text-sm"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCompleted.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-xl font-semibold text-ibm-gray-70 mb-2">No repair history</p>
                        <p className="text-ibm-gray-60">Completed repairs will appear here</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        {/* Add Repair Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-80 bg-clip-text text-transparent mb-6">Add New Repair</h2>
              <form onSubmit={handleAddRepair} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Customer Name <span className="text-ibm-gray-50 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="input-field"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Phone Number <span className="text-ibm-gray-50 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setFormData({ ...formData, phoneNumber: value })
                    }}
                    className="input-field"
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Device Model <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.deviceModel}
                    onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                    className="input-field"
                    placeholder="e.g., iPhone 13"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Estimated Cost (Rs.) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 2500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({ customerName: '', phoneNumber: '', deviceModel: '', estimatedCost: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Repair
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Repair Modal */}
        {showEditModal && editingRepair && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-80 bg-clip-text text-transparent mb-6">Edit Repair</h2>
              <form onSubmit={handleEditRepair} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Customer Name <span className="text-ibm-gray-50 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Phone Number <span className="text-ibm-gray-50 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setFormData({ ...formData, phoneNumber: value })
                    }}
                    className="input-field"
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Device Model <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.deviceModel}
                    onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Estimated Cost (Rs.) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="input-field"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingRepair(null)
                      setFormData({ customerName: '', phoneNumber: '', deviceModel: '', estimatedCost: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Repair
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mark as Repaired Modal */}
        {showRepairedModal && selectedRepair && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-80 bg-clip-text text-transparent mb-2">Mark as Repaired</h2>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 mb-6 border-2 border-green-200">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">📄</div>
                  <p className="text-sm text-ibm-gray-70 font-semibold mb-2">Invoice Preview</p>
                </div>
                <div className="space-y-2 text-sm">
                  {selectedRepair.customerName && (
                    <div className="flex justify-between">
                      <span className="text-ibm-gray-70">Customer:</span>
                      <span className="font-semibold">{selectedRepair.customerName}</span>
                    </div>
                  )}
                  {selectedRepair.phoneNumber && (
                    <div className="flex justify-between">
                      <span className="text-ibm-gray-70">Phone:</span>
                      <span className="font-semibold">{selectedRepair.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ibm-gray-70">Device:</span>
                    <span className="font-semibold">{selectedRepair.deviceModel}</span>
                  </div>
                  <div className="border-t-2 border-green-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-ibm-gray-90 font-bold">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-600">Rs. {selectedRepair.estimatedCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRepairedModal(false)
                    setSelectedRepair(null)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRepaired}
                  className="btn-primary flex items-center gap-2"
                >
                  <span>📄</span>
                  Generate Bill
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Bill Modal code removed to simplify the workflow */}
      </div>
    </div>
  )
}
