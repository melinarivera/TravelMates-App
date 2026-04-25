import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, DollarSign, TrendingDown, TrendingUp, ShoppingBag
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
    try {
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
    } catch (err) {
      console.error('Fetch error:', err)
    }
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

    if (error) {
      alert('Error al registrar: ' + error.message)
    } else {
      setShowModal(false)
      setForm({ description: '', amount: '', category: 'Otros', paid_by: '' })
      await fetchData()
    }
    setSaving(false)
  }

  async function deleteExpense(id) {
    if (!confirm('¿Eliminar gasto?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }

  const totalSpent = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
  const perPerson = members.length > 0 ? totalSpent / members.length : 0

  const balanceData = members.map(m => {
    const paid = expenses
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
            <div className="module-icon-box">
              <DollarSign size={28} />
            </div>
            <div>
              <h1 className="module-title">Gastos</h1>
              <p className="module-subtitle">Cuentas compartidas</p>
            </div>
          </div>
          <button className="btn btn-add-desktop hide-mobile" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Añadir Gasto
          </button>
        </header>

        <section className="expenses-stats fade-in-up">
          <div className="stat-card glass-card">
            <span className="stat-value">{totalSpent.toFixed(2)}€</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value">{perPerson.toFixed(2)}€</span>
            <span className="stat-label">Couta</span>
          </div>
        </section>

        <div className="auth-tabs" style={{ marginBottom: '3rem' }}>
          <button className={`auth-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
             Lista
          </button>
          <button className={`auth-tab ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>
             Balances
          </button>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="items-list fade-in-up">
            {activeTab === 'list' ? (
              expenses.length === 0 ? (
                <div className="empty-state glass-card">
                  <p>No hay gastos.</p>
                </div>
              ) : expenses.map(exp => (
                <div key={exp.id} className="item-row glass-card">
                  <div className="expense-info">
                    <div className="expense-desc">{exp.description}</div>
                    <div className="expense-meta">
                      <span className="badge badge-sun">{exp.category}</span>
                      <span>{exp.profiles?.full_name || exp.profiles?.email?.split('@')[0]}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="expense-amount">{parseFloat(exp.amount).toFixed(2)}€</div>
                    {isTitular && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteExpense(exp.id)} style={{ color: 'var(--coral)' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              balanceData.map(b => (
                <div key={b.userId} className="item-row glass-card">
                  <div className="expense-info">
                    <div className="expense-desc">{b.name}</div>
                    <div className="expense-meta">Pagó {b.paid.toFixed(2)}€</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'flex-end',
                       gap: '8px',
                       color: b.balance >= 0 ? 'var(--mint)' : 'var(--coral)',
                       fontWeight: 'bold',
                       fontSize: '1.2rem'
                     }}>
                       {b.balance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                       {Math.abs(b.balance).toFixed(2)}€
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FAB - BOTÓN MÓVIL FORZADO */}
      <button className="fab-module show-mobile-only" onClick={() => setShowModal(true)}>
        <Plus size={32} />
      </button>

      {showModal && (
        <Modal title="Añadir Gasto" onClose={() => setShowModal(false)}>
          <form onSubmit={addExpense} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">¿En qué se gastó?</label>
              <input type="text" className="form-input" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Cena, Gasolina, etc." />
            </div>
            <div className="form-group">
              <label className="form-label">Importe (€)</label>
              <input type="number" step="0.01" className="form-input" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cerrar</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
