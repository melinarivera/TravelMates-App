import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import {
  Users, DollarSign, Calendar, Map, MessageCircle,
  Settings, ArrowLeft, Edit3, Check, X, Send,
  ChevronRight, Clock, MapPin, Plus, Camera, Image as ImageIcon
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import './TripHub.css'

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planificando', color: 'var(--sun)' },
  { value: 'active',   label: 'En curso',     color: 'var(--primary)' },
  { value: 'done',     label: 'Finalizado',   color: 'var(--slate)' },
]

const HUB_MODULES = [
  { key: 'members', label: 'Integrantes', desc: 'Gestiona quién viaja contigo', icon: <Users size={28} />, grad: 'var(--grad-members)' },
  { key: 'expenses', label: 'Gastos', desc: 'Divide y controla el presupuesto', icon: <DollarSign size={28} />, grad: 'var(--grad-expenses)' },
  { key: 'itinerary', label: 'Itinerario', desc: 'Planifica día a día', icon: <Calendar size={28} />, grad: 'var(--grad-itinerary)' },
  { key: 'map', label: 'Mapa & POI', desc: 'Puntos de interés del viaje', icon: <Map size={28} />, grad: 'var(--grad-map)' },
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
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [coverPreview, setCoverPreview] = useState(null)

  useEffect(() => {
    fetchTrip()
    fetchChat()
    fetchMemberCount()

    // Realtime chat subscription
    const channel = supabase
      .channel(`chat_${tripId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `trip_id=eq.${tripId}` }, 
        () => { fetchChat() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function fetchTrip() {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
    if (data) { 
      setTrip(data)
      setNewName(data.name)
      setCoverPreview(data.cover_url)
    }
    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)
    setLoading(false)
  }

  async function fetchMemberCount() {
    const { count } = await supabase.from('trip_members').select('*', { count: 'exact', head: true }).eq('trip_id', tripId)
    setMemberCount(count || 0)
  }

  async function fetchChat() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, profiles:user_id (full_name)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
      .limit(50)
    
    if (error) console.error('Chat error:', error)
    if (data) setMessages(data)
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

  const handleCoverUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        setCoverPreview(reader.result)
        const { error } = await supabase.from('trips').update({ cover_url: reader.result }).eq('id', tripId)
        if (!error) setTrip(t => ({ ...t, cover_url: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!chatMsg.trim()) return
    setSendingMsg(true)
    const { error } = await supabase.from('chat_messages').insert({
      trip_id: tripId,
      user_id: user.id,
      user_email: user.email,
      message: chatMsg.trim(),
    })
    if (error) console.error('Send error:', error)
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

      <div className="hub-hero-header" style={{ 
        backgroundImage: trip?.cover_url ? `linear-gradient(to bottom, rgba(8,10,15,0.4), rgba(8,10,15,1)), url(${trip.cover_url})` : 'var(--grad-hero)'
      }}>
        <div className="container">
          <div className="hub-hero-inner fade-in-up">
            <button className="btn btn-secondary btn-sm hub-back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={18} /> Mis viajes
            </button>
            
            <div className="hub-title-section">
              {editingName && isTitular ? (
                <div className="hub-name-edit">
                  <input type="text" className="form-input hub-name-input" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') updateName() }} autoFocus />
                  <button className="btn btn-primary btn-icon btn-sm" onClick={updateName}><Check size={16} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingName(false)}><X size={16} /></button>
                </div>
              ) : (
                <div className="hub-name-row">
                  <h1 className="hub-trip-name text-gradient">{trip?.name}</h1>
                  {isTitular && (
                    <button className="btn btn-ghost btn-icon" onClick={() => setEditingName(true)}>
                      <Edit3 size={20} />
                    </button>
                  )}
                </div>
              )}
              
              <div className="hub-meta-row">
                <div className="hub-meta-item">
                   <MapPin size={18} color="var(--primary)" />
                   <span>{trip?.destination || 'Destino pendiente'}</span>
                </div>
                <div className="divider-v" />
                <div className="hub-meta-item">
                   <Users size={18} color="var(--accent)" />
                   <span>{memberCount} integrantes</span>
                </div>
                <div className="divider-v" />
                <div className="hub-status-inline">
                  {editingStatus && isTitular ? (
                    <div className="hub-status-options-mini">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s.value} className={`mini-status-pill ${trip?.status === s.value ? 'active' : ''}`} onClick={() => updateStatus(s.value)} style={{ '--status-color': s.color }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="hub-status-display" onClick={() => isTitular && setEditingStatus(true)}>
                      <span className="badge" style={{ background: `${statusInfo.color}22`, color: statusInfo.color, borderColor: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isTitular && (
              <div className="hub-actions-top">
                <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById('hub-cover-input').click()}>
                  <Camera size={16} /> Personalizar portada
                </button>
                <input type="file" id="hub-cover-input" hidden accept="image/*" onChange={handleCoverUpload} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container hub-body">
        <div className="hub-modules fade-in-up delay-1">
          {HUB_MODULES.map((mod, i) => (
            <Link key={mod.key} to={`/trip/${tripId}/${mod.key}`} className={`hub-module-card glass-card delay-${i + 1}`}>
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

        <div className="hub-chat glass-card fade-in-up delay-3">
          <div className="hub-chat-header">
            <MessageCircle size={22} color="var(--primary)" />
            <h2 className="hub-chat-title">Chat de grupo</h2>
          </div>

          <div className="hub-chat-messages" id="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <MessageCircle size={48} color="var(--text-muted)" opacity="0.3" />
                <p>Comienza la conversación...</p>
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
            <input type="text" className="form-input" placeholder="Escribe un mensaje..." value={chatMsg} onChange={e => setChatMsg(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-icon" disabled={sendingMsg || !chatMsg.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
