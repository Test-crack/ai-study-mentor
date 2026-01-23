import { 
  FileText, 
  HelpCircle, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  GripVertical,
  Eye
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/shared/components/ui/dropdown-menu";
import { ContentItem, ContentType } from "../../types";

interface ModuleContentListProps {
  contentItems: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
  isLoading?: boolean;
}

export const ModuleContentList = ({ 
  contentItems, 
  onEdit, 
  onDelete,
  onPreview,
  isLoading = false 
}: ModuleContentListProps) => {
  
  if (contentItems.length === 0) {
    return (
      <div className="p-4 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
        <p className="text-sm text-slate-400 font-medium">No content added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {contentItems.map((item, index) => (
        <div 
          key={item.id}
          className="group flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 hover:shadow-sm hover:border-indigo-100 transition-all"
        >
          <GripVertical className="h-4 w-4 text-slate-300 cursor-grab active:cursor-grabbing hover:text-indigo-400" />
          
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            item.type === ContentType.NOTES 
              ? "bg-blue-50 text-blue-600" 
              : "bg-purple-50 text-purple-600"
          }`}>
            {item.type === ContentType.NOTES ? (
              <FileText className="h-4 w-4" />
            ) : (
              <HelpCircle className="h-4 w-4" />
            )}
          </div>

          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-bold text-slate-700 truncate">
                {item.title || "Untitled Content"}
              </h5>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium bg-slate-50 text-slate-400 border-none">
                {item.type}
              </Badge>
              {item.is_required && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium bg-amber-50 text-amber-600 border-none">
                  Required
                </Badge>
              )}
            </div>
            {item.type === ContentType.MCQ && (
               <p className="text-xs text-slate-400 truncate mt-0.5">
                 {(item.content as any).question}
               </p>
            )}
          </div>

          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                onClick={() => onPreview(item)}
            >
                <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                onClick={() => onEdit(item)}
            >
                <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                onClick={() => onDelete(item)}
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
