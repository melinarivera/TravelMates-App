<div align="center">
  <img src="https://melinarivera.github.io/TravelMates-App/logo.svg" alt="TravelMates Logo" width="120" />
  <h1>✈️ TravelMates</h1>
  <p><strong>La plataforma inteligente para planificar viajes en grupo sin complicaciones.</strong></p>

  <p>
    <a href="https://melinarivera.github.io/TravelMates-App/"><strong>🌍 Ver Aplicación en Vivo</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
  </p>
</div>

---

## ✨ Características Principales

- 📅 **Itinerarios Colaborativos:** Planifica día a día las actividades de tu viaje en tiempo real con todo tu grupo.
- 💸 **Control de Gastos:** Lleva un registro claro de quién pagó qué y cuánto debe cada persona. Presupuesto compartido sin estrés.
- 📍 **Puntos de Interés:** Descubre, guarda y comparte en un mapa interactivo los lugares que no pueden dejar de visitar.
- 💬 **Chat Grupal Integrado:** Mantén la comunicación centralizada por cada viaje para no perder ningún detalle.
- 🎨 **Diseño Moderno e Intuitivo:** Una interfaz limpia, amigable y lista para usar en cualquier dispositivo.

## 🚀 Tecnologías

El ecosistema de **TravelMates** está construido sobre tecnologías modernas para garantizar velocidad y escalabilidad:

*   **Frontend:** React (Hooks, Context API), React Router DOM, Lucide Icons.
*   **Herramienta de Construcción:** Vite (Ultra rápido, soporte HMR).
*   **Backend y Base de Datos:** Supabase (Autenticación, PostgreSQL en tiempo real, Storage).
*   **Despliegue:** GitHub Pages (Configuración automatizada con `gh-pages`).

## 🛠️ Instalación y Uso Local

Sigue estos pasos para correr el proyecto en tu entorno local:

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/melinarivera/TravelMates-App.git
   cd TravelMates-App
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env` en la raíz del proyecto tomando como base `.env.example` y agrega tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
   ```

4. **Ejecutar en modo de desarrollo**
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en `http://localhost:5173/`.*

## 📦 Despliegue (Deploy)

El proyecto está configurado para ser desplegado fácilmente en **GitHub Pages**. Para publicar una nueva versión, solo necesitas ejecutar:

```bash
npm run deploy
```

Este comando construirá la versión de producción (`dist/`) y la subirá automáticamente a la rama `gh-pages`.

---

<div align="center">
  <p>Diseñado y desarrollado con ❤️ para hacer los viajes más increíbles.</p>
</div>
