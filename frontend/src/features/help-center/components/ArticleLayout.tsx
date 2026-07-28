import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  getHelpCategory,
  HELP_ARTICLES,
} from '../content/articleRegistry';
import type { HelpArticleMetadata } from '../types';
import { formatReviewedDate } from '../utils/policyFormatting';

interface ArticleLayoutProps {
  article: HelpArticleMetadata;
  children: ReactNode;
}

export const ArticleLayout = ({ article, children }: ArticleLayoutProps) => {
  const category = getHelpCategory(article.category);
  const relatedArticles = article.relatedPaths
    .map((path) => HELP_ARTICLES.find((item) => item.path === path))
    .filter((item): item is HelpArticleMetadata => Boolean(item?.discoverable));

  return (
    <>
      <Helmet title={`${article.title} | ManabiHub`}>
        <meta content={article.summary} name="description" />
        {article.status === 'draft' && <meta content="noindex, nofollow" name="robots" />}
      </Helmet>

      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                to="/help"
                className="font-medium hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Trung tâm trợ giúp
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </li>
            <li>
              <Link
                to={`/help?category=${article.category}`}
                className="font-medium hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {category.label}
              </Link>
            </li>
          </ol>
        </nav>

        <header className="border-b border-gray-200 pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              {article.status === 'draft' ? 'Bản dự thảo chưa có hiệu lực' : 'Nội dung tạm thời'}
            </span>
            <span className="text-xs text-gray-500">Phiên bản {article.policyVersion}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-950 sm:text-4xl">{article.title}</h1>
          <p className="mt-4 text-base leading-7 text-gray-600">{article.summary}</p>
          <p className="mt-4 text-sm text-gray-500">
            Rà soát lần cuối: {formatReviewedDate(article.lastReviewedAt)}
          </p>
        </header>

        <div className="prose prose-slate mt-8 max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-700">
          {children}
        </div>

        {relatedArticles.length > 0 && (
          <aside className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="related-help">
            <h2 className="text-lg font-bold text-gray-950" id="related-help">
              Bài viết liên quan
            </h2>
            <ul className="mt-4 divide-y divide-gray-200 border-y border-gray-200">
              {relatedArticles.map((related) => (
                <li key={related.path}>
                  <Link
                    to={related.path}
                    className="flex items-center justify-between gap-4 py-4 font-medium text-gray-800 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <span>{related.title}</span>
                    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </article>
    </>
  );
};
