import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Bloquear el cambio accidental de números con la rueda del ratón en todos los inputs numéricos del sistema
document.addEventListener('wheel', (e) => {
  if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
    e.target.blur();
  } else if (
    document.activeElement instanceof HTMLInputElement &&
    document.activeElement.type === 'number'
  ) {
    document.activeElement.blur();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
