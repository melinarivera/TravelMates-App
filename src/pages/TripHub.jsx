import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import {
  Users, DollarSign, Calendar, Map, MessageCircle,
  ArrowLeft, Edit3, Check, X, Send,
  ChevronRight, MapPin, Camera, Plane
} from 'lucide-react'
import './TripHub.css'

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planificando', color: 'var(--sun)' },
  { value: 'active',   label: 'En curso',     color: 'var(--primary)' },
  { value: 'done',     label: 'Finalizado',   color: 'var(--text-muted)' },
]

const HUB_MODULES = [
  { key: 'members', label: 'Integrantes', desc: 'Quién viaja contigo', icon: <Users size={32} />, grad: 'var(--grad-main)' },
  { key: 'expenses', label: 'Gastos', desc: 'Presupuesto y balance', icon: <DollarSign size={32} />, grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { key: 'itinerary', label: 'Itinerario', desc: 'Planifica día a día', icon: <Calendar size={32} />, grad: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  { key: 'map', label: 'Mapa & POI', desc: 'Puntos de interés', icon: <Map size={32} />, grad: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
]

export default function TripHub() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const chatEndRef = useRef(null)

  const [trip, setTrip] = useState(null)
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [messages, setMessages] = useState([])
  const [chatMsg, setChatMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    if (!tripId) return
    fetchTrip()
    fetchChat()
    fetchMemberCount()

    console.log('Iniciando suscripción chat para viaje:', tripId)
    const channel = supabase
      .channel(`room_${tripId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `trip_id=eq.${tripId}`
      }, (payload) => {
        console.log('Nuevo mensaje recibido vía Realtime:', payload)
        fetchChat()
      })
      .subscribe((status) => {
        console.log('Estado de la suscripción chat:', status)
      })

    return () => {
      console.log('Limpiando canal de chat')
      supabase.removeChannel(channel)
    }
  }, [tripId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function fetchTrip() {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
    if (data) { 
      setTrip(data)
      setNewName(data.name)
    }
    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)
    setLoading(false)
  }

  async function fetchMemberCount() {
    const { count } = await supabase.from('trip_members').select('*', { count: 'exact', head: true }).eq('trip_id', tripId).eq('status', 'accepted')
    setMemberCount(count || 0)
  }

  async function fetchChat() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, profiles:user_id (full_name, email)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
    
    if (error) console.error('Error al cargar chat:', error)
    if (data) setMessages(data)
  }

  async function updateName() {
    if (!newName.trim()) return
    const { error } = await supabase.from('trips').update({ name: newName }).eq('id', tripId)
    if (!error) {
      setTrip(t => ({ ...t, name: newName }))
      setEditingName(false)
    }
  }

  const handleCoverUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
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

    if (error) {
      console.error('Error al enviar mensaje:', error)
      alert('No se pudo enviar el mensaje.')
    } else {
      setChatMsg('')
      fetchChat() // Refrescar por si el realtime tarda
    }
    setSendingMsg(false)
  }

  const isTitular = myRole === 'titular' || trip?.owner_id === user.id
  const statusInfo = STATUS_OPTIONS.find(s => s.value === trip?.status) || STATUS_OPTIONS[0]

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="hub-page">
      <Navbar />

      <header className="hub-hero-header" style={{ 
        backgroundImage: trip?.cover_url ? `linear-gradient(to bottom, rgba(5,7,10,0.4), rgba(5,7,10,1)), url(${trip.cover_url})` : 'none',
        backgroundColor: '#050710'
      }}>
        {!trip?.cover_url && (
          <div className="hero-placeholder-icon">
             <Plane size={140} color="var(--primary)" opacity="0.1" />
          </div>
        )}
        <div className="container">
          <div className="hub-hero-inner fade-in-up">
            <button className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }} onClick={() => navigate('/')}>
              <ArrowLeft size={18} /> Mis viajes
            </button>
            
            <div className="hub-title-section">
              {editingName && isTitular ? (
                <div className="hub-name-edit" style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" style={{ fontSize: '2rem', fontWeight: 800 }} value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                  <button className="btn btn-primary btn-icon" onClick={updateName}><Check size={20} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h1 className="hub-trip-name text-gradient">{trip?.name}</h1>
                  {isTitular && <button className="btn btn-ghost btn-icon" onClick={() => setEditingName(true)}><Edit3 size={24} /></button>}
                </div>
              )}
              
              <div className="hub-meta-row" style={{ marginTop: '1rem' }}>
                <div className="hub-meta-item"><MapPin size={20} color="var(--primary)" /> {trip?.destination}</div>
                <div className="hub-meta-item"><Users size={20} color="var(--sun)" /> {memberCount} viajeros</div>
                <span className="badge" style={{ color: statusInfo.color, borderColor: statusInfo.color, padding: '0.4rem 0.8rem' }}>{statusInfo.label}</span>
              </div>
            </div>

            {isTitular && (
              <button className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }} onClick={() => document.getElementById('cover-file').click()}>
                <Camera size={16} /> Cambiar portada
              </button>
            )}
            <input type="file" id="cover-file" hidden accept="image/*" onChange={handleCoverUpload} />
          </div>
        </div>
      </header>

      <div className="container hub-body">
        <div className="hub-modules">
          {HUB_MODULES.map(mod => (
            <Link key={mod.key} to={`/trip/${tripId}/${mod.key}`} className="hub-module-card glass-card">
              <div className="hub-module-icon" style={{ background: mod.grad }}>
                {mod.icon}
              </div>
              <div className="hub-module-content">
                <h3 className="hub-module-title">{mod.label}</h3>
                <p className="hub-module-desc">{mod.desc}</p>
              </div>
              <ChevronRight size={24} className="hub-module-arrow" />
            </Link>
          ))}
        </div>

        <div className="hub-chat glass-card fade-in-up delay-1">
          <div className="hub-chat-header">
            <MessageCircle size={24} color="var(--primary)" />
            <h2 className="hub-chat-title">Chat Grupal</h2>
          </div>

          <div className="hub-chat-messages">
            {messages.map(msg => {
              const isMe = msg.user_id === user.id
              const profile = msg.profiles
              const name = profile?.full_name || msg.user_email?.split('@')[0] || 'Viajero'
              const initials = name.slice(0, 2).toUpperCase()
              return (
                <div key={msg.id} className={`chat-message ${isMe ? 'mine' : 'theirs'}`}>
                  {!isMe && <div className="avatar avatar-sm">{initials}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>{name}</span>}
                    <div className="chat-bubble">{msg.message}</div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="hub-chat-form">
            <input type="text" className="form-input" placeholder="Escribe un mensaje..." value={chatMsg} onChange={e => setChatMsg(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-icon" disabled={sendingMsg || !chatMsg.trim()}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
