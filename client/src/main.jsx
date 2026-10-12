import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ToastProvider from './components/common/ToastProvider.jsx';

import './css/variables.css';
import './css/global.css';
import './css/Responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <App />
        <ToastProvider />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);