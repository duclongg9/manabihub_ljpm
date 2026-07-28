import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ArticleLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
  breadcrumbs?: { label: string; to: string }[];
}

export const ArticleLayout = ({ title, lastUpdated, children, breadcrumbs = [] }: ArticleLayoutProps) => {
  return (
    <article className="prose prose-slate max-w-none">
      <nav className="not-prose mb-6 text-sm text-gray-500">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/help" className="hover:text-blue-600 transition-colors">Trung tâm trợ giúp</Link>
          </li>
          {breadcrumbs.map((bc, idx) => (
            <li key={idx} className="flex items-center space-x-2">
              <span>/</span>
              <Link to={bc.to} className="hover:text-blue-600 transition-colors">{bc.label}</Link>
            </li>
          ))}
          <li className="flex items-center space-x-2">
            <span>/</span>
            <span className="text-gray-900">{title}</span>
          </li>
        </ol>
      </nav>
      
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{title}</h1>
      <p className="text-sm text-slate-500 mb-8 border-b pb-4">
        Cập nhật lần cuối: {lastUpdated}
      </p>
      
      <div className="mt-6 space-y-6 text-slate-700">
        {children}
      </div>
    </article>
  );
};
