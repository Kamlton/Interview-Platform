export type Role = "Администратор" | "Отдел кадров" | "Решала";

export type CandidateStatus = "New" | "InProgress" | "Hired" | "Rejected";
export type InterviewStatus = "Planned" | "InProgress" | "Completed" | "Cancelled";
export type DecisionType = "Offer" | "Reject" | "Hold";
export type DocumentType = "OfferLetter" | "RejectionLetter" | "InterviewProtocol";

export interface AuthResponse {
  token: string;
  expiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  fullName: string;
  role: Role;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface CandidateListItem {
  id: string;
  fullName: string;
  city?: string | null;
  status: CandidateStatus;
  isArchived: boolean;
}

export interface CandidateDetails {
  id: string;
  fullName: string;
  phone?: string | null;
  city?: string | null;
  education?: string | null;
  previousWorkplace?: string | null;
  status: CandidateStatus;
  isArchived: boolean;
  skills: string[];
}

export interface SaveCandidate {
  fullName: string;
  phone?: string;
  city?: string;
  education?: string;
  previousWorkplace?: string;
  skills?: string[];
}

export interface Vacancy {
  id: string;
  title: string;
  level?: string;
  description?: string | null;
  salaryFrom?: number;
  salaryTo?: number;
  experience?: string;
  schedule?: string;
  workHours?: number;
  workFormat?: string;
  status: string;
  isArchived: boolean;
}

export interface Competency {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}

export interface MatrixItem { competencyId: string; competencyName: string; weight: number; }
export interface Matrix { id: string; title: string; vacancyId?: string | null; items: MatrixItem[]; }

export interface InterviewListItem {
  id: string;
  candidateName: string;
  vacancyTitle: string;
  interviewerName: string;
  scheduledAt: string;
  status: InterviewStatus;
}

export interface InterviewDetails {
  id: string;
  candidateId: string;
  candidateName: string;
  vacancyId: string;
  vacancyTitle: string;
  interviewerName: string;
  matrixId?: string | null;
  plan?: string | null;
  scheduledAt: string;
  status: InterviewStatus;
  summary?: string | null;
  isArchived: boolean;
}

export interface ScoreLine { competencyId: string; competencyName: string; score: number; comment?: string | null; }
export interface Protocol {
  interviewId: string;
  candidateName: string;
  vacancyTitle: string;
  scheduledAt: string;
  status: InterviewStatus;
  summary?: string | null;
  averageScore: number;
  scores: ScoreLine[];
  decision?: string | null;
}

export interface UserDto { id: string; fullName: string; email: string; role: Role; isActive: boolean; }

export interface AuditLogEntry {
  username: string;
  role: string;
  time: string;
  action: string;
}
