
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 브라우저 환경에서 Gemini SDK가 process.env.API_KEY를 참조할 때 
// ReferenceError: process is not defined 가 발생하여 화면이 검게 변하는 것을 방지합니다.
if (typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {
      API_KEY: '' // Vercel Dashboard의 Environment Variables에서 주입된 값은 빌드 시점에 처리됩니다.
    }
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
