import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import {
  Users, DollarSign, Calendar, Map, MessageCircle,
  ArrowLeft, Edit3, Check, X,
  ChevronRight, MapPin, Camera, Plane, ExternalLink, Link as LinkIcon
} from 'lucide-react'
import './TripHub.css'

const STATUS_OPTIONS = [
  { value: 'planning', label: 'PLANIFICANDO', color: '#00d4ff' },
  { value: 'active',   label: 'EN CURSO',     color: '#39ff14' },
  { value: 'done',     label: 'FINALIZADO',   color: '#fff' },
]

const HUB_MODULES = [
  { key: 'members', label: 'Integrantes', desc: 'Quién viaja contigo', icon: <Users size={32} />, grad: 'var(--grad-main)' },
  { key: 'expenses', label: 'Gastos', desc: 'Cuentas y balances', icon: <DollarSign size={32} />, grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { key: 'itinerary', label: 'Itinerario', desc: 'Plan del viaje', icon: <Calendar size={32} />, grad: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  { key: 'map', label: 'Mapa & POI', desc: 'Lugares guardados', icon: <Map size={32} />, grad: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
]

export default function TripHub() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingLink, setEditingLink] = useState(false)
  const [newLink, setNewLink] = useState('')
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    if (!tripId) return
    fetchTrip()
    fetchMemberCount()
  }, [tripId])

  async function fetchTrip() {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
    if (data) { 
      setTrip(data)
      setNewName(data.name)
      setNewLink(data.description || '')
    }
    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)
    setLoading(false)
  }

  async function fetchMemberCount() {
    const { count } = await supabase.from('trip_members').select('*', { count: 'exact', head: true }).eq('trip_id', tripId).eq('status', 'accepted')
    setMemberCount(count || 0)
  }

  async function updateName() {
    if (!newName.trim()) return
    const { error } = await supabase.from('trips').update({ name: newName }).eq('id', tripId)
    if (!error) {
      setTrip(t => ({ ...t, name: newName }))
      setEditingName(false)
    }
  }

  async function updateGroupLink() {
    const { error } = await supabase.from('trips').update({ description: newLink }).eq('id', tripId)
    if (!error) {
      setTrip(t => ({ ...t, description: newLink }))
      setEditingLink(false)
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

  const isTitular = myRole === 'titular' || trip?.owner_id === user.id
  const statusInfo = STATUS_OPTIONS.find(s => s.value === trip?.status) || STATUS_OPTIONS[0]

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="hub-page">
      <Navbar />

      <header className="hub-hero-header" style={{ 
        backgroundImage: trip?.cover_url ? `linear-gradient(to bottom, rgba(5,7,10,0.5), rgba(5,7,10,1)), url(${trip.cover_url})` : 'none',
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" style={{ fontSize: '2.5rem', fontWeight: 800 }} value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                  <button className="btn-edit-neon" onClick={updateName}><Check size={20} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <h1 className="hub-trip-name text-gradient">{trip?.name}</h1>
                  {isTitular && <button className="btn-edit-neon" onClick={() => setEditingName(true)}><Edit3 size={20} /></button>}
                </div>
              )}
              
              <div className="hub-meta-row" style={{ marginTop: '1.5rem' }}>
                <div className="hub-meta-item"><MapPin size={22} color="var(--primary)" /> {trip?.destination}</div>
                <div className="hub-meta-item"><Users size={22} color="var(--sun)" /> {memberCount} viajeros</div>
                <span className="trip-card-status-badge" style={{ color: statusInfo.color, borderColor: statusInfo.color }}>{statusInfo.label}</span>
              </div>
            </div>

            {isTitular && (
              <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById('cover-file').click()}>
                <Camera size={16} /> Cambiar portada
              </button>
            )}
            <input type="file" id="cover-file" hidden accept="image/*" onChange={handleCoverUpload} />
          </div>
        </div>
      </header>

      <div className="container hub-body">
        {/* MODULOS PRINCIPALES */}
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

        {/* CANAL DE COMUNICACIÓN (Reemplaza al Chat) */}
        <div className="glass-card fade-in-up delay-1" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="hero-icon-glow" style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px' }}>
             <MessageCircle size={32} color="white" />
          </div>
          <h2 className="hub-module-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Canal del Grupo</h2>
          
          {editingLink && isTitular ? (
            <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
               <input 
                 type="url" 
                 className="form-input" 
                 placeholder="Enlace de WhatsApp o Telegram" 
                 value={newLink} 
                 onChange={e => setNewLink(e.target.value)} 
               />
               <button className="btn-edit-neon" onClick={updateGroupLink}><Check size={20} /></button>
               <button className="btn-delete-vibrant" onClick={() => setEditingLink(false)}><X size={20} /></button>
            </div>
          ) : (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <p className="hub-module-desc" style={{ fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                Únete al grupo externo para coordinar detalles rápidos con el resto de viajeros.
              </p>
              
              {trip?.description ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <a href={trip.description} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
                    <ExternalLink size={20} /> Unirse al Grupo
                  </a>
                  {isTitular && (
                    <button className="btn btn-secondary" onClick={() => setEditingLink(true)}>
                      <LinkIcon size={18} /> Cambiar enlace
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                   <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                     {isTitular 
                       ? 'Aún no has configurado un enlace para el grupo.' 
                       : 'El titular aún no ha configurado el enlace del grupo.'}
                   </p>
                   {isTitular && (
                     <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setEditingLink(true)}>
                       Configurar Enlace
                     </button>
                   )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
