import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { Plus, Trash2, DollarSign, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react'
import './ModulePage.css'

const CATEGORIES = ['Alojamiento', 'Transporte', 'Comida', 'Actividades', 'Compras', 'Otros']

export default function Expenses() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [tripName, setTripName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Otros', paid_by: user.id, split_with: [] })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    const { data: trip } = await supabase.from('trips').select('name').eq('id', tripId).single()
    if (trip) setTripName(trip.name)

    const { data: mems } = await supabase
      .from('trip_members')
      .select('user_id, profile:profiles(full_name)')
      .eq('trip_id', tripId)
    if (mems) setMembers(mems)

    const { data: exps } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    if (exps) setExpenses(exps)
    setLoading(false)
  }

  async function addExpense(e) {
    e.preventDefault()
    setCreating(true)
    const splitWith = form.split_with.length > 0 ? form.split_with : members.map(m => m.user_id)
    const { error } = await supabase.from('expenses').insert({
      trip_id: tripId,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      paid_by: form.paid_by,
      split_with: splitWith,
      user_id: user.id,
    })
    if (!error) {
      setShowModal(false)
      setForm({ description: '', amount: '', category: 'Otros', paid_by: user.id, split_with: [] })
      fetchData()
    }
    setCreating(false)
  }

  async function deleteExpense(id) {
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0)

  // Balance calculation
  const balances = {}
  members.forEach(m => { balances[m.user_id] = { paid: 0, owes: 0, name: m.profile?.full_name || m.user_id.slice(0,8) } })
  expenses.forEach(exp => {
    if (balances[exp.paid_by]) balances[exp.paid_by].paid += exp.amount
    const splitCount = (exp.split_with || []).length || 1
    const share = exp.amount / splitCount;
    (exp.split_with || []).forEach(uid => {
      if (balances[uid]) balances[uid].owes += share
    })
  })

  const CATEGORY_COLORS = {
    'Alojamiento': '#4ECDC4', 'Transporte': '#A855F7', 'Comida': '#FF6B6B',
    'Actividades': '#6BCB77', 'Compras': '#FFE66D', 'Otros': '#8898B3'
  }

  return (
    <div className="module-page">
      <Navbar tripName={tripName} />
      <div className="container module-body">
        <div className="module-header fade-in-up">
          <div className="module-header-icon" style={{ background: 'var(--grad-expenses)' }}>💸</div>
          <div>
            <h1 className="module-title">Gastos</h1>
            <p className="module-subtitle">{expenses.length} gastos registrados</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }} id="add-expense-btn">
            <Plus size={18} /> Añadir gasto
          </button>
        </div>

        {/* Stats */}
        <div className="expenses-stats fade-in-up delay-1">
          <div className="expense-stat glass">
            <DollarSign size={22} style={{ color: 'var(--coral)' }} />
            <div>
              <div className="expense-stat-value">{total.toFixed(2)}€</div>
              <div className="expense-stat-label">Total gastado</div>
            </div>
          </div>
          <div className="expense-stat glass">
            <Users size={22} style={{ color: 'var(--sky)' }} />
            <div>
              <div className="expense-stat-value">{members.length > 0 ? (total / members.length).toFixed(2) : '0.00'}€</div>
              <div className="expense-stat-label">Por persona</div>
            </div>
          </div>
          <div
            className="expense-stat glass expense-stat-balance"
            onClick={() => setShowBalance(!showBalance)}
            style={{ cursor: 'pointer' }}
          >
            <TrendingUp size={22} style={{ color: 'var(--mint)' }} />
            <div>
              <div className="expense-stat-value">Balance</div>
              <div className="expense-stat-label">Ver liquidación</div>
            </div>
            {showBalance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Balance panel */}
        {showBalance && (
          <div className="balance-panel glass fade-in-up">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>💰 Liquidación de gastos</h3>
            {Object.entries(balances).map(([uid, b]) => {
              const net = b.paid - b.owes
              return (
                <div key={uid} className="balance-row">
                  <div className="avatar avatar-sm">{b.name.slice(0,2).toUpperCase()}</div>
                  <span className="balance-name">{b.name}</span>
                  <span className="balance-paid">pagó {b.paid.toFixed(2)}€</span>
                  <span className={`balance-net ${net >= 0 ? 'positive' : 'negative'}`}>
                    {net >= 0 ? `+${net.toFixed(2)}€` : `${net.toFixed(2)}€`}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Expense list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3 className="empty-state-title">Sin gastos aún</h3>
            <p className="empty-state-text">Añade el primer gasto del viaje</p>
          </div>
        ) : (
          <div className="expenses-list fade-in-up delay-2">
            {expenses.map(exp => {
              const color = CATEGORY_COLORS[exp.category] || '#8898B3'
              const payer = members.find(m => m.user_id === exp.paid_by)
              return (
                <div key={exp.id} className="expense-item glass">
                  <div className="expense-cat-dot" style={{ background: color }} />
                  <div className="expense-info">
                    <div className="expense-desc">{exp.description}</div>
                    <div className="expense-meta">
                      <span className="badge" style={{ background: `${color}22`, color }}>{exp.category}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                        pagado por {payer?.profile?.full_name || 'alguien'}
                      </span>
                    </div>
                  </div>
                  <div className="expense-amount">{parseFloat(exp.amount).toFixed(2)}€</div>
                  {exp.user_id === user.id && (
                    <button className="btn btn-ghost btn-icon" onClick={() => deleteExpense(exp.id)}>
                      <Trash2 size={16} style={{ color: 'var(--coral)' }} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="💸 Añadir gasto" onClose={() => setShowModal(false)}>
          <form onSubmit={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="exp-desc">Descripción *</label>
              <input id="exp-desc" type="text" className="form-input" placeholder="Cena en restaurante"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="exp-amount">Importe (€) *</label>
                <input id="exp-amount" type="number" step="0.01" min="0" className="form-input" placeholder="42.50"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="exp-cat">Categoría</label>
                <select id="exp-cat" className="form-select"
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="exp-paid">Pagado por</label>
              <select id="exp-paid" className="form-select"
                value={form.paid_by} onChange={e => setForm(f => ({ ...f, paid_by: e.target.value }))}>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || m.user_id.slice(0,8)}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={creating} id="confirm-expense-btn">
                {creating ? <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : <><Plus size={16} /> Guardar</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
