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
}

export interface NoteContent {
  id: string;
  body: string;
  format?: string;
}

export interface ContentItem {
  id: string;
  type: 'NOTES' | 'MCQ';
  title: string | null;
  is_required: boolean | null;
  sequence_order: number | null;
  content: NoteContent | MCQContent | null;
}

export interface ConceptData {
  id: string;
  title: string;
  slug: string;
  order_index: number;
  contentItems: ContentItem[];
}

export interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  concepts: ConceptData[];
}

export interface ModuleContentResponse {
  data: {
    courseId: string;
    module: ModuleData;
  };
}
