import { api } from "./client";
import type {
  AuthResponse, Paged, CandidateListItem, CandidateDetails, SaveCandidate,
  Vacancy, Competency, Matrix, InterviewListItem, InterviewDetails, Protocol,
  UserDto, DecisionType, DocumentType, AuditLogEntry, InterviewRegistryFilters,
} from "../types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }).then((r) => r.data),
  logout: (refreshToken: string) => api.post("/api/auth/logout", { refreshToken }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/api/auth/change-password", { currentPassword, newPassword }),
};

export const candidatesApi = {
  registry: (page: number, size: number, search: string, includeArchived: boolean) =>
    api.get<Paged<CandidateListItem>>("/api/candidates",
      { params: { page, size, search: search || undefined, includeArchived } }).then((r) => r.data),
  get: (id: string) => api.get<CandidateDetails>(`/api/candidates/${id}`).then((r) => r.data),
  create: (body: SaveCandidate) => api.post<CandidateDetails>("/api/candidates", body).then((r) => r.data),
  update: (id: string, body: SaveCandidate) =>
    api.put<CandidateDetails>(`/api/candidates/${id}`, body).then((r) => r.data),
  archive: (id: string, archived: boolean) =>
    api.post(`/api/candidates/${id}/archive`, null, { params: { archived } }),
};

export const vacanciesApi = {
  list: (includeArchived = false) =>
  api.get<Vacancy[]>("/api/vacancies", { params: { includeArchived } }).then((r) => r.data),
  create: (body: {title: string; description?: string; competencies?: any[] }) =>
    api.post<Vacancy>("/api/vacancies", body).then((r) => r.data),
  getCompetencies: (vacancyId: string) => 
    api.get<any[]>(`/api/vacancies/${vacancyId}/competencies`).then(r => r.data),
};

export const competenciesApi = {
  list: () => api.get<Competency[]>("/api/competencies").then((r) => r.data),
  create: (name: string, category?: string, description?: string) =>
    api.post<Competency>("/api/competencies", { name, category, description }).then((r) => r.data),
};

export const matricesApi = {
  get: (id: string) => api.get<Matrix>(`/api/matrices/${id}`).then((r) => r.data),
  create: (title: string, items: { competencyId: string; weight: number }[], vacancyId?: string) =>
    api.post<Matrix>("/api/matrices", { title, vacancyId, items }).then((r) => r.data),
};

export const interviewsApi = {
  registry: (
    page: number, size: number, search: string,
    candidateId?: string, vacancyId?: string, filters?: InterviewRegistryFilters,
  ) =>
    api.get<Paged<InterviewListItem>>("/api/interviews", {
      params: {
        page, size,
        search: search || undefined,
        candidateId,
        vacancyId,
        vacancyTitle: filters?.vacancyTitle || undefined,
        dateFrom: filters?.dateFrom || undefined,
        dateTo: filters?.dateTo || undefined,
        interviewerRole: filters?.interviewerRole || undefined,
        status: filters?.status || undefined,
      },
    }).then((r) => r.data),
  get: (id: string) => api.get<InterviewDetails>(`/api/interviews/${id}`).then((r) => r.data),
  create: (body: {
    candidateId: string; vacancyId: string; interviewerUserId: string;
    matrixId?: string; plan?: string; scheduledAt: string;
  }) => api.post<InterviewDetails>("/api/interviews", body).then((r) => r.data),
  saveScores: (id: string, scores: { competencyId: string; score: number; comment?: string }[], summary?: string) =>
    api.put(`/api/interviews/${id}/scores`, { scores, summary }),
  protocol: (id: string) => api.get<Protocol>(`/api/interviews/${id}/protocol`).then((r) => r.data),
  decide: (id: string, decisionType: DecisionType, comment?: string) =>
    api.post(`/api/interviews/${id}/decision`, { decisionType, comment }),
  printUrl: (id: string, type: DocumentType) => `/api/interviews/${id}/print/${type}`,
};

export const usersApi = {
  list: () => api.get<UserDto[]>("/api/users").then((r) => r.data),
  create: (body: { fullName: string; email: string; password: string; role: string }) =>
    api.post<UserDto>("/api/users", body).then((r) => r.data),
};

export const auditApi = {
  logAction: (action: string) => api.post("/api/audit/actions", { action }),
  userHistory: (username: string) =>
    api.get<AuditLogEntry[]>(`/api/audit/users/${encodeURIComponent(username)}/actions`)
      .then((r) => r.data),
};
