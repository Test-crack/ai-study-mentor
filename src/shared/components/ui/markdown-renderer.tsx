import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Separator } from './separator';
import { BookOpen, CheckCircle, Lightbulb, Star, Target, AlertCircle } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  title?: string;
  showTitle?: boolean;
}

export const MarkdownRenderer = ({ 
  content, 
  className = "", 
  title = "Study Notes",
  showTitle = true 
}: MarkdownRendererProps) => {
  
  const getIconForHeading = (level: number) => {
    switch (level) {
      case 1: return <BookOpen className="w-5 h-5" />;
      case 2: return <Target className="w-4 h-4" />;
      case 3: return <Star className="w-4 h-4" />;
      default: return <CheckCircle className="w-3 h-3" />;
    }
  };

  const getHeadingStyles = (level: number) => {
    switch (level) {
      case 1: return "text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200 flex items-center space-x-2";
      case 2: return "text-xl font-semibold text-gray-800 mb-3 mt-6 flex items-center space-x-2";
      case 3: return "text-lg font-medium text-gray-700 mb-2 mt-4 flex items-center space-x-2";
      case 4: return "text-base font-medium text-gray-700 mb-2 mt-3 flex items-center space-x-2";
      default: return "text-sm font-medium text-gray-600 mb-1 mt-2 flex items-center space-x-2";
    }
  };

  return (
    <Card className={`bg-white shadow-lg border-0 ${className}`}>
      {showTitle && (
        <div className="bg-gradient-to-r from-blue-50 to-brand-blue-50 px-6 py-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Study Material
            </Badge>
          </div>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            components={{
              // Custom heading renderer with icons
              h1: ({ children }) => (
                <h1 className={getHeadingStyles(1)}>
                  {getIconForHeading(1)}
                  <span>{children}</span>
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className={getHeadingStyles(2)}>
                  {getIconForHeading(2)}
                  <span>{children}</span>
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className={getHeadingStyles(3)}>
                  {getIconForHeading(3)}
                  <span>{children}</span>
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className={getHeadingStyles(4)}>
                  {getIconForHeading(4)}
                  <span>{children}</span>
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className={getHeadingStyles(5)}>
                  {getIconForHeading(5)}
                  <span>{children}</span>
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className={getHeadingStyles(6)}>
                  {getIconForHeading(6)}
                  <span>{children}</span>
                </h6>
              ),
              
              // Enhanced paragraph styling
              p: ({ children }) => (
                <p className="text-gray-700 leading-7 mb-4 text-base">
                  {children}
                </p>
              ),
              
              // Beautiful list styling
              ul: ({ children }) => (
                <ul className="space-y-2 mb-4 ml-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="space-y-2 mb-4 ml-4 list-decimal">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="flex items-start space-x-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{children}</span>
                </li>
              ),
              
              // Enhanced blockquote
              blockquote: ({ children }) => (
                <div className="bg-gradient-to-r from-blue-50 to-brand-teal-50 border-l-4 border-blue-400 p-4 my-4 rounded-r-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="text-blue-800 italic">
                      {children}
                    </div>
                  </div>
                </div>
              ),
              
              // Enhanced strong/bold text
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900 bg-yellow-100 px-1 rounded">
                  {children}
                </strong>
              ),
              
              // Enhanced emphasis/italic
              em: ({ children }) => (
                <em className="italic text-brand-blue-700 font-medium">
                  {children}
                </em>
              ),
              
              // Code blocks with simple styling
              code: ({ inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                if (!inline) {
                  return (
                    <div className="my-4">
                      {language && (
                        <div className="bg-gray-800 text-gray-200 px-3 py-1 text-xs font-medium rounded-t-lg">
                          {language.toUpperCase()}
                        </div>
                      )}
                      <pre className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm ${language ? 'rounded-t-none rounded-b-lg' : 'rounded-lg'}`}>
                        <code {...props}>
                          {String(children).replace(/\n$/, '')}
                        </code>
                      </pre>
                    </div>
                  );
                }
                
                return (
                  <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              
              // Enhanced tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-50">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="bg-white divide-y divide-gray-200">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-gray-50">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-sm text-gray-700">
                  {children}
                </td>
              ),
              
              // Horizontal rule
              hr: () => (
                <Separator className="my-6" />
              ),
              
              // Links
              a: ({ children, href }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};