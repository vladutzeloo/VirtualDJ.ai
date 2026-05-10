import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AppFeedbackProvider} from './hooks/useAppFeedback';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppFeedbackProvider>
      <App />
    </AppFeedbackProvider>
  </StrictMode>,
);
