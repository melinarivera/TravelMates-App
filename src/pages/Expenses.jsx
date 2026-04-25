import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, DollarSign, Users, PiggyBank, 
  ArrowRight, Check, ShoppingBag, Utensils, Car, Home,
  CreditCard, TrendingDown, TrendingUp
} from 'lucide-react'
import './ModulePage.css'

export default function Expenses() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('list') // 'list' | 'balance'
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [tripName, setTripName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Otros', paid_by: '', split_with: [] })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
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
      setForm({ description: '', amount: '', category: 'Otros', paid_by: '', split_with: [] })
      fetchData()
    }
    setSaving(false)
  }

  async function deleteExpense(id) {
    if (!confirm('¿Eliminar gasto?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }

  const totalSpent = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
  const perPerson = members.length > 0 ? totalSpent / members.length : 0

  // CALCULAR BALANCE
  const balanceData = members.map(m => {
    const paid = expenses
      .filter(e => e.paid_by === m.user_id)
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0)
    
    return {
      userId: m.user_id,
      name: m.profiles?.full_name || m.profiles?.email?.split('@')[0],
      paid: paid,
      balance: paid - perPerson
    }
  })

  const isTitular = myRole === 'titular'

  return (
    <div className="module-page">
      <Navbar tripName={tripName} />

      <div className="container module-body">
        <header className="module-header fade-in-up">
          <div className="module-title-group">
            <div className="module-icon-box">
              <DollarSign size={32} />
            </div>
            <div>
              <h1 className="module-title text-gradient">Gastos</h1>
              <p className="module-subtitle">Divide los costos del viaje</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> <span className="hide-mobile">Añadir gasto</span>
          </button>
        </header>

        <section className="expenses-stats fade-in-up">
          <div className="stat-card glass-card">
            <span className="stat-value">{totalSpent.toFixed(2)}€</span>
            <span className="stat-label">Total gastado</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value">{perPerson.toFixed(2)}€</span>
            <span className="stat-label">Promedio / Persona</span>
          </div>
        </section>

        <div className="auth-tabs" style={{ marginBottom: '2rem' }}>
          <button className={`auth-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
             Lista de Gastos
          </button>
          <button className={`auth-tab ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>
             Balance y Deudas
          </button>
        </div>

        {activeTab === 'list' ? (
          <div className="items-list fade-in-up">
            {expenses.length === 0 ? (
              <div className="empty-state glass-card">
                <p>No hay gastos registrados.</p>
              </div>
            ) : expenses.map(exp => (
              <div key={exp.id} className="item-row glass-card">
                <div className="expense-info">
                  <div className="expense-desc">{exp.description}</div>
                  <div className="expense-meta">
                    <span className="badge badge-accent">{exp.category}</span>
                    <span>Pagado por: {exp.profiles?.full_name || exp.profiles?.email?.split('@')[0]}</span>
                  </div>
                </div>
                <div className="expense-amount">{parseFloat(exp.amount).toFixed(2)}€</div>
                {isTitular && (
                  <button className="btn btn-ghost btn-icon" onClick={() => deleteExpense(exp.id)} style={{ color: 'var(--coral)' }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="items-list fade-in-up">
            {balanceData.map(b => (
              <div key={b.userId} className="item-row glass-card">
                <div className="expense-info">
                  <div className="expense-desc">{b.name}</div>
                  <div className="expense-meta">
                    Ha pagado un total de {b.paid.toFixed(2)}€
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '8px',
                     color: b.balance >= 0 ? 'var(--mint)' : 'var(--coral)',
                     fontWeight: 'bold',
                     fontSize: '1.2rem'
                   }}>
                     {b.balance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                     {Math.abs(b.balance).toFixed(2)}€
                   </div>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                     {b.balance >= 0 ? 'Le deben' : 'Debe pagar'}
                   </span>
                </div>
              </div>
            ))}
            
            <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px dashed var(--glass-border)' }}>
               <h4 style={{ margin: '0 0 1rem' }}>Sugerencia de Liquidación</h4>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Para saldar las deudas, los que están en rojo deben transferir su monto negativo a los que están en verde.
               </p>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Nuevo Gasto" onClose={() => setShowModal(false)}>
          <form onSubmit={addExpense} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-input" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej. Cena primer día" />
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
              <label className="form-label">Pagado por</label>
              <select className="form-input" value={form.paid_by} onChange={e => setForm(f => ({ ...f, paid_by: e.target.value }))}>
                 <option value="">Yo ({user.email})</option>
                 {members.filter(m => m.user_id !== user.id).map(m => (
                   <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.profiles?.email}</option>
                 ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
