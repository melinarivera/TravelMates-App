import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, DollarSign, TrendingDown, TrendingUp, Wallet, Receipt, Users
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
      // 1. Obtener integrantes con sus perfiles
      const { data: mems } = await supabase
        .from('trip_members')
        .select('user_id, role, profiles(id, full_name, email)')
        .eq('trip_id', tripId)
        .eq('status', 'accepted')
      
      if (mems) {
        setMembers(mems)
        const me = mems.find(m => m.user_id === user.id)
        if (me) setMyRole(me.role)
      }

      // 2. Obtener gastos (consulta simple para evitar fallos de join)
      const { data: exps } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
      
      if (exps) setExpenses(exps)
    } catch (err) {
      console.error("Error fetching data:", err)
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

    if (!error) {
      setShowModal(false)
      setForm({ description: '', amount: '', category: 'Otros', paid_by: '' })
      fetchData()
    }
    setSaving(false)
  }

  async function deleteExpense(id) {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }

  // CÁLCULOS SEGUROS
  const safeExpenses = expenses || []
  const safeMembers = members || []

  const totalSpent = safeExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
  const perPerson = safeMembers.length > 0 ? totalSpent / safeMembers.length : 0

  const balanceData = safeMembers.map(m => {
    const paid = safeExpenses
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

  // Función para obtener nombre del pagador desde la lista de miembros
  const getPayerName = (paidById) => {
    const member = safeMembers.find(m => m.user_id === paidById)
    return member?.profiles?.full_name || member?.profiles?.email?.split('@')[0] || 'Viajero'
  }

  return (
    <div className="module-page">
      <Navbar />
      <div className="container module-body">
        <header className="module-header">
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

        <section className="expenses-stats">
          <div className="stat-card-premium stat-card-total">
            <span className="stat-card-label">Total Gastado</span>
            <span className="stat-card-value">{totalSpent.toFixed(2)}€</span>
            <DollarSign size={70} className="stat-card-icon" />
          </div>
          <div className="stat-card-premium stat-card-perperson">
            <span className="stat-card-label">Cada uno paga</span>
            <span className="stat-card-value">{perPerson.toFixed(2)}€</span>
            <Users size={70} className="stat-card-icon" />
          </div>
        </section>

        <div className="segmented-control" style={{ marginBottom: '2rem' }}>
          <button className={`segment-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            <Receipt size={18} /> Lista
          </button>
          <button className={`segment-btn ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>
            <Wallet size={18} /> Balances
          </button>
        </div>

        {loading ? <div className="page-loading"><div className="spinner" /></div> : (
          <div className="items-list">
            {activeTab === 'list' ? (
              safeExpenses.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
                   Todavía no hay gastos registrados.
                </div>
              ) : (
                safeExpenses.map(exp => (
                  <div key={exp.id} className="item-row glass-card expense-item-card">
                    <div className="expense-info">
                      <div className="member-name">{exp.description}</div>
                      <div className="member-tags">
                        <span className="badge-guest">{exp.category}</span>
                        <span className="expense-subtitle">Pagado por: {getPayerName(exp.paid_by)}</span>
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
              )
            ) : (
              balanceData.map(b => (
                <div key={b.userId} className="item-row glass-card expense-item-card">
                  <div className="expense-info">
                    <div className="member-name">{b.name}</div>
                    <div className="expense-subtitle">Aportación: {b.paid.toFixed(2)}€</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'flex-end',
                       gap: '8px',
                       color: b.balance >= 0 ? '#39ff14' : '#ff3131',
                       fontWeight: 900,
                       fontSize: '1.6rem'
                     }}>
                       {b.balance >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                       {Math.abs(b.balance).toFixed(2)}€
                     </div>
                     <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: b.balance >= 0 ? '#39ff14' : '#ff3131' }}>
                        {b.balance >= 0 ? 'A favor' : 'Debe'}
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
              <input type="text" className="form-input" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Cena en el puerto" />
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
              Guardar Gasto
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
