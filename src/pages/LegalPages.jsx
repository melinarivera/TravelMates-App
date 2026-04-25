import { ArrowLeft, Shield, FileText, Scale } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './ModulePage.css' // Usamos los estilos globales de módulos/cards

const LEGAL_CONTENT = {
  privacidad: {
    title: 'Política de Privacidad',
    icon: <Shield size={32} color="#39ff14" />, // Verde Neón
    content: (
      <>
        <p><strong>Última actualización:</strong> {new Date().toLocaleDateString()}</p>
        <p>En TravelMates nos tomamos muy en serio la privacidad de tus datos, cumpliendo estrictamente con el Reglamento General de Protección de Datos (RGPD) de la Unión Europea y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD) de España.</p>
        
        <h3>1. Responsable del Tratamiento</h3>
        <p>Melina Rivera es la responsable del tratamiento de los datos personales recogidos a través de esta aplicación.</p>

        <h3>2. Datos Recopilados</h3>
        <p>Recopilamos la información estrictamente necesaria para el funcionamiento de la app: nombre, correo electrónico, y datos de los viajes planificados.</p>

        <h3>3. Finalidad</h3>
        <p>Los datos se utilizan exclusivamente para gestionar tu cuenta, coordinar viajes con tus amigos y asegurar el correcto funcionamiento de la plataforma.</p>

        <h3>4. Derechos del Usuario</h3>
        <p>Tienes derecho a acceder, rectificar, cancelar y oponerte al tratamiento de tus datos (derechos ARCO), así como el derecho a la portabilidad y el olvido. Puedes ejercerlos contactándonos a través de los canales oficiales.</p>
      </>
    )
  },
  terminos: {
    title: 'Términos y Condiciones',
    icon: <FileText size={32} color="#00d4ff" />, // Cian Neón
    content: (
      <>
        <p><strong>Última actualización:</strong> {new Date().toLocaleDateString()}</p>
        <p>Al utilizar TravelMates, aceptas estos términos en su totalidad. Esta aplicación está diseñada para facilitar la planificación de viajes grupales.</p>

        <h3>1. Uso de la Aplicación</h3>
        <p>El usuario se compromete a hacer un uso lícito y adecuado de la plataforma, absteniéndose de publicar contenido ofensivo o de utilizarla para fines ilícitos.</p>

        <h3>2. Cuentas y Responsabilidad</h3>
        <p>TravelMates proporciona herramientas para el cálculo de gastos grupales, pero no realiza transacciones financieras reales ni retiene fondos. Las deudas y pagos se gestionan externamente entre los usuarios bajo su propia responsabilidad.</p>

        <h3>3. Propiedad Intelectual</h3>
        <p>El diseño, código y contenido de TravelMates (salvo el contenido generado por los usuarios) es propiedad exclusiva de Melina Rivera.</p>
      </>
    )
  },
  aviso: {
    title: 'Aviso Legal',
    icon: <Scale size={32} color="#bc13fe" />, // Morado Neón
    content: (
      <>
        <p><strong>Información General (LSSI-CE)</strong></p>
        <p>En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico de España, se informa de que este sitio web/aplicación (TravelMates) es propiedad de Melina Rivera.</p>

        <h3>1. Condiciones de Uso</h3>
        <p>El acceso a la aplicación es gratuito. Melina Rivera no se hace responsable de los daños derivados del mal uso de la plataforma por parte de los usuarios.</p>

        <h3>2. Modificaciones</h3>
        <p>Nos reservamos el derecho de modificar el diseño, configuración o términos de la plataforma en cualquier momento sin previo aviso.</p>
      </>
    )
  }
}

export default function LegalPages({ type }) {
  const navigate = useNavigate()
  const pageData = LEGAL_CONTENT[type]

  if (!pageData) return null

  return (
    <div className="module-page" style={{ minHeight: '100dvh', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <button 
          className="btn-add-vibrant" 
          style={{ marginBottom: '2rem', width: 'fit-content', background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} /> Volver al Inicio
        </button>

        <div className="glass-card fade-in-up" style={{ padding: '3rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div className="module-icon-box" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {pageData.icon}
            </div>
            <h1 style={{ fontSize: '2rem', color: 'white', margin: 0 }}>{pageData.title}</h1>
          </div>

          <div className="legal-content" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8' }}>
            {pageData.content}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.5, fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} Melina Rivera. TravelMates.
        </div>

      </div>

      <style>{`
        .legal-content h3 {
          color: white;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          font-size: 1.2rem;
          border-left: 3px solid var(--primary);
          padding-left: 0.8rem;
        }
        .legal-content p {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  )
}
