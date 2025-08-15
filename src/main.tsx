import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handler global simples para 401/403: limpa token e envia para home
const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await originalFetch(...args as [RequestInfo, RequestInit?]);
  if (response.status === 401 || response.status === 403) {
    try { localStorage.removeItem('authToken'); } catch {}
    try { window.history.replaceState({}, '', '/'); } catch {}
    try { window.location.assign('/'); } catch {}
  }
  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
