import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Calendar, MapPin, ThumbsUp, ThumbsDown, Clock, Edit3
} from 'lucide-react'
import './ModulePage.css'

export default function Itinerary() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [days, setDays] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ day_date: '', time: '', title: '', location: '', description: '', type: 'activity', source: 'manual' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    setLoading(true)
    const { data: acts } = await supabase
      .from('itinerary_activities')
      .select('*, activity_votes(*)')
      .eq('trip_id', tripId)
      .order('time')

    if (acts) {
      const grouped = acts.reduce((acc, act) => {
        const date = act.day_date || 'Sin fecha'
        if (!acc[date]) acc[date] = []
        acc[date].push(act)
        return acc
      }, {})
      setDays(Object.entries(grouped).sort())
    }
    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)
    setLoading(false)
  }

  async function saveActivity(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('itinerary_activities').insert({ ...form, trip_id: tripId, user_id: user.id })
    if (error) alert(error.message)
    setShowModal(false)
    setForm({ day_date: '', time: '', title: '', location: '', description: '', type: 'activity', source: 'manual' })
    fetchData()
    setSaving(false)
  }

  async function deleteActivity(id) {
    if (!confirm('¿Eliminar actividad?')) return
    await supabase.from('itinerary_activities').delete().eq('id', id)
    fetchData()
  }

  async function vote(activityId, voteType) {
    await supabase.from('activity_votes').upsert({ 
      activity_id: activityId, 
      user_id: user.id, 
      vote: voteType 
    }, { onConflict: 'activity_id, user_id' })
    fetchData()
  }

  const isTitular = myRole === 'titular'

  return (
    <div className="module-page">
      <Navbar />
      <div className="container module-body">
        <header className="module-header fade-in-up">
          <div className="module-title-group">
            <div className="module-icon-box"><Calendar size={28} /></div>
            <div>
              <h1 className="module-title">Itinerario</h1>
              <p className="module-subtitle">Planes y propuestas</p>
            </div>
          </div>
          <button className="btn-add-vibrant" onClick={() => setShowModal(true)}>
            <Plus size={22} /> Añadir
          </button>
        </header>

        {loading ? <div className="page-loading"><div className="spinner" /></div> : (
          <div className="itinerary-list" style={{ marginTop: '3rem' }}>
            {days.length === 0 ? (
              <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
                 <Calendar size={48} style={{ marginBottom: '1.5rem', color: 'var(--btn-add)' }} />
                 <p style={{ fontSize: '1.2rem' }}>Aún no hay propuestas.</p>
              </div>
            ) : days.map(([date, acts]) => (
              <section key={date} className="itinerary-day-section fade-in-up">
                <h2 className="itinerary-day-title">
                  {date === 'Sin fecha' ? date : new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                </h2>
                <div className="items-list">
                  {acts.map(act => {
                    const myVote = act.activity_votes?.find(v => v.user_id === user.id)?.vote
                    const upVotes = act.activity_votes?.filter(v => v.vote === 'up').length || 0
                    const downVotes = act.activity_votes?.filter(v => v.vote === 'down').length || 0

                    return (
                      <div key={act.id} className="activity-card glass-card">
                        <div className="activity-top">
                          <div className="activity-time-badge">
                            <Clock size={16} /> {act.time ? act.time.slice(0, 5) : 'Pendiente'}
                          </div>
                          {act.location && (
                            <div className="expense-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <MapPin size={14} /> {act.location}
                            </div>
                          )}
                        </div>

                        <h3 className="activity-title">{act.title}</h3>
                        
                        {act.description && (
                          <p className="expense-subtitle" style={{ marginTop: '-0.5rem', opacity: 0.7 }}>
                            {act.description}
                          </p>
                        )}

                        <div className="activity-bottom">
                          <div className="vote-btns">
                            <button 
                              className={`vote-btn vote-btn-up ${myVote === 'up' ? 'voted' : ''}`} 
                              onClick={() => vote(act.id, 'up')}
                            >
                              <ThumbsUp size={18} /> <span className="vote-count">{upVotes}</span>
                            </button>
                            <button 
                              className={`vote-btn vote-btn-down ${myVote === 'down' ? 'voted' : ''}`} 
                              onClick={() => vote(act.id, 'down')}
                            >
                              <ThumbsDown size={18} /> <span className="vote-count">{downVotes}</span>
                            </button>
                          </div>
                          
                          {isTitular && (
                            <button className="btn-delete-vibrant" onClick={() => deleteActivity(act.id)}>
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Añadir Propuesta" onClose={() => setShowModal(false)}>
          <form onSubmit={saveActivity} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">¿Qué plan propones?</label>
              <div className="form-input-container">
                <Edit3 className="form-input-icon" size={20} />
                <input type="text" className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Cena en la playa..." />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <div className="form-input-container">
                  <Calendar className="form-input-icon" size={20} />
                  <input type="date" className="form-input" value={form.day_date} onChange={e => setForm(f => ({ ...f, day_date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Hora (opcional)</label>
                <div className="form-input-container">
                  <Clock className="form-input-icon" size={20} />
                  <input type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lugar / Ubicación</label>
              <div className="form-input-container">
                <MapPin className="form-input-icon" size={20} />
                <input type="text" className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Nombre del sitio..." />
              </div>
            </div>

            <button type="submit" className="btn-add-vibrant" disabled={saving} style={{ width: '100%', marginTop: '1rem', height: '60px', fontSize: '1.1rem', justifyContent: 'center' }}>
              Añadir Propuesta
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
