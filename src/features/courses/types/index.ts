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
  Domain: Domain | null;
  difficulty: DifficultyType | null;
  duration_minutes: number | null;
  price: number | null;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  modules: ModuleDetail[];
  isEnrolled: boolean;
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
