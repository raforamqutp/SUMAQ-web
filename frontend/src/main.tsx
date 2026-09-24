import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Limpieza de datos obsoletos en storage
try {
  localStorage.removeItem('sumaq_mock_citas');
  localStorage.removeItem('sumaq_mock_productos');
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

