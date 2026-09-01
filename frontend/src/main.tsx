import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * ============================================================================
 * PUNTO DE ENTRADA PRINCIPAL (React DOM Root)
 * ============================================================================
 * Monta la aplicación de React dentro del contenedor <div id="root"> en index.html.
 * - StrictMode: Activa verificaciones estrictas de React en desarrollo.
 * - index.css: Carga la configuración base de Tailwind CSS y fuentes.
 * - App: Componente raíz que aloja los proveedores de contexto y el enrutador.
 * ============================================================================
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

