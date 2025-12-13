import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, Lightbulb, Target, Sparkles, AlertCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface ConceptMetadata {
  conceptId: string;
  domain: string;
  conceptSlug: string;
  keywords: string[];
  learningObjective: string;
  userLinked: boolean;
}

interface EnhancedStudyNotesProps {
  markdown: string;
  concept?: ConceptMetadata;
}

export const EnhancedStudyNotes = ({ markdown, concept }: EnhancedStudyNotesProps) => {
  // Process markdown to highlight keywords
  const highlightedMarkdown = useMemo(() => {
    if (!concept || !concept.keywords) return markdown;

    let processed = markdown;
    
    // Highlight all keywords with red circle
    concept.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      processed = processed.replace(regex, `**🔴 $1**`);
    });

    return processed;
  }, [markdown, concept]);

  return (
    <div className="mt-4 sm:mt-6 space-y-4">
      {/* Concept Metadata Card */}
      {concept && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Learning Objective</h3>
              {concept.userLinked && (
                <Badge className="bg-green-500 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Linked to Profile
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-purple-200">
              {concept.learningObjective}
            </p>

            {/* Domain & Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Book className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-600">Domain</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {concept.domain}
                </Badge>
              </div>

              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-600">Key Topics</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {concept.keywords?.slice(0, 3).map((keyword, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Keyword Legend */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border-2 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-semibold text-gray-800">Keyword Highlighting Guide</h4>
              </div>
              <div className="flex items-center gap-2 bg-white p-3 rounded border border-red-200">
                <span className="text-lg">🔴</span>
                <div>
                  <span className="font-semibold text-red-700">Key Concepts</span>
                  <p className="text-gray-600 text-xs">Important terms highlighted throughout the notes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Notes Content */}
      <Card className="bg-white border-2 border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 bg-green-500 rounded-lg">
              <Book className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">📝 AI-Generated Study Notes</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Study Material
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none enhanced-markdown">
            <ReactMarkdown
              components={{
                // Custom rendering for bold text with emoji markers
                strong: ({ children, ...props }) => {
                  const text = String(children);
                  if (text.startsWith('🔴 ')) {
                    return (
                      <strong 
                        className="text-red-700 font-bold"
                        {...props}
                      >
                        {text.replace('🔴 ', '')}
                      </strong>
                    );
                  }
                  return <strong className="text-gray-900 font-semibold" {...props}>{children}</strong>;
                },
                // Enhanced heading styles
                h1: ({ children, ...props }) => (
                  <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-4 border-purple-300" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-3 pb-2 border-b-2 border-blue-300" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="text-xl font-semibold text-gray-800 mt-5 mb-2" {...props}>
                    {children}
                  </h3>
                ),
                // Enhanced list styles
                ul: ({ children, ...props }) => (
                  <ul className="space-y-2 my-4" {...props}>
                    {children}
                  </ul>
                ),
                li: ({ children, ...props }) => (
                  <li className="ml-4 pl-2 border-l-2 border-purple-300" {...props}>
                    {children}
                  </li>
                ),
                // Enhanced paragraph styles
                p: ({ children, ...props }) => (
                  <p className="text-gray-700 leading-relaxed my-3" {...props}>
                    {children}
                  </p>
                ),
                // Code blocks
                code: ({ children, ...props }) => (
                  <code className="bg-gray-100 text-purple-700 px-2 py-1 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                ),
                // Blockquotes
                blockquote: ({ children, ...props }) => (
                  <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700" {...props}>
                    {children}
                  </blockquote>
                ),
              }}
            >
              {highlightedMarkdown}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
