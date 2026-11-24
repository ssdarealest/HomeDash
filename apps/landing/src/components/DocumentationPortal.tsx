import React, { useState } from 'react';
import {
  Terminal,
  Server,
  Shield,
  Code,
  Search,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  allDocumentationArticles,
  quickstartDoc,
  type DocArticle,
  type DocSection,
  type CodeSnippet,
} from '../docs';

export interface DocumentationPortalProps {
  initialTopicId?: string;
  onNavigateLanding?: () => void;
}

const TOPIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Terminal,
  Server,
  Shield,
  Code,
  FileText,
  BookOpen,
};

export const DocumentationPortal: React.FC<DocumentationPortalProps> = ({
  initialTopicId = 'quickstart',
  onNavigateLanding,
}) => {
  const [activeTopicId, setActiveTopicId] = useState<string>(initialTopicId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Filter topics based on search keyword
  const filteredArticles = allDocumentationArticles.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const inTitle = doc.title.toLowerCase().includes(query);
    const inDesc = doc.description.toLowerCase().includes(query);
    const inCategory = doc.category.toLowerCase().includes(query);
    return inTitle || inDesc || inCategory;
  });

  // Current active article
  const currentDocIndex = allDocumentationArticles.findIndex((d) => d.id === activeTopicId);
  const activeArticle: DocArticle =
    allDocumentationArticles[currentDocIndex] || quickstartDoc;

  const previousDoc: DocArticle | null =
    currentDocIndex > 0 ? allDocumentationArticles[currentDocIndex - 1] : null;
  const nextDoc: DocArticle | null =
    currentDocIndex < allDocumentationArticles.length - 1
      ? allDocumentationArticles[currentDocIndex + 1]
      : null;

  const handleCopyCode = async (snippetId: string, code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        setCopiedSnippetId(snippetId);
        setTimeout(() => {
          setCopiedSnippetId(null);
        }, 2000);
      }
    } catch {
      // Fallback silently
    }
  };

  const getTopicIcon = (iconName?: string) => {
    if (iconName && TOPIC_ICONS[iconName]) {
      const IconComponent = TOPIC_ICONS[iconName];
      return <IconComponent className="w-4 h-4 shrink-0" />;
    }
    return <FileText className="w-4 h-4 shrink-0" />;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumbs"
        className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-8"
      >
        <button
          type="button"
          onClick={onNavigateLanding}
          className="hover:text-brand-blue transition-colors focus:outline-none focus:underline"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
        <span className="text-slate-300">Docs</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
        <span className="text-brand-blue font-semibold">{activeArticle.title}</span>
      </nav>

      {/* Main Grid: Sidebar & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Sidebar Navigation */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              aria-label="Search documentation"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#0D1117] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors font-mono"
            />
          </div>

          {/* Topics List Navigation */}
          <nav aria-label="Documentation Topics" className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Documentation Topics
            </div>
            {filteredArticles.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#0D1117]/50 border border-slate-800/80 text-center text-xs text-slate-500">
                No documentation topics found
              </div>
            ) : (
              filteredArticles.map((doc) => {
                const isActive = doc.id === activeArticle.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActiveTopicId(doc.id)}
                    aria-label={doc.title}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#0D1117] border border-brand-blue/40 text-brand-blue shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#0D1117]/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={
                          isActive
                            ? 'text-brand-blue'
                            : 'text-slate-500 group-hover:text-slate-300'
                        }
                      >
                        {getTopicIcon(doc.iconName)}
                      </span>
                      <span className="truncate">{doc.title}</span>
                    </div>
                    {doc.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-2 ${
                          isActive
                            ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/30'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/40'
                        }`}
                      >
                        {doc.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </nav>

          {/* Local Webapp Link Card */}
          <div className="p-4 rounded-xl bg-[#0D1117] border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-200">Local Daemon & Webapp</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Launch the running instance at port 5173 to test FIDO2 passkeys and encrypted sync.
            </p>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-blue hover:text-brand-blue/80 font-mono text-[11px] transition-colors pt-1"
            >
              <span>Open Local Webapp</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </aside>

        {/* Article Content Viewer */}
        <article className="lg:col-span-9 space-y-10 min-w-0">
          {/* Article Header (semantic div to prevent nested banner landmark) */}
          <div className="pb-8 border-b border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                {activeArticle.category}
              </span>
              {activeArticle.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-brand-green/10 text-brand-green border border-brand-green/20">
                  {activeArticle.badge}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
              {activeArticle.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
              {activeArticle.description}
            </p>
          </div>

          {/* Article Sections */}
          <div className="space-y-12">
            {activeArticle.sections.map((section: DocSection) => (
              <section key={section.id} id={section.id} className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-brand-blue shrink-0" />
                  <span>{section.title}</span>
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">{section.content}</p>

                {/* Optional Table */}
                {section.table && (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0D1117] my-4 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-[#08090C]/60 text-slate-400 font-mono uppercase tracking-wider">
                          {section.table.headers.map((header, idx) => (
                            <th key={idx} className="py-3 px-4 font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {section.table.rows.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="hover:bg-slate-800/20 transition-colors"
                          >
                            {row.map((cell, cellIdx) => (
                              <td
                                key={cellIdx}
                                className={`py-3 px-4 text-slate-300 ${
                                  cellIdx === 0 ? 'font-mono text-brand-blue' : ''
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Optional Code Snippets */}
                {section.snippets &&
                  section.snippets.map((snippet: CodeSnippet, sIdx: number) => {
                    const snippetKey = `${section.id}-snip-${sIdx}`;
                    const isCopied = copiedSnippetId === snippetKey;
                    return (
                      <div
                        key={snippetKey}
                        className="rounded-xl border border-slate-800 bg-[#050608] overflow-hidden my-4 shadow-md"
                      >
                        {/* Snippet Header */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[#0D1117] border-b border-slate-800 text-xs font-mono text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                            <span className="text-slate-300 font-semibold">
                              {snippet.filename || snippet.language}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(snippetKey, snippet.code)}
                            aria-label={isCopied ? 'Code copied' : 'Copy code'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                              isCopied
                                ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                                : 'bg-slate-800/60 text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/60'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Copy code</span>
                              </>
                            )}
                          </button>
                        </div>
                        {/* Snippet Body */}
                        <div className="p-4 overflow-x-auto">
                          {snippet.description && (
                            <div className="text-[11px] font-mono text-slate-500 mb-2">
                              # {snippet.description}
                            </div>
                          )}
                          <pre className="text-xs font-mono text-slate-200 leading-relaxed">
                            <code>{snippet.code}</code>
                          </pre>
                        </div>
                      </div>
                    );
                  })}

                {/* Subsections */}
                {section.subsections && (
                  <div className="space-y-6 pt-2 pl-4 border-l border-slate-800/80 mt-4">
                    {section.subsections.map((sub) => (
                      <div key={sub.id} id={sub.id} className="space-y-2">
                        <h3 className="text-base font-semibold text-slate-200">
                          {sub.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                          {sub.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Sequential Next / Previous Article Navigation */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {previousDoc ? (
                <button
                  type="button"
                  onClick={() => setActiveTopicId(previousDoc.id)}
                  aria-label={`Previous: ${previousDoc.title}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D1117] border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors group"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                  <div className="text-left">
                    <div className="text-[10px] font-mono uppercase text-slate-500">
                      Previous
                    </div>
                    <div>{previousDoc.title}</div>
                  </div>
                </button>
              ) : (
                <div />
              )}
            </div>

            <div>
              {nextDoc ? (
                <button
                  type="button"
                  onClick={() => setActiveTopicId(nextDoc.id)}
                  aria-label={`Next: ${nextDoc.title}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D1117] border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors group text-right"
                >
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-slate-500">
                      Next
                    </div>
                    <div>{nextDoc.title}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
