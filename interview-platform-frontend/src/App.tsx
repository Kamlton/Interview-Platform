import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import CandidatesPage from "./pages/CandidatesPage";
import CandidateFormPage from "./pages/CandidateFormPage";
import InterviewsPage from "./pages/InterviewsPage";
import InterviewPage from "./pages/InterviewPage";
import VacanciesPage from "./pages/VacanciesPage";
import CompetenciesPage from "./pages/CompetenciesPage";
import UsersPage from "./pages/UsersPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/interviews" replace />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="interviews/:id" element={<InterviewPage />} />

          <Route element={<ProtectedRoute roles={["Администратор", "Отдел кадров"]} />}>
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="candidates/new" element={<CandidateFormPage />} />
            <Route path="candidates/:id" element={<CandidateFormPage />} />
            <Route path="vacancies" element={<VacanciesPage />} />
            <Route path="competencies" element={<CompetenciesPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["Администратор"]} />}>
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
