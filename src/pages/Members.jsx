import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { UserPlus, Trash2, Crown, User, Mail, CheckCircle, Clock, XCircle, Users } from 'lucide-react'
import './ModulePage.css'

const ROLE_MAP = {
  titular:  { label: 'Titular',  icon: <Crown size={14} />,  color: 'var(--sun-dk)' },
  invitado: { label: 'Invitado', icon: <User size={14} />,   color: 'var(--sky-dk)' },
}

const STATUS_MAP = {
  accepted: { label: 'Aceptado', icon: <CheckCircle size={14} />, color: 'var(--mint)' },
  pending:  { label: 'Pendiente', icon: <Clock size={14} />,      color: 'var(--sun-dk)' },
  rejected: { label: 'Rechazado', icon: <XCircle size={14} />,    color: 'var(--coral)' },
}

export default function Members() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [trip, setTrip] = useState(null)
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    const { data: tripData } = await supabase.from('trips').select('name, owner_id').eq('id', tripId).single()
    if (tripData) setTrip(tripData)

    const { data } = await supabase
      .from('trip_members')
      .select('*, profile:profiles(full_name, avatar_url)')
      .eq('trip_id', tripId)
      .order('created_at')

    if (data) {
      setMembers(data)
      const me = data.find(m => m.user_id === user.id)
      if (me) setMyRole(me.role)
    }
    setLoading(false)
  }

  async function inviteMember(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)

    try {
      // 1. Check if user already exists in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single()

      if (profile) {
        // User exists, add by ID
        const { error } = await supabase.from('trip_members').insert({
          trip_id: tripId,
          user_id: profile.id,
          role: 'invitado',
          status: 'pending',
        })
        if (error) {
          if (error.code === '23505') alert('Este usuario ya está en el viaje.')
          else throw error
        } else {
          alert('¡Usuario añadido! Ahora debe aceptar la invitación.')
        }
      } else {
        // User doesn't exist, add by email (the trigger will link them later)
        const { error } = await supabase.from('trip_members').insert({
          trip_id: tripId,
          invite_email: inviteEmail.trim().toLowerCase(),
          role: 'invitado',
          status: 'pending',
        })
        if (error) {
          if (error.code === '23505') alert('Ya hay una invitación pendiente para este email.')
          else throw error
        } else {
          alert(`¡Invitación guardada! Cuando ${inviteEmail} se registre, aparecerá aquí automáticamente.`)
        }
      }
      setInviteEmail('')
      setShowInvite(false)
      fetchData()
    } catch (err) {
      console.error('Error inviting:', err)
      alert(`Error al enviar la invitación: ${err.message || 'Error desconocido'}`)
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(memberId) {
    if (!confirm('¿Eliminar este integrante del viaje?')) return
    await supabase.from('trip_members').delete().eq('id', memberId)
    fetchData()
  }

  const isTitular = myRole === 'titular' || trip?.owner_id === user.id

  return (
    <div className="module-page">
      <Navbar tripName={trip?.name} />
      <div className="container module-body">
        <div className="module-header fade-in-up">
          <div className="module-header-icon" style={{ background: 'var(--grad-members)' }}>
            <Users size={32} color="white" />
          </div>
          <div>
            <h1 className="module-title">Integrantes</h1>
            <p className="module-subtitle">{members.length} personas en este viaje</p>
          </div>
          {isTitular && (
            <button className="btn btn-primary" onClick={() => setShowInvite(true)} style={{ marginLeft: 'auto' }} id="invite-member-btn">
              <UserPlus size={18} /> Invitar
            </button>
          )}
        </div>

        {loading ? (
          <div className="members-loading">
            {[1,2,3].map(i => <div key={i} className="member-skeleton skeleton" />)}
          </div>
        ) : (
          <div className="members-list fade-in-up delay-1">
            {members.map(member => {
              const role = ROLE_MAP[member.role] || ROLE_MAP.invitado
              const status = STATUS_MAP[member.status] || STATUS_MAP.pending
              const initials = member.profile?.full_name?.slice(0, 2).toUpperCase()
                || member.invite_email?.slice(0, 2).toUpperCase()
                || '??'
              const isMe = member.user_id === user.id

              return (
                <div key={member.id} className={`member-card glass ${isMe ? 'member-card-me' : ''}`}>
                  <div className="avatar avatar-lg">{initials}</div>
                  <div className="member-info">
                    <div className="member-name">
                      {member.profile?.full_name || member.invite_email || 'Invitado pendiente'}
                      {isMe && <span className="member-you-tag">Tú</span>}
                    </div>
                    <div className="member-tags">
                      <span className="member-tag" style={{ color: role.color, background: `${role.color}22` }}>
                        {role.icon} {role.label}
                      </span>
                      <span className="member-tag" style={{ color: status.color, background: `${status.color}22` }}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                  </div>
                  {isTitular && !isMe && member.role !== 'titular' && (
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => removeMember(member.id)}
                      title="Eliminar integrante"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showInvite && (
        <Modal title="👥 Invitar integrante" onClose={() => setShowInvite(false)}>
          <form onSubmit={inviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="invite-email">Email del integrante</label>
              <div className="form-input-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="invite-email"
                  type="email"
                  className="form-input"
                  placeholder="amigo@email.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
              El integrante recibirá un email para unirse al viaje.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowInvite(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={inviting} id="confirm-invite-btn">
                {inviting ? <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : <><UserPlus size={16} /> Invitar</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
