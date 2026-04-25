import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Users, Mail, Star, UserPlus
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
            <div className="module-icon-box"><Users size={32} /></div>
            <div>
              <h1 className="module-title">Integrantes</h1>
              <p className="module-subtitle">Tu equipo de viaje</p>
            </div>
          </div>
          {/* BOTÓN VERDE ARRIBA (TAMBIÉN EN MÓVIL) */}
          <button className="btn btn-add-vibrant" onClick={() => setShowModal(true)}>
            <Plus size={22} /> Invitar Amigo
          </button>
        </header>

        <div className="items-list fade-in-up">
          {members.map(m => {
            const displayName = m.profiles?.full_name || m.profiles?.email || m.invite_email
            const initials = displayName.slice(0, 2).toUpperCase()
            const isMe = m.user_id === currentUser.id

            return (
              <div key={m.id} className="item-row glass-card member-card">
                <div className="avatar">{initials}</div>
                
                <div className="member-info">
                  <div className="member-top">
                    <span className="member-name">{displayName}</span>
                    <div className="member-tags">
                      {m.role === 'titular' ? (
                        <span className="badge-premium badge-titular">
                          <Star size={14} fill="currentColor" /> Titular
                        </span>
                      ) : (
                        <span className="badge-premium badge-guest">Invitado</span>
                      )}
                      
                      <span className={`badge-premium ${m.status === 'accepted' ? 'badge-ok' : 'badge-slate'}`}>
                        {m.status === 'accepted' ? 'Aceptado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="member-actions">
                  {isTitular && !isMe && (
                    <button className="btn-delete-vibrant" onClick={() => removeMember(m.id)}>
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <Modal title="Invitar Amigo" onClose={() => setShowModal(false)}>
          <form onSubmit={inviteMember} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Email de tu amigo</label>
              <div className="form-input-with-icon">
                <UserPlus size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-input" style={{ paddingLeft: '3rem' }} required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@hola.com" />
              </div>
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn btn-add-vibrant" disabled={inviting} style={{ width: '100%' }}>
                Enviar Invitación Verde
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
