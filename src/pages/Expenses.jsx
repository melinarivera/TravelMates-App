import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, DollarSign, PiggyBank, 
  TrendingDown, TrendingUp, ShoppingBag
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

    const { data: exps, error } = await supabase
      .from('expenses')
      .select('*, profiles!paid_by(full_name, email)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    
    if (error) console.error('Fetch expenses error:', error)
    if (exps) setExpenses(exps)
    setLoading(false)
  }

  async function addExpense(e) {
    e.preventDefault()
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
      alert('Error al guardar: ' + error.message)
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
              <DollarSign size={24} />
            </div>
            <div>
              <h1 className="module-title text-gradient">Gastos</h1>
              <p className="module-subtitle">Cuentas claras entre amigos</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Añadir
          </button>
        </header>

        <section className="expenses-stats fade-in-up delay-1">
          <div className="stat-card glass-card">
            <span className="stat-value">{totalSpent.toFixed(2)}€</span>
            <span className="stat-label">Total Viaje</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value">{perPerson.toFixed(2)}€</span>
            <span className="stat-label">Por Persona</span>
          </div>
        </section>

        <div className="auth-tabs" style={{ marginBottom: '2rem' }}>
          <button className={`auth-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
             Lista de Gastos
          </button>
          <button className={`auth-tab ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>
             Balance / Deudas
          </button>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {activeTab === 'list' ? (
              <div className="items-list fade-in-up">
                {expenses.length === 0 ? (
                  <div className="empty-state glass-card">
                    <ShoppingBag size={48} opacity="0.1" />
                    <p>No hay gastos registrados aún.</p>
                  </div>
                ) : expenses.map(exp => (
                  <div key={exp.id} className="item-row glass-card">
                    <div className="expense-info">
                      <div className="expense-desc">{exp.description}</div>
                      <div className="expense-meta">
                        <span className="badge" style={{ background: 'var(--primary-glow)', color: 'white', border: '1px solid var(--primary)' }}>{exp.category}</span>
                        <span>Pagó: {exp.profiles?.full_name || exp.profiles?.email?.split('@')[0] || 'Desconocido'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="expense-amount" style={{ fontSize: '1.25rem', fontWeight: 800 }}>{parseFloat(exp.amount).toFixed(2)}€</div>
                      {isTitular && (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteExpense(exp.id)} style={{ color: 'var(--coral)' }}>
                          <Trash2 size={16} />
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
                      <div className="expense-desc">{b.name}</div>
                      <div className="expense-meta">Total aportado: {b.paid.toFixed(2)}€</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'flex-end',
                         gap: '8px',
                         color: b.balance >= 0 ? 'var(--mint)' : 'var(--coral)',
                         fontWeight: 'bold',
                         fontSize: '1.3rem'
                       }}>
                         {b.balance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                         {Math.abs(b.balance).toFixed(2)}€
                       </div>
                       <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                         {b.balance >= 0 ? 'A favor' : 'Debe pagar'}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <button className="fab-module show-mobile-only" onClick={() => setShowModal(true)}>
        <Plus size={32} />
      </button>

      {showModal && (
        <Modal title="Registrar Gasto" onClose={() => setShowModal(false)}>
          <form onSubmit={addExpense} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-input" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej. Cena, Vuelo, Entradas..." />
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
              <label className="form-label">¿Quién pagó?</label>
              <select className="form-input" value={form.paid_by} onChange={e => setForm(f => ({ ...f, paid_by: e.target.value }))}>
                 <option value="">Yo ({user.email})</option>
                 {members.filter(m => m.user_id !== user.id).map(m => (
                   <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.profiles?.email}</option>
                 ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
