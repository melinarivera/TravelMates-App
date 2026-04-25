import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { UserPlus, Trash2, Crown, User, Mail, CheckCircle, Clock, XCircle, Users } from 'lucide-react'
import './ModulePage.css'

const ROLE_MAP = {
  titular:  { label: 'Titular',  icon: <Crown size={14} />,  color: 'var(--sun)' },
  invitado: { label: 'Invitado', icon: <User size={14} />,   color: 'var(--accent)' },
}

const STATUS_MAP = {
  accepted: { label: 'Aceptado', icon: <CheckCircle size={14} />, color: 'var(--mint)' },
  pending:  { label: 'Pendiente', icon: <Clock size={14} />,      color: 'var(--sun)' },
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
    if (!tripId) return
    setLoading(true)

    try {
      const { data: tripData } = await supabase.from('trips').select('name, owner_id').eq('id', tripId).single()
      if (tripData) setTrip(tripData)

      const { data } = await supabase
        .from('trip_members')
        .select('*, profile:profiles(full_name, avatar_url, email)')
        .eq('trip_id', tripId)
        .order('created_at')

      if (data) {
        setMembers(data)
        const me = data.find(m => m.user_id === user.id)
        if (me) setMyRole(me.role)
      }
    } catch (err) {
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }

  async function inviteMember(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single()

      if (profile) {
        await supabase.from('trip_members').insert({
          trip_id: tripId,
          user_id: profile.id,
          role: 'invitado',
          status: 'pending',
        })
      } else {
        await supabase.from('trip_members').insert({
          trip_id: tripId,
          invite_email: inviteEmail.trim().toLowerCase(),
          role: 'invitado',
          status: 'pending',
        })
      }
      setInviteEmail('')
      setShowInvite(false)
      fetchData()
    } catch (err) {
      console.error('Error inviting:', err)
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(memberId) {
    if (!confirm('¿Eliminar integrante?')) return
    await supabase.from('trip_members').delete().eq('id', memberId)
    fetchData()
  }

  async function transferTitle(targetUserId) {
    if (!confirm('¿Transferir titularidad?')) return
    await supabase.from('trip_members').update({ role: 'titular' }).eq('trip_id', tripId).eq('user_id', targetUserId)
    await supabase.from('trip_members').update({ role: 'invitado' }).eq('trip_id', tripId).eq('user_id', user.id)
    await supabase.from('trips').update({ owner_id: targetUserId }).eq('id', tripId)
    fetchData()
  }

  const isTitular = myRole === 'titular' || trip?.owner_id === user.id

  return (
    <div className="module-page">
      <Navbar tripName={trip?.name} />
      <div className="container module-body">
        <header className="module-header fade-in-up">
           <div className="module-title-group">
              <div className="module-icon-box">
                <Users size={32} />
              </div>
              <div>
                <h1 className="module-title text-gradient">Integrantes</h1>
                <p className="module-subtitle">{members.length} viajeros confirmados</p>
              </div>
           </div>
           {isTitular && (
             <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
               <UserPlus size={18} /> <span className="hide-mobile">Invitar amigo</span>
             </button>
           )}
        </header>

        {loading ? <div className="spinner" /> : (
          <div className="items-list fade-in-up delay-1">
            {members.map(member => {
              const role = ROLE_MAP[member.role] || ROLE_MAP.invitado
              const status = STATUS_MAP[member.status] || STATUS_MAP.pending
              const displayName = member.profile?.full_name || member.profile?.email || member.invite_email || 'Viajero'
              const initials = displayName.slice(0, 2).toUpperCase()
              const isMe = member.user_id === user.id

              return (
                <div key={member.id} className="item-row glass-card member-row">
                  <div className="avatar avatar-lg">{initials}</div>
                  <div className="expense-info">
                    <div className="expense-desc">
                       {displayName}
                       {isMe && <span className="badge badge-accent" style={{ marginLeft: '0.75rem' }}>Tú</span>}
                    </div>
                    <div className="member-status-tags" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                       <span className="badge" style={{ color: role.color, borderColor: `${role.color}44`, background: `${role.color}11`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                         {role.icon} {role.label}
                       </span>
                       <span className="badge" style={{ color: status.color, borderColor: `${status.color}44`, background: `${status.color}11`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                         {status.icon} {status.label}
                       </span>
                    </div>
                  </div>
                  
                  <div className="activity-actions">
                     {isTitular && !isMe && member.status === 'accepted' && (
                       <button className="btn btn-ghost btn-icon" onClick={() => transferTitle(member.user_id)} title="Hacer titular">
                         <Crown size={20} color="var(--sun)" />
                       </button>
                     )}
                     {isTitular && !isMe && (
                       <button className="btn btn-ghost btn-icon" onClick={() => removeMember(member.id)} style={{ color: 'var(--coral)' }}>
                         <Trash2 size={20} />
                       </button>
                     )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showInvite && (
        <Modal title="Invitar viajero" onClose={() => setShowInvite(false)}>
          <form onSubmit={inviteMember} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Email del amigo</label>
              <div className="form-input-with-icon">
                <Mail size={18} className="input-icon" />
                <input type="email" className="form-input" placeholder="email@hola.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowInvite(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={inviting}>Invitar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
