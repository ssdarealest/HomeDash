import React from 'react';
import { Navbar } from '../components/Navbar';
import { DocumentationPortal } from '../components/DocumentationPortal';
import { Footer } from '../components/Footer';

export interface DocsPageProps {
  onNavigateLanding?: () => void;
  onNavigateDocs?: () => void;
  initialTopicId?: string;
}

export const DocsPage: React.FC<DocsPageProps> = ({
  onNavigateLanding,
  onNavigateDocs,
  initialTopicId,
}) => {
  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 selection:bg-brand-blue selection:text-[#08090C] flex flex-col">
      <Navbar
        onNavigateLanding={onNavigateLanding}
        onNavigateDocs={onNavigateDocs}
        isDocsView
      />
      <main className="flex-1">
        <DocumentationPortal
          onNavigateLanding={onNavigateLanding}
          initialTopicId={initialTopicId}
        />
      </main>
      <Footer
        onNavigateLanding={onNavigateLanding}
        onNavigateDocs={onNavigateDocs}
      />
    </div>
  );
};
