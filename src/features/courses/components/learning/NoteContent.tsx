import ReactMarkdown from 'react-markdown';
import { NoteContent as NoteContentType } from '../../types';

interface NoteContentProps {
  note: NoteContentType;
}

export function NoteContent({ note }: NoteContentProps) {
  return (
    <article className="prose prose-lg max-w-none 
      prose-headings:text-gray-900 prose-headings:font-bold
      prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:border-b prose-h1:pb-4
      prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8
      prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6
      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
      prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-gray-900 prose-strong:font-semibold
      prose-em:text-gray-800
      prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-purple-700 prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
      prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
      prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
      prose-li:text-gray-700 prose-li:mb-2
      prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:bg-purple-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-700
      prose-hr:my-8 prose-hr:border-gray-200
      prose-table:border-collapse prose-table:w-full
      prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left
      prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
      prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
    ">
      <ReactMarkdown
        components={{
          // Custom heading with anchor
          h1: ({ children }) => (
            <h1 className="scroll-mt-20">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="scroll-mt-20">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="scroll-mt-20">{children}</h3>
          ),
          // Enhanced code blocks
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-purple-700" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Enhanced blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-400 bg-purple-50 py-3 px-4 my-4 rounded-r-lg">
              {children}
            </blockquote>
          ),
          // Enhanced links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {note.body}
      </ReactMarkdown>
    </article>
  );
}
