import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Remove qualquer vestígio de modo escuro no carregamento inicial
document.documentElement.classList.remove('dark');
document.documentElement.style.colorScheme = 'light';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)