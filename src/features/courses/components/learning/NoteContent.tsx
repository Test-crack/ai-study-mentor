import ReactMarkdown from 'react-markdown';
import { NoteContent as NoteContentType } from '../../types';
import { Button } from '@/shared/components/ui/button';
import { BookOpen, Target, Zap, Keyboard } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface NoteContentProps {
  note: NoteContentType;
  // NEW: Focus Mode Props
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
}

export function NoteContent({ note, isFocusMode = false, onToggleFocus }: NoteContentProps) {
  return (
    <div className={cn(
      "transition-all duration-700 ease-in-out",
      isFocusMode ? "max-w-4xl mx-auto py-4" : "w-full"
    )}>
      {/* Focus Toolbar - Integrated with Focus Mode visual identity */}
      <div className={cn(
        "flex items-center justify-between mb-8 p-5 rounded-xl border-2 transition-all duration-500 relative z-30",
        isFocusMode 
          ? "bg-slate-900 border-purple-500 shadow-[0_0_40px_-12px_rgba(147,51,234,0.5)] text-white" 
          : "bg-white border-blue-100 shadow-sm text-slate-900"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-2.5 rounded-lg transition-all",
            isFocusMode ? "bg-purple-500/20 text-purple-300" : "bg-blue-100 text-blue-600"
          )}>
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] opacity-60",
                isFocusMode ? "text-purple-300" : "text-blue-600"
            )}>
              Reading Material
            </span>
            <h3 className={cn("font-bold text-lg leading-tight", isFocusMode ? "text-white" : "text-slate-900")}>
                {isFocusMode ? "Deep Work Session" : "Lesson Content"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Keyboard Hint */}
          <div className={cn(
            "hidden md:flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold transition-opacity",
            isFocusMode ? "border-white/10 text-white/40" : "border-slate-200 text-slate-400"
          )}>
            <Keyboard className="h-3 w-3" />
            <span>PRESS F</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            className={cn(
              "gap-2 border-2 transition-all active:scale-95 cursor-pointer select-none",
              isFocusMode 
                ? "bg-purple-600 border-purple-400 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-purple-400 hover:text-purple-600"
            )}
          >
            {isFocusMode ? <Zap className="h-4 w-4 fill-current text-amber-300" /> : <Target className="h-4 w-4" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isFocusMode ? 'Focus On' : 'Focus Mode'}
            </span>
          </Button>
        </div>
      </div>

      {/* Article Body - Your full markdown styles preserved */}
      <article className={cn(
        "prose prose-lg max-w-none transition-all duration-500",
        isFocusMode ? "prose-slate" : "",
        "prose-headings:text-gray-900 prose-headings:font-bold",
        "prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:border-b prose-h1:pb-4",
        "prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8",
        "prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6",
        "prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4",
        "prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-gray-900 prose-strong:font-semibold",
        "prose-em:text-gray-800",
        "prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-purple-700 prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto",
        "prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6",
        "prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6",
        "prose-li:text-gray-700 prose-li:mb-2",
        "prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:bg-purple-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-700",
        "prose-hr:my-8 prose-hr:border-gray-200",
        "prose-table:border-collapse prose-table:w-full",
        "prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left",
        "prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2",
        "prose-img:rounded-lg prose-img:shadow-md prose-img:my-6"
      )}>
        <ReactMarkdown
          components={{
            // Custom heading with anchor - Logic preserved
            h1: ({ children }) => (
              <h1 className="scroll-mt-20">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="scroll-mt-20">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="scroll-mt-20">{children}</h3>
            ),
            // Enhanced code blocks - Logic preserved
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
            // Enhanced blockquote - Logic preserved
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-purple-400 bg-purple-50 py-3 px-4 my-4 rounded-r-lg">
                {children}
              </blockquote>
            ),
            // Enhanced links - Logic preserved
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
    </div>
  );
}