export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  bio?: string;
  avatar?: string | null;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  teacher: number | User;
  teacher_name?: string;
  status: 'draft' | 'published';
  students_count?: number;
  avg_rating?: number | null;
  ratings_count?: number;
  is_enrolled?: boolean;
  materials?: CourseMaterial[];
  created_at: string;
  updated_at: string;
}

export interface CourseComment {
  id: number;
  author: User;
  text: string;
  created_at: string;
}

export interface CourseMaterial {
  id: number;
  title: string;
  file: string;
  uploaded_at: string;
}

export interface CourseEnrollment {
  id: number;
  student: User;
  enrolled_at: string;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  course: number;
  course_title?: string;
  passing_score: number;
  time_limit?: number;
  questions_count?: number;
  questions?: TestQuestion[];
  created_at: string;
}

export interface TestQuestion {
  id: number;
  question_text: string;
  options: string[];
  correct_answer?: number;
  order: number;
}

export interface TestResult {
  id: number;
  student: User;
  test: number;
  test_title?: string;
  score: number;
  passed: boolean;
  answers: number[];
  completed_at: string;
}

export interface Certificate {
  id: number;
  student: User;
  course: number;
  course_title: string;
  teacher_name: string;
  certificate_number: string;
  issued_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
