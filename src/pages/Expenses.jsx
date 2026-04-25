import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, DollarSign, TrendingDown, TrendingUp, Wallet, Receipt, PieChart
} from 'lucide-react'
import './ModulePage.css'

export default function Expenses() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('list')
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Otros', paid_by: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    setLoading(true)
    const { data: mems } = await supabase
      .from('trip_members')
      .select('user_id, role, profiles(full_name, email)')
      .eq('trip_id', tripId)
      .eq('status', 'accepted')
    
    if (mems) {
      setMembers(mems)
      const me = mems.find(m => m.user_id === user.id)
      if (me) setMyRole(me.role)
    }

    const { data: exps } = await supabase
      .from('expenses')
      .select('*, profiles!paid_by(full_name, email)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    
    if (exps) setExpenses(exps)
    setLoading(false)
  }

  async function addExpense(e) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true)
    
    const { error } = await supabase.from('expenses').insert({
      trip_id: tripId,
      user_id: user.id,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      paid_by: form.paid_by || user.id,
      split_with: members.map(m => m.user_id)
    })

    if (!error) {
      setShowModal(false)
      setForm({ description: '', amount: '', category: 'Otros', paid_by: '' })
      fetchData()
    } else {
      alert('Error: ' + error.message)
    }
    setSaving(false)
  }

  async function deleteExpense(id) {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }

  const totalSpent = (expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
  const perPerson = (members || []).length > 0 ? totalSpent / members.length : 0

  const balanceData = (members || []).map(m => {
    const paid = (expenses || [])
      .filter(e => e.paid_by === m.user_id)
      .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
    return {
      userId: m.user_id,
      name: m.profiles?.full_name || m.profiles?.email?.split('@')[0] || 'Viajero',
      paid: paid,
      balance: paid - perPerson
    }
  })

  const isTitular = myRole === 'titular'

  return (
    <div className="module-page">
      <Navbar />
      <div className="container module-body">
        <header className="module-header fade-in-up">
          <div className="module-title-group">
            <div className="module-icon-box"><DollarSign size={28} /></div>
            <div>
              <h1 className="module-title">Gastos</h1>
              <p className="module-subtitle">Cuentas claras, viajes felices</p>
            </div>
          </div>
          <button className="btn-add-vibrant" onClick={() => setShowModal(true)}>
            <Plus size={22} /> Nuevo Gasto
          </button>
        </header>

        <section className="expenses-stats fade-in-up">
          <div className="stat-card-premium stat-card-total">
            <span className="stat-card-label">Total Gastado</span>
            <span className="stat-card-value">{(totalSpent || 0).toFixed(2)}€</span>
            <DollarSign size={80} className="stat-card-icon" />
          </div>
          <div className="stat-card-premium stat-card-perperson">
            <span className="stat-card-label">Cada uno paga</span>
            <span className="stat-card-value">{(perPerson || 0).toFixed(2)}€</span>
            <Users size={80} className="stat-card-icon" />
          </div>
        </section>

        <div className="segmented-control fade-in-up delay-1" style={{ marginBottom: '2.5rem' }}>
          <button className={`segment-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            <Receipt size={18} /> Lista de Gastos
          </button>
          <button className={`segment-btn ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>
            <Wallet size={18} /> Balance Final
          </button>
        </div>

        {loading ? <div className="page-loading"><div className="spinner" /></div> : (
          <div className="items-list fade-in-up delay-2">
            {activeTab === 'list' ? (
              expenses.map(exp => (
                <div key={exp.id} className="item-row glass-card expense-item-card">
                  <div className="expense-info">
                    <div className="expense-desc" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{exp.description}</div>
                    <div className="member-tags" style={{ marginTop: '0.6rem' }}>
                      <span className="badge-guest">{exp.category}</span>
                      <span className="expense-subtitle">Pagado por: {exp.profiles?.full_name || exp.profiles?.email?.split('@')[0]}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="expense-price">{parseFloat(exp.amount).toFixed(2)}€</div>
                    {isTitular && (
                      <button className="btn-delete-vibrant" onClick={() => deleteExpense(exp.id)}>
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              balanceData.map(b => (
                <div key={b.userId} className="item-row glass-card expense-item-card">
                  <div className="expense-info">
                    <div className="expense-desc" style={{ fontWeight: 800 }}>{b.name}</div>
                    <div className="expense-subtitle">Aportación: {b.paid.toFixed(2)}€</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'flex-end',
                       gap: '10px',
                       color: b.balance >= 0 ? '#39ff14' : '#ff3131',
                       fontWeight: 900,
                       fontSize: '1.8rem'
                     }}>
                       {b.balance >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                       {Math.abs(b.balance).toFixed(2)}€
                     </div>
                     <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.9, color: b.balance >= 0 ? '#39ff14' : '#ff3131' }}>
                        {b.balance >= 0 ? 'A favor' : 'Debe pagar'}
                     </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Nuevo Gasto" onClose={() => setShowModal(false)}>
          <form onSubmit={addExpense} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-input" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Cena, Vuelo, Taxi..." />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Importe (€)</label>
                <input type="number" step="0.01" className="form-input" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                   <option value="Comida">Comida 🍕</option>
                   <option value="Transporte">Transporte 🚗</option>
                   <option value="Alojamiento">Alojamiento 🏨</option>
                   <option value="Ocio">Ocio 🎡</option>
                   <option value="Otros">Otros ✨</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-add-vibrant" disabled={saving} style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
              <Plus size={20} /> Guardar Gasto
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
