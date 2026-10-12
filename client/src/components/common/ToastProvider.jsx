import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { background: '#0b1b3a', color: '#fff', borderRadius: '12px', fontSize: '14px', padding: '12px 16px' },
        success: { iconTheme: { primary: '#2dd4bf', secondary: '#0b1b3a' } },
        error: { iconTheme: { primary: '#ff7b7f', secondary: '#0b1b3a' }, duration: 5500 },
      }}
    />
  );
}
