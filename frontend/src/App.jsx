
import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import PlayerDetailsPage from "./pages/PlayerDetailsPage.jsx";
import PlayersPage from "./pages/PlayersPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import LeaguePassPage from "./pages/LeaguePassPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import TeamProfilePage from "./pages/TeamProfilePage.jsx";
import TeamsPage from "./pages/TeamsPage.jsx";
import ProtectedRoute from "./guards/ProtectedRoute.jsx";
import SiteLayout from "./layout/SiteLayout.jsx";
import PaymentResultPage from "./pages/PaymentResultPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route
            path="/teams/:teamId"
            element={<TeamProfilePage />}
          />
          <Route path="/players" element={<PlayersPage />} />
          <Route
            path="/players/:playerId"
            element={<PlayerDetailsPage />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/league-pass"
            element={<LeaguePassPage />}
          />
          <Route
  path="/payment-result"
  element={<PaymentResultPage />}
/>
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
