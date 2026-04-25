import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Users, Star, UserPlus, Mail
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
          <button className="btn-add-vibrant" onClick={() => setShowModal(true)}>
            <Plus size={22} /> Invitar
          </button>
        </header>

        <div className="items-list fade-in-up" style={{ marginTop: '3rem' }}>
          {loading ? <div className="page-loading"><div className="spinner" /></div> : (
            members.length === 0 ? (
              <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
                 <Users size={48} style={{ marginBottom: '1.5rem', color: 'var(--btn-add)' }} />
                 <p style={{ fontSize: '1.2rem' }}>Aún no hay integrantes.</p>
              </div>
            ) : members.map(m => {
              const displayName = m.profiles?.full_name || m.profiles?.email || m.invite_email
              const initials = displayName.slice(0, 2).toUpperCase()
              const isMe = m.user_id === currentUser.id

              return (
                <div key={m.id} className="item-row glass-card member-card">
                  <div className="avatar">{initials}</div>
                  
                  <div className="member-info">
                    <div className="member-name">{displayName} {isMe && "(Tú)"}</div>
                    <div className="member-tags">
                      {m.role === 'titular' ? (
                        <span className="badge-titular">
                          <Star size={14} fill="currentColor" /> Titular
                        </span>
                      ) : (
                        <span className="badge-guest">Invitado</span>
                      )}
                      
                      <span className={`badge-ok ${m.status !== 'accepted' ? 'badge-pending' : ''}`}>
                        {m.status === 'accepted' ? 'Aceptado' : 'Pendiente'}
                      </span>
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
            })
          )}
        </div>
      </div>

      {showModal && (
        <Modal title="Invitar Amigo" onClose={() => setShowModal(false)}>
          <form onSubmit={inviteMember} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Email de tu amigo</label>
              <div className="form-input-container">
                <Mail className="form-input-icon" size={20} />
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="email@ejemplo.com" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-add-vibrant" 
              disabled={inviting} 
              style={{ width: '100%', marginTop: '1.5rem', height: '60px', fontSize: '1.1rem', justifyContent: 'center' }}
            >
              <UserPlus size={22} /> Enviar Invitación
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
