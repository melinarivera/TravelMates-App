import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import {
  Users, DollarSign, Calendar, Map, MessageCircle,
  Settings, ArrowLeft, Edit3, Check, X, Send,
  ChevronRight, Clock, MapPin, Plus
} from 'lucide-react'
import './TripHub.css'

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planificando', color: 'var(--primary)' },
  { value: 'active',   label: 'En curso',     color: 'var(--mint)' },
  { value: 'done',     label: 'Finalizado',   color: 'var(--slate)' },
]

const HUB_MODULES = [
  {
    key: 'members',
    label: 'Integrantes',
    desc: 'Gestiona quién viaja contigo',
    icon: <Users size={28} />,
    grad: 'var(--grad-members)',
  },
  {
    key: 'expenses',
    label: 'Gastos',
    desc: 'Divide y controla el presupuesto',
    icon: <DollarSign size={28} />,
    grad: 'var(--grad-expenses)',
  },
  {
    key: 'itinerary',
    label: 'Itinerario',
    desc: 'Planifica día a día',
    icon: <Calendar size={28} />,
    grad: 'var(--grad-itinerary)',
  },
  {
    key: 'map',
    label: 'Mapa & POI',
    desc: 'Puntos de interés del viaje',
    icon: <Map size={28} />,
    grad: 'var(--grad-map)',
  },
]

export default function TripHub() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [messages, setMessages] = useState([])
  const [chatMsg, setChatMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    fetchTrip()
    fetchChat()
    fetchMemberCount()
    const sub = supabase
      .channel(`chat:${tripId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `trip_id=eq.${tripId}` }, (payload) => {
        // Optimistically fetch to get the profile name or just refresh
        fetchChat()
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [tripId])

  async function fetchTrip() {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
    if (data) { setTrip(data); setNewName(data.name) }
    const { data: mem } = await supabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()
    if (mem) setMyRole(mem.role)
    setLoading(false)
  }

  async function fetchMemberCount() {
    const { count } = await supabase
      .from('trip_members')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId)
    setMemberCount(count || 0)
  }

  async function fetchChat() {
    // We fetch messages and profiles separately if join fails, or use a simpler join
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
      .limit(50)
    
    if (error) {
      console.error('Chat error:', error)
      // Fallback to basic select
      const { data: basicData } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
      if (basicData) setMessages(basicData)
    } else {
      setMessages(data || [])
    }
  }

  async function updateStatus(status) {
    await supabase.from('trips').update({ status }).eq('id', tripId)
    setTrip(t => ({ ...t, status }))
    setEditingStatus(false)
  }

  async function updateName() {
    if (!newName.trim()) return
    await supabase.from('trips').update({ name: newName }).eq('id', tripId)
    setTrip(t => ({ ...t, name: newName }))
    setEditingName(false)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!chatMsg.trim()) return
    setSendingMsg(true)
    await supabase.from('chat_messages').insert({
      trip_id: tripId,
      user_id: user.id,
      user_email: user.email,
      message: chatMsg.trim(),
    })
    setChatMsg('')
    setSendingMsg(false)
  }

  const isTitular = myRole === 'titular' || trip?.owner_id === user.id
  const statusInfo = STATUS_OPTIONS.find(s => s.value === trip?.status) || STATUS_OPTIONS[0]

  if (loading) return (
    <div className="page-loading">
      <div className="spinner spinner-lg" />
    </div>
  )

  return (
    <div className="hub-page">
      <Navbar tripName={trip?.name} />

      <div className="container hub-body">
        {/* Back */}
        <button className="btn btn-ghost hub-back" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Mis viajes
        </button>

        {/* Trip header */}
        <div className="hub-header glass fade-in-up">
          <div className="hub-header-left">
            {editingName && isTitular ? (
              <div className="hub-name-edit">
                <input
                  type="text"
                  className="form-input hub-name-input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') updateName() }}
                  autoFocus
                />
                <button className="btn btn-sky btn-sm" onClick={updateName}><Check size={16} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}><X size={16} /></button>
              </div>
            ) : (
              <div className="hub-name-row">
                <h1 className="hub-trip-name">{trip?.name}</h1>
                {isTitular && (
                  <button className="btn btn-ghost btn-icon" onClick={() => setEditingName(true)} title="Editar nombre">
                    <Edit3 size={16} />
                  </button>
                )}
              </div>
            )}

            <div className="hub-trip-meta">
              {trip?.destination && <span className="hub-meta-item"><MapPin size={14} />{trip.destination}</span>}
              {trip?.start_date && (
                <span className="hub-meta-item">
                  <Calendar size={14} />
                  {new Date(trip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  {trip.end_date && ` – ${new Date(trip.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </span>
              )}
              <div className="hub-meta-item-group">
                <span className="hub-meta-item"><Users size={14} />{memberCount} integrantes</span>
                {isTitular && (
                  <button 
                    className="btn btn-ghost btn-icon btn-sm hub-add-member-quick" 
                    onClick={() => navigate(`/trip/${tripId}/members`)}
                    title="Añadir integrantes"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>

            {trip?.description && <p className="hub-trip-desc">{trip.description}</p>}
          </div>

          {/* Status */}
          <div className="hub-status-section">
            <span className="hub-status-label">Estado del viaje</span>
            {editingStatus && isTitular ? (
              <div className="hub-status-options">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    className={`hub-status-option ${trip?.status === s.value ? 'active' : ''}`}
                    onClick={() => updateStatus(s.value)}
                    style={{ '--status-color': s.color }}
                  >
                    {s.label}
                  </button>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingStatus(false)}><X size={14} /></button>
              </div>
            ) : (
              <div
                className="hub-status-display"
                onClick={() => isTitular && setEditingStatus(true)}
                style={{ cursor: isTitular ? 'pointer' : 'default' }}
                title={isTitular ? 'Cambiar estado' : ''}
              >
                <span className="hub-status-pill" style={{ background: `${statusInfo.color}22`, color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
                {isTitular && <Edit3 size={14} style={{ color: 'var(--gray-400)' }} />}
              </div>
            )}
            <span className="hub-role-tag">{isTitular ? 'Titular' : 'Invitado'}</span>
          </div>
        </div>

        {/* Module cards */}
        <div className="hub-modules fade-in-up delay-1">
          {HUB_MODULES.map((mod, i) => (
            <Link
              key={mod.key}
              to={`/trip/${tripId}/${mod.key}`}
              className={`hub-module-card delay-${i + 1}`}
              id={`hub-module-${mod.key}`}
            >
              <div className="hub-module-icon" style={{ background: mod.grad }}>
                {mod.icon}
              </div>
              <div className="hub-module-info">
                <h3 className="hub-module-title">{mod.label}</h3>
                <p className="hub-module-desc">{mod.desc}</p>
              </div>
              <ChevronRight size={20} className="hub-module-arrow" />
            </Link>
          ))}
        </div>

        {/* Chat section */}
        <div className="hub-chat glass fade-in-up delay-3">
          <div className="hub-chat-header">
            <MessageCircle size={20} style={{ color: 'var(--coral)' }} />
            <h2 className="hub-chat-title">Chat del grupo</h2>
          </div>

          <div className="hub-chat-messages" id="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <MessageCircle size={32} />
                <p>Aún no hay mensajes. ¡Di hola!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.user_id === user.id
                const profile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles
                const displayName = profile?.full_name || msg.user_email?.split('@')[0] || 'Viajero'
                const initials = displayName.slice(0, 2).toUpperCase()
                return (
                  <div key={msg.id} className={`chat-message ${isMe ? 'mine' : 'theirs'}`}>
                    {!isMe && <div className="avatar avatar-sm">{initials}</div>}
                    <div className="chat-bubble-wrap">
                      {!isMe && <span className="chat-sender">{displayName}</span>}
                      <div className="chat-bubble">{msg.message}</div>
                      <span className="chat-time">
                        {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form onSubmit={sendMessage} className="hub-chat-form">
            <input
              type="text"
              className="form-input hub-chat-input"
              placeholder="Escribe un mensaje..."
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              id="chat-input"
            />
            <button type="submit" className="btn btn-primary btn-icon" disabled={sendingMsg || !chatMsg.trim()} id="chat-send-btn">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
