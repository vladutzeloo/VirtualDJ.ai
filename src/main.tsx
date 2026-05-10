import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AppFeedbackProvider} from './hooks/useAppFeedback';
import {ErrorBoundary} from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppFeedbackProvider>
        <App />
      </AppFeedbackProvider>
    </ErrorBoundary>
  </StrictMode>,
);
