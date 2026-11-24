import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { DocsPage } from './pages/DocsPage';

export type AppView = 'landing' | 'docs';

export interface AppProps {
  initialView?: AppView;
}

export default function App({ initialView }: AppProps = {}) {
  const [view, setView] = useState<AppView>(() => {
    if (initialView) return initialView;
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#docs')) {
      return 'docs';
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash.startsWith('#docs')) {
          setView('docs');
        } else {
          setView('landing');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (targetView: AppView) => {
    setView(targetView);
    if (typeof window !== 'undefined') {
      window.location.hash = targetView === 'docs' ? '#docs' : '';
    }
  };

  return view === 'docs' ? (
    <DocsPage
      onNavigateLanding={() => handleNavigate('landing')}
      onNavigateDocs={() => handleNavigate('docs')}
    />
  ) : (
    <LandingPage
      onNavigateDocs={() => handleNavigate('docs')}
    />
  );
}
