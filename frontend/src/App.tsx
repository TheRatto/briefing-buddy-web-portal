import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "./auth";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SharePage from "./pages/SharePage";

function App() {
  const { data: session } = useSession();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Home page allows both authenticated and anonymous access */}
        <Route path="/" element={<HomePage />} />
        {/* Share page for accessing briefings via share link */}
        <Route path="/share/:token" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

