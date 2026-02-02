// Learning page types based on getModuleContent API response

export interface MCQOption {
  id: string;
  text: string;
}

export interface MCQContent {
  id: string;
  question: string;
  options: MCQOption[];
  difficulty?: string;
  correct_answer?: string;
  explanation?: string;
}

export interface NoteContent {
  id: string;
  body: string;
  format?: string;
}

export type ContentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ContentItemConcept {
  id: string;
  slug: string;
  learningObjective: string;
}

export interface ContentItem {
  index: number;
  id: string;
  type: 'NOTES' | 'MCQ';
  title: string | null;
  is_required: boolean | null;
  concept_order: number;
  sequence_order: number | null;
  status: ContentStatus;
  completed_at: string | null;
  concept: ContentItemConcept;
  content: NoteContent | MCQContent | null;
}

export interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  total_items: number;
}

export interface ModuleContentResponse {
  data: {
    courseId: string;
    module: ModuleData;
    contentItems: ContentItem[];
  };
}