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
  const [tripName, setTripName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Otros', paid_by: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    setLoading(true)
    const { data: trip } = await supabase.from('trips').select('name').eq('id', tripId).single()
    if (trip) setTripName(trip.name)

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
    setSaving(true)
    await supabase.from('expenses').insert({
      trip_id: tripId,
      user_id: user.id,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      paid_by: form.paid_by || user.id,
      split_with: members.map(m => m.user_id)
    })
    setShowModal(false)
    setForm({ description: '', amount: '', category: 'Otros', paid_by: '' })
    fetchData()
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
              <p className="module-subtitle">Divide cuentas entre amigos</p>
            </div>
          </div>
          <button className="btn btn-add-desktop hide-mobile" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Añadir Gasto
          </button>
        </header>

        <section className="expenses-stats fade-in-up">
          <div className="stat-card glass-card">
            <span className="stat-value">{totalSpent.toFixed(2)}€</span>
            <span className="stat-label">Gasto Total</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value">{perPerson.toFixed(2)}€</span>
            <span className="stat-label">Couta / Persona</span>
          </div>
        </section>

        <div className="auth-tabs" style={{ marginBottom: '3rem' }}>
          <button className={`auth-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
             Lista de Gastos
          </button>
          <button className={`auth-tab ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>
             Balance de Deudas
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="items-list fade-in-up">
            {expenses.length === 0 ? (
              <div className="empty-state glass-card" style={{ padding: '4rem' }}>
                <ShoppingBag size={48} opacity="0.1" style={{ marginBottom: '1rem' }} />
                <p>No hay gastos registrados.</p>
              </div>
            ) : expenses.map(exp => (
              <div key={exp.id} className="item-row glass-card">
                <div className="expense-info">
                  <div className="expense-desc" style={{ fontWeight: 700, fontSize: '1.2rem' }}>{exp.description}</div>
                  <div className="expense-meta" style={{ marginTop: '0.5rem' }}>
                    <span className="badge" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.3rem 0.7rem' }}>{exp.category}</span>
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Pagado por: {exp.profiles?.full_name || exp.profiles?.email?.split('@')[0]}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div className="expense-amount" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{parseFloat(exp.amount).toFixed(2)}€</div>
                  {isTitular && (
                    <button className="btn btn-ghost btn-icon" onClick={() => deleteExpense(exp.id)} style={{ color: 'var(--coral)' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="items-list fade-in-up">
            {balanceData.map(b => (
              <div key={b.userId} className="item-row glass-card">
                <div className="expense-info">
                  <div className="expense-desc" style={{ fontWeight: 700 }}>{b.name}</div>
                  <div className="expense-meta">Total aportado: {b.paid.toFixed(2)}€</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'flex-end',
                     gap: '10px',
                     color: b.balance >= 0 ? 'var(--mint)' : 'var(--coral)',
                     fontWeight: 800,
                     fontSize: '1.5rem'
                   }}>
                     {b.balance >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                     {Math.abs(b.balance).toFixed(2)}€
                   </div>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                     {b.balance >= 0 ? 'A FAVOR' : 'DEBE PAGAR'}
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Mobile Only */}
      <button className="fab-module show-mobile-only" onClick={() => setShowModal(true)}>
        <Plus size={32} />
      </button>

      {showModal && (
        <Modal title="Añadir Gasto" onClose={() => setShowModal(false)}>
          <form onSubmit={addExpense} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-input" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej. Cena, Vuelos, Taxi..." />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Importe (€)</label>
                <input type="number" step="0.01" className="form-input" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                   <option value="Comida">Comida</option>
                   <option value="Transporte">Transporte</option>
                   <option value="Alojamiento">Alojamiento</option>
                   <option value="Ocio">Ocio</option>
                   <option value="Otros">Otros</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">¿Quién ha pagado?</label>
              <select className="form-input" value={form.paid_by} onChange={e => setForm(f => ({ ...f, paid_by: e.target.value }))}>
                 <option value="">Yo ({user.email})</option>
                 {members.filter(m => m.user_id !== user.id).map(m => (
                   <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.profiles?.email}</option>
                 ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>Guardar Gasto</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
