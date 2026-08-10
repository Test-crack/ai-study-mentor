import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Switch } from "@/shared/components/ui/switch";
import { Loader2, FileText, HelpCircle, Plus, Trash2, CheckCircle2, Pencil } from "lucide-react";
import { ContentItem, ContentType, CreateContentRequest, UpdateContentRequest } from "../../types";

interface ContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateContentRequest | UpdateContentRequest) => Promise<void>;
  content?: ContentItem | null;
  isLoading?: boolean;
}

export const ContentDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  content, 
  isLoading = false 
}: ContentDialogProps) => {
  const isEditing = !!content;
  const [contentType, setContentType] = useState<ContentType>(ContentType.NOTES);
  const [title, setTitle] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  
  // Note State
  const [noteBody, setNoteBody] = useState("");

  // MCQ State
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<{id: string, text: string}[]>([
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  useEffect(() => {
    if (content) {
      setContentType(content.type);
      setTitle(content.title || "");
      setIsRequired(content.is_required ?? true);
      
      if (content.type === ContentType.NOTES) {
        setNoteBody((content.content as any).body || "");
      } else if (content.type === ContentType.MCQ) {
        const mcq = content.content as any;
        setQuestion(mcq.question || "");
        setOptions(mcq.options || []);
        setCorrectAnswer(mcq.correct_answer || "A");
        setExplanation(mcq.explanation || "");
        setDifficulty(mcq.difficulty || "medium");
      }
    } else {
      // Reset form
      setContentType(ContentType.NOTES);
      setTitle("");
      setIsRequired(true);
      setNoteBody("");
      setQuestion("");
      setOptions([
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" }
      ]);
      setCorrectAnswer("A");
      setExplanation("");
      setDifficulty("medium");
    }
  }, [content, open]);

  const handleSubmit = async () => {
    // Basic Validation
    if (!title.trim()) return;

    const baseData = {
      title,
      is_required: isRequired
    };

    let payload: any = { ...baseData };

    if (contentType === ContentType.NOTES) {
      if (!noteBody.trim()) return;
      payload = {
        ...payload,
        type: ContentType.NOTES,
        body: noteBody
      };
    } else {
      if (!question.trim()) return;
      // Convert options array to map/object if backend expects it or keep as is?
      // Based on schema, it stores JSON. Let's send what the backend expects.
      // The analyzed backend `addModuleContent` expects `options` directly. 
      // Assuming backend handles array or object. Let's stick to the interface.
      // Interface says `Record<string, string>`.
      
      const optionsMap: Record<string, string> = {};
      options.forEach(opt => {
        if (opt.text.trim()) optionsMap[opt.id] = opt.text;
      });

      if (Object.keys(optionsMap).length < 2) return; // Need at least 2 options

      payload = {
        ...payload,
        type: ContentType.MCQ,
        question,
        options: optionsMap,
        correct_answer: correctAnswer,
        explanation,
        difficulty
      };
    }

    await onSubmit(payload);
  };

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-slate-100 shadow-2xl p-0 gap-0 bg-[#f8fafc]">
        <DialogHeader className="p-6 pb-2 bg-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isEditing ? <Pencil className="h-5 w-5 text-brand-teal-600" /> : <Plus className="h-5 w-5 text-brand-teal-600" />}
            {isEditing ? `Edit ${contentType === ContentType.NOTES ? 'Note' : 'MCQ'}` : "Add Content to Module"}
          </DialogTitle>
          <DialogDescription>
            Create learning materials for your students.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {!isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
                  contentType === ContentType.NOTES 
                    ? "border-brand-teal-600 bg-brand-teal-50" 
                    : "border-slate-200 bg-white hover:border-brand-teal-300"
                }`}
                onClick={() => setContentType(ContentType.NOTES)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${contentType === ContentType.NOTES ? "bg-brand-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className={`font-bold ${contentType === ContentType.NOTES ? "text-brand-teal-900" : "text-slate-600"}`}>
                    Note / Article
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Rich text content, reading materials, or markdown documentation.
                </p>
              </div>

              <div 
                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
                  contentType === ContentType.MCQ
                    ? "border-brand-blue-600 bg-brand-blue-50" 
                    : "border-slate-200 bg-white hover:border-brand-blue-300"
                }`}
                onClick={() => setContentType(ContentType.MCQ)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${contentType === ContentType.MCQ ? "bg-brand-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <span className={`font-bold ${contentType === ContentType.MCQ ? "text-brand-blue-900" : "text-slate-600"}`}>
                    Quiz / MCQ
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Multiple choice questions to test student knowledge.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-bold text-slate-700">Content Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Variables"
                className="h-11 rounded-xl border-slate-200"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100">
               <div className="space-y-0.5">
                 <Label className="text-sm font-bold text-slate-700">Required Content</Label>
                 <p className="text-xs text-slate-500">Students must complete this to progress.</p>
               </div>
               <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>

            {contentType === ContentType.NOTES && (
              <div className="space-y-2">
                <Label htmlFor="body" className="text-sm font-bold text-slate-700">Content Body (Markdown Supported)</Label>
                <Textarea 
                  id="body" 
                  value={noteBody} 
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="# Heading\n\nWrite your learning content here..."
                  className="min-h-[300px] rounded-xl border-slate-200 font-mono text-sm leading-relaxed"
                />
              </div>
            )}

            {contentType === ContentType.MCQ && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-sm font-bold text-slate-700">Question</Label>
                  <Textarea 
                    id="question" 
                    value={question} 
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What is the result of 2 + 2?"
                    className="min-h-[80px] rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Options</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-3">
                        <div 
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer border-2 transition-all ${
                            correctAnswer === opt.id 
                              ? "bg-green-500 border-green-500 text-white" 
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                          onClick={() => setCorrectAnswer(opt.id)}
                        >
                          {correctAnswer === opt.id ? <CheckCircle2 className="h-4 w-4" /> : opt.id}
                        </div>
                        <Input 
                          value={opt.text}
                          onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                          placeholder={`Option ${opt.id}`}
                          className={`h-10 rounded-xl ${correctAnswer === opt.id ? "border-green-200 ring-2 ring-green-500/10" : "border-slate-200"}`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-medium pl-1">* Click the circle letter to select correct answer.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700">Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Explanation (Optional)</Label>
                  <Textarea 
                    value={explanation} 
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Explain why the answer is correct..."
                    className="min-h-[100px] rounded-xl border-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 bg-white border-t border-slate-50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !title.trim() || (contentType === ContentType.NOTES && !noteBody) || (contentType === ContentType.MCQ && !question)}
            className="rounded-xl font-bold bg-brand-teal-600 hover:bg-brand-teal-700 text-white shadow-lg shadow-brand-teal-100"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Content"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
