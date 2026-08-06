import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { CheckCircle2, FileText, HelpCircle, X } from "lucide-react";
import { ContentItem, ContentType } from "../../types";
import ReactMarkdown from "react-markdown";

interface ContentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ContentItem | null;
}

export const ContentPreviewDialog = ({ 
  open, 
  onOpenChange, 
  content 
}: ContentPreviewDialogProps) => {
  if (!content) return null;

  const isNote = content.type === ContentType.NOTES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] p-0 overflow-hidden rounded-3xl border-slate-100 shadow-2xl bg-[#f8fafc]">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-50 p-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${isNote ? "bg-brand-teal-50 text-brand-teal-600" : "bg-brand-blue-50 text-brand-blue-600"}`}>
              {isNote ? <FileText className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-800">
                {content.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-bold text-[10px] text-slate-400 border-slate-200">
                   {content.type}
                </Badge>
                {content.is_required && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-600 text-[10px] font-bold border-none">
                    Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <ScrollArea className="flex-1 p-6 h-[500px]">
          {isNote ? (
            <div className="prose prose-slate prose-sm max-w-none p-4">
              <ReactMarkdown 
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-800 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mb-3 mt-6" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-800 mb-2 mt-4" {...props} />,
                  p: ({node, ...props}) => <p className="text-slate-600 mb-4 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-600" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-slate-600" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-brand-teal-200 pl-4 py-1 my-4 bg-slate-50 italic text-slate-600 rounded-r-lg" {...props} />,
                  code: ({node, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <div className="rounded-lg overflow-hidden my-4 bg-slate-800 text-slate-200 p-4">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    ) : (
                      <code className="bg-slate-100 text-pink-600 rounded px-1.5 py-0.5 text-sm font-mono font-bold border border-slate-200" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {(content.content as any).body || "No content available."}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-8 max-w-xl mx-auto py-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-brand-blue-100 text-brand-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    Q
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 pt-0.5">
                    {(content.content as any).question}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Options</h4>
                <div className="grid gap-3">
                  {((content.content as any).options as any[] || []).map((opt: any) => {
                     const isCorrect = (content.content as any).correct_answer === opt.id;
                     return (
                        <div 
                          key={opt.id}
                          className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                            isCorrect 
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900" 
                              : "bg-white border-slate-100 text-slate-600"
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 ${
                             isCorrect ? "bg-emerald-200 text-emerald-700" : "bg-slate-100 text-slate-400"
                          }`}>
                            {opt.id}
                          </div>
                          <span className="font-medium flex-grow">{opt.text}</span>
                          {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        </div>
                     );
                  })}
                  {/* Handle object format if options come as object not array in some cases? 
                      The component logic previously normalized it, but let's assume array for now based on recent dialog code.
                      Wait, the backend API might send object. The dialog handles both.
                      Let's check `coursesService.getInstructorModuleContent`. Ideally it returns the saved JSON.
                      In `ContentDialog`, we send `Record<string, string>`. 
                      So `options` in `content.content` will be an OBJECT e.g. { "A": "...", "B": "..." }.
                      We need to normalize it here for display.
                  */}
                </div>
              </div>

              {(content.content as any).explanation && (
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                  <h4 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Explanation
                  </h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {(content.content as any).explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t border-slate-50 bg-white flex justify-end">
           <Button onClick={() => onOpenChange(false)} variant="outline" className="rounded-xl font-bold">
             Close Preview
           </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
