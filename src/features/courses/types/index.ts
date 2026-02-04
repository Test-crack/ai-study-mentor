export enum DifficultyType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Domain {
  id: string;
  name: string;
  slug: string;
}

export interface Course {
  id: string;
  title: string;
  slug?: string;
  description: string | null;
  thumbnail: string | null;
  Domain: Domain | null;
  difficulty: DifficultyType | null;
  duration_minutes: number | null;
  price: number | null;
  created_at: string | null;
  updated_at: string | null;
  _count?: {
    CourseModule: number;
  };
}

export interface ModuleDetail {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  created_at: string | null;
  updated_at: string | null;
  order_index: number;
  courseModuleId: string;
  _count?: {
    ModuleConcept: number;
  };
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  Domain: Domain | null;
  difficulty: DifficultyType | null;
  duration_minutes: number | null;
  price: number | null;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  modules: ModuleDetail[];
  isEnrolled: boolean;
  enrollmentStatus?: ProgressStatus | null;
  progressPercent?: number;
  moduleIndex?: number;
  enrollment?: {
    status: ProgressStatus;
    progress_percent: number;
  };
  _count?: {
    CourseModule: number;
    UserCourseEnrollment: number;
  };
}

export interface CoursesResponse {
  data: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface InstructorCoursesResponse {
  data: Course[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InstructorCoursesFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_published?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  domainId: string;
  difficulty?: DifficultyType;
  price?: number;
  duration_minutes?: number;
}

export interface CourseDetailResponse {
  data: CourseDetail;
}

export interface CoursesFilters {
  page?: number;
  limit?: number;
  difficulty?: DifficultyType;
  domain?: string;
  search?: string;
  sortBy?: 'price' | 'duration_minutes' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  order_index?: number;
}

export interface UserCourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: ProgressStatus | null;
  progress_percent: number | null;
  enrolled_at: string | null;
}

// Module Management Types
export interface CourseModuleData {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  order_index: number;
  courseModuleId: string;
  conceptCount: number;
  created_at: string;
  updated_at?: string;
}

export interface ModuleListResponse {
  data: CourseModuleData[];
  meta: { total: number };
}

export interface ModuleResponse {
  message: string;
  data: CourseModuleData;
}

export interface CreateModuleRequest {
  title: string;
  description?: string;
  domain?: string;
  order_index?: number;
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string;
  domain?: string;
  order_index?: number;
}

export interface DeleteModuleResponse {
  message: string;
  moduleDeleted: boolean;
}

// Content Management Types

export enum ContentType {
  NOTES = 'NOTES',
  MCQ = 'MCQ'
}

export interface MCQOption {
  id: string;
  text: string;
}

export interface NoteData {
  id: string;
  body: string;
  format: string;
  version: number;
}

export interface MCQData {
  id: string;
  question: string;
  options: MCQOption[];
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
}

export interface ContentItem {
  index: number;
  id: string;
  type: ContentType;
  title: string | null;
  is_required: boolean | null;
  concept_order: number;
  sequence_order: number | null;
  concept: {
    id: string;
    slug: string;
    learningObjective: string;
    keywords: string[];
    domain: string;
    baseConceptId: string;
  };
  content: NoteData | MCQData;
}

export interface CreateContentRequest {
  type: ContentType;
  title: string;
  sequence_order?: number;
  is_required?: boolean;
  // Note specific
  body?: string;
  // MCQ specific
  question?: string;
  options?: Record<string, string>; // Sending as simple object/map
  correct_answer?: string;
  explanation?: string;
  difficulty?: string;
}

export interface UpdateContentRequest {
  title?: string;
  sequence_order?: number;
  is_required?: boolean;
  body?: string;
  question?: string;
  options?: Record<string, string>;
  correct_answer?: string;
  explanation?: string;
  difficulty?: string;
}

export interface ContentResponse {
  message: string;
  data: any;
}

export * from './learning';
