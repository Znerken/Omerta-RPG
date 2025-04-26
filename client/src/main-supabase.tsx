import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-supabase';
import './index.css';

// Check if Supabase environment variables are available
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase environment variables. Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.'
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);