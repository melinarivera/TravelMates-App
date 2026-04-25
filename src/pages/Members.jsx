import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Users, Mail, Check, X, Shield, Star
} from 'lucide-react'
import './ModulePage.css'

export default function Members() {
  const { tripId } = useParams()
  const { user: currentUser } = useAuth()
  const [members, setMembers] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    setLoading(true)
    const { data: mems } = await supabase
      .from('trip_members')
      .select('*, profiles(full_name, email)')
      .eq('trip_id', tripId)
    
    if (mems) {
      setMembers(mems)
      const me = mems.find(m => m.user_id === currentUser.id)
      if (me) setMyRole(me.role)
    }
    setLoading(false)
  }

  async function inviteMember(e) {
    e.preventDefault()
    setInviting(true)
    const { error } = await supabase.from('trip_members').insert({
      trip_id: tripId,
      invite_email: email,
      role: 'invitado',
      status: 'pending'
    })
    if (!error) {
      setShowModal(false)
      setEmail('')
      fetchData()
    } else {
      alert('Error: ' + error.message)
    }
    setInviting(false)
  }

  async function removeMember(id) {
    if (!confirm('¿Eliminar integrante?')) return
    await supabase.from('trip_members').delete().eq('id', id)
    fetchData()
  }

  const isTitular = myRole === 'titular'

  return (
    <div className="module-page">
      <Navbar />

      <div className="container module-body">
        <header className="module-header fade-in-up">
          <div className="module-title-group">
            <div className="module-icon-box">
              <Users size={28} />
            </div>
            <div>
              <h1 className="module-title">Integrantes</h1>
              <p className="module-subtitle">Gestiona tu equipo de viaje</p>
            </div>
          </div>
          <button className="btn btn-add-desktop hide-mobile" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Invitar Amigo
          </button>
        </header>

        <div className="items-list fade-in-up">
          {members.map(m => (
            <div key={m.id} className="item-row glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div className="avatar" style={{ width: '60px', height: '60px', fontSize: '1.2rem' }}>
                {(m.profiles?.full_name || m.profiles?.email || m.invite_email || '?').slice(0, 1).toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                   <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'white' }}>
                     {m.profiles?.full_name || m.profiles?.email || m.invite_email}
                   </span>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className={`badge ${m.role === 'titular' ? 'badge-sun' : 'badge-slate'}`} style={{ border: 'none', padding: '0.3rem 0.8rem' }}>
                        {m.role === 'titular' ? <><Star size={12} /> Titular</> : 'Invitado'}
                      </span>
                      <span className={`badge ${m.status === 'accepted' ? 'badge-sky' : 'badge-slate'}`} style={{ border: 'none', padding: '0.3rem 0.8rem' }}>
                        {m.status === 'accepted' ? 'Aceptado' : 'Pendiente'}
                      </span>
                   </div>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Mail size={14} /> {m.profiles?.email || m.invite_email}
                </div>
              </div>
              
              {isTitular && m.user_id !== currentUser.id && (
                <button className="btn btn-ghost btn-icon" onClick={() => removeMember(m.id)} style={{ color: 'var(--coral)' }}>
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="fab-module show-mobile-only" onClick={() => setShowModal(true)}>
        <Plus size={32} />
      </button>

      {showModal && (
        <Modal title="Invitar al viaje" onClose={() => setShowModal(false)}>
          <form onSubmit={inviteMember} className="create-trip-form">
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Correo electrónico</label>
              <input type="email" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} placeholder="amigo@ejemplo.com" />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                Tu amigo recibirá una invitación y podrá unirse al viaje cuando inicie sesión.
              </p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={inviting} style={{ flex: 2 }}>Enviar Invitación</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
