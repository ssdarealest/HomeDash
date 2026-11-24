export interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
  description?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface DocSubsection {
  id: string;
  title: string;
  content: string;
  snippets?: CodeSnippet[];
  table?: TableData;
}

export interface DocSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocSubsection[];
  snippets?: CodeSnippet[];
  table?: TableData;
}

export interface DocArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
  iconName?: string;
  sections: DocSection[];
}
