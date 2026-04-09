'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useSidebar } from '../layout'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'


type Product = {
  id: string
  name: string
  price: number
  image?: string
  createdAt: string
}

type Sale = {
  id: string
  productId: string
  productName: string
  price: number
  customerName: string
  customerPhone: string
  soldDate: string
}

export default function ProductsPage() {
  const { toggleSidebar } = useSidebar()
  const [activeTab, setActiveTab] = useState<'products' | 'history'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    image: '',
  })

  const [saleForm, setSaleForm] = useState({
    customerName: '',
    customerPhone: '',
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB')
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setProductForm({ ...productForm, image: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setProductForm({ ...productForm, image: '' })
  }

  useEffect(() => {
    fetchProducts()
    fetchSales()
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching products:', error)
    } else {
      setProducts((data || []).map(p => ({
        ...p,
        createdAt: p.created_at
      })))
    }
  }

  const fetchSales = async () => {
    const { data, error } = await supabase.from('sales').select('*').order('sold_date', { ascending: false })
    if (error) {
      console.error('Error fetching sales:', error)
    } else {
      setSales((data || []).map(s => ({
        ...s,
        productId: s.product_id,
        productName: s.product_name,
        customerName: s.customer_name,
        customerPhone: s.customer_phone,
        soldDate: s.sold_date
      })))
    }
  }
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const newProduct = {
      name: productForm.name,
      price: Number(productForm.price),
      image: productForm.image || null,
    }
    
    const { data, error } = await supabase.from('products').insert([newProduct]).select()
    if (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product')
    } else if (data) {
      const addedProduct: Product = { ...data[0], createdAt: data[0].created_at }
      setProducts([addedProduct, ...products])
      setProductForm({ name: '', price: '', image: '' })
      setShowAddModal(false)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    
    const { data, error } = await supabase.from('products')
      .update({
        name: productForm.name,
        price: Number(productForm.price),
        image: productForm.image || null
      })
      .eq('id', editingProduct.id)
      .select()

    if (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    } else if (data) {
      const updatedProduct: Product = { ...data[0], createdAt: data[0].created_at }
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p))
      setProductForm({ name: '', price: '', image: '' })
      setEditingProduct(null)
      setShowEditModal(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product')
      } else {
        setProducts(products.filter(p => p.id !== productId))
      }
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      image: product.image || '',
    })
    setShowEditModal(true)
  }

  const handleDeleteSale = async (saleId: string) => {
    if (confirm('Are you sure you want to delete this sale record?')) {
      const { error } = await supabase.from('sales').delete().eq('id', saleId)
      if (error) {
        console.error('Error deleting sale:', error)
        alert('Failed to delete sale record')
      } else {
        setSales(sales.filter(s => s.id !== saleId))
      }
    }
  }

  const handleClearAllSales = async () => {
    if (confirm('Are you sure you want to clear all sales history? This action cannot be undone.')) {
      const { error } = await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Deletes all rows
      if (error) {
        console.error('Error clearing sales:', error)
        alert('Failed to clear sales history')
      } else {
        setSales([])
      }
    }
  }

  const handleSellProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    // Validate phone number
    if (saleForm.customerPhone.length !== 10 || !/^\d+$/.test(saleForm.customerPhone)) {
      alert('Phone number must be exactly 10 digits')
      return
    }

    const newSale = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      price: selectedProduct.price,
      customer_name: saleForm.customerName,
      customer_phone: saleForm.customerPhone,
    }

    const { data: saleData, error: saleError } = await supabase.from('sales').insert([newSale]).select()
    
    if (saleError) {
      console.error('Error recording sale:', saleError)
      alert('Failed to record sale')
      return
    }

    const { error: deleteError } = await supabase.from('products').delete().eq('id', selectedProduct.id)
    if (deleteError) {
       console.error('Error removing product after sale:', deleteError)
    } else {
       setProducts(products.filter(p => p.id !== selectedProduct.id))
    }

    if (saleData) {
      const addedSale: Sale = {
          ...saleData[0],
          productId: saleData[0].product_id,
          productName: saleData[0].product_name,
          customerName: saleData[0].customer_name,
          customerPhone: saleData[0].customer_phone,
          soldDate: saleData[0].sold_date
      }
      setSales([addedSale, ...sales])
      
      // Generate bill directly
      generateBill(addedSale)
    }
    
    setSaleForm({ customerName: '', customerPhone: '' })
    setShowSellModal(false)
    setSelectedProduct(null)
  }

  const generateBill = (sale: Sale) => {
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
      
      generatePDFContent(doc, sale)
    }
    
    // If logo fails to load, generate PDF without it
    logoImg.onerror = () => {
      generatePDFContent(doc, sale)
    }
  }

  const generatePDFContent = (doc: jsPDF, sale: Sale) => {
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
    doc.text('SALES INVOICE', 20, 68)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const saleDate = new Date(sale.soldDate)
    doc.text('Invoice No: ' + sale.id.slice(-8).toUpperCase(), 20, 76)
    doc.text('Date: ' + saleDate.toLocaleDateString('en-IN'), 20, 82)
    doc.text('Time: ' + saleDate.toLocaleTimeString('en-IN'), 20, 88)
    
    // Customer details
    doc.setFont('helvetica', 'bold')
    doc.text('Customer Details:', 20, 100)
    doc.setFont('helvetica', 'normal')
    doc.text('Name: ' + sale.customerName, 20, 108)
    doc.text('Phone: ' + sale.customerPhone, 20, 114)
    
    // Line separator
    doc.line(20, 122, 190, 122)
    
    // Product details header
    doc.setFont('helvetica', 'bold')
    doc.text('Product', 20, 132)
    doc.text('Price', 160, 132)
    
    doc.line(20, 136, 190, 136)
    
    // Product details
    doc.setFont('helvetica', 'normal')
    doc.text(sale.productName, 20, 146)
    doc.text('Rs. ' + sale.price.toFixed(2), 160, 146)
    
    // Line separator
    doc.line(20, 152, 190, 152)
    
    // Total
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total Amount:', 120, 162)
    doc.text('Rs. ' + sale.price.toFixed(2), 160, 162)
    
    // Footer
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('Thank you for your business!', 105, 188, { align: 'center' })
    doc.text('Visit us again', 105, 194, { align: 'center' })
    
    doc.save('invoice-' + sale.id + '.pdf')
  }

  const openSellModal = (product: Product) => {
    setSelectedProduct(product)
    setShowSellModal(true)
  }

  const exportSalesHistory = () => {
    const doc = new jsPDF()
    doc.text('Sri Sai Mobiles - Sales History', 14, 15)
    autoTable(doc, {
      head: [['Invoice No', 'Product', 'Customer', 'Phone', 'Price', 'Date']],
      body: filteredSales.map(s => [
        s.id.slice(-8).toUpperCase(),
        s.productName,
        s.customerName,
        s.customerPhone,
        'Rs. ' + s.price.toFixed(2),
        new Date(s.soldDate).toLocaleString('en-IN')
      ]),
      startY: 25,
    })
    doc.save('sales-history.pdf')
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSales = sales.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerPhone.includes(searchTerm) ||
    s.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <Header title="Products Management" onToggleSidebar={toggleSidebar} />
      <div className="p-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-md ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-ibm-blue-600 to-ibm-blue-700 text-white shadow-lg transform scale-105'
                : 'bg-white text-ibm-gray-70 hover:bg-ibm-gray-10 hover:shadow-lg'
            }`}
          >
            📦 Products
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-md ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-ibm-blue-600 to-ibm-blue-700 text-white shadow-lg transform scale-105'
                : 'bg-white text-ibm-gray-70 hover:bg-ibm-gray-10 hover:shadow-lg'
            }`}
          >
            📋 History
          </button>
        </div>

        {/* Search and Add Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={activeTab === 'products' ? '🔍 Search products...' : '🔍 Search sales...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-4"
            />
          </div>
          {activeTab === 'products' && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
              <span className="text-xl">+</span>
              Add Product
            </button>
          )}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="aspect-square bg-gradient-to-br from-ibm-blue-50 to-ibm-blue-100 flex items-center justify-center relative overflow-hidden">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-ibm-blue-200 opacity-50"></div>
                      <span className="text-8xl relative z-10 drop-shadow-lg">📱</span>
                    </>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-ibm-gray-100 mb-2 truncate" title={product.name}>
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      Rs. {product.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => openSellModal(product)}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <span>🛒</span>
                      Sold to Customer
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="btn-edit flex-1 justify-center"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="btn-delete flex-1 justify-center"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full">
                <div className="card text-center py-16">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-xl font-semibold text-ibm-gray-70 mb-2">No products available</p>
                  <p className="text-ibm-gray-60">Add your first product to get started!</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="flex justify-end mb-4 gap-3">
              <button onClick={handleClearAllSales} className="btn-delete">
                🗑️ Clear All History
              </button>
              <button onClick={exportSalesHistory} className="btn-secondary">
                Export PDF
              </button>
            </div>
            <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-4 text-left">Invoice No</th>
                    <th className="px-6 py-4 text-left">Product</th>
                    <th className="px-6 py-4 text-left">Customer Name</th>
                    <th className="px-6 py-4 text-left">Phone</th>
                    <th className="px-6 py-4 text-left">Price</th>
                    <th className="px-6 py-4 text-left">Date & Time</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-ibm-gray-20 hover:bg-gradient-to-r hover:from-ibm-blue-50 hover:to-transparent transition-all duration-200">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-ibm-blue-600">
                        {sale.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-semibold">{sale.productName}</td>
                      <td className="px-6 py-4">{sale.customerName}</td>
                      <td className="px-6 py-4 text-ibm-gray-70">{sale.customerPhone}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg text-green-600">
                          Rs. {sale.price.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-ibm-gray-70">
                        {new Date(sale.soldDate).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => generateBill(sale)}
                            className="text-3xl hover:scale-125 transition-transform duration-200 filter hover:drop-shadow-lg"
                            title="Download PDF"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="btn-delete text-sm"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-xl font-semibold text-ibm-gray-70 mb-2">No sales history</p>
                        <p className="text-ibm-gray-60">Sales will appear here once you sell products</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-80 bg-clip-text text-transparent mb-6">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Product Image <span className="text-ibm-gray-50 text-xs">(Optional)</span>
                  </label>
                  {productForm.image ? (
                    <div className="relative">
                      <img 
                        src={productForm.image} 
                        alt="Product preview" 
                        className="w-full h-48 object-cover rounded-lg border-2 border-ibm-gray-20"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-ibm-gray-30 rounded-lg p-6 text-center hover:border-ibm-blue-600 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label htmlFor="product-image-upload" className="cursor-pointer">
                        <div className="text-5xl mb-2">📷</div>
                        <p className="text-sm text-ibm-gray-70">Click to upload image</p>
                        <p className="text-xs text-ibm-gray-50 mt-1">Max size: 2MB</p>
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., iPhone 15 Pro"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 129999"
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
                      setProductForm({ name: '', price: '', image: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditModal && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-80 bg-clip-text text-transparent mb-6">Edit Product</h2>
              <form onSubmit={handleEditProduct} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Product Image <span className="text-ibm-gray-50 text-xs">(Optional)</span>
                  </label>
                  {productForm.image ? (
                    <div className="relative">
                      <img 
                        src={productForm.image} 
                        alt="Product preview" 
                        className="w-full h-48 object-cover rounded-lg border-2 border-ibm-gray-20"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-ibm-gray-30 rounded-lg p-6 text-center hover:border-ibm-blue-600 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="product-image-edit"
                      />
                      <label htmlFor="product-image-edit" className="cursor-pointer">
                        <div className="text-5xl mb-2">📷</div>
                        <p className="text-sm text-ibm-gray-70">Click to upload image</p>
                        <p className="text-xs text-ibm-gray-50 mt-1">Max size: 2MB</p>
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., iPhone 15 Pro"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 129999"
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
                      setEditingProduct(null)
                      setProductForm({ name: '', price: '', image: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sell to Customer Modal */}
        {showSellModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-80 bg-clip-text text-transparent mb-2">Complete Sale</h2>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-6 border-2 border-green-200">
                <p className="text-sm text-ibm-gray-70 font-semibold mb-1">Product</p>
                <p className="text-lg font-bold text-ibm-gray-100">{selectedProduct.name}</p>
                <p className="text-2xl font-bold text-green-600 mt-2">Rs. {selectedProduct.price.toLocaleString('en-IN')}</p>
              </div>
              <form onSubmit={handleSellProduct} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    className="input-field"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ibm-gray-90 mb-2 uppercase tracking-wide">
                    Customer Phone Number
                  </label>
                  <input
                    type="tel"
                    value={saleForm.customerPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setSaleForm({ ...saleForm, customerPhone: value })
                    }}
                    className="input-field"
                    placeholder="Enter 10-digit phone number"
                    required
                    maxLength={10}
                    pattern="\d{10}"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSellModal(false)
                      setSelectedProduct(null)
                      setSaleForm({ customerName: '', customerPhone: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <span>📄</span>
                    Generate Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Bill Modal code removed to simplify the workflow */}
      </div>
    </div>
  )
}
