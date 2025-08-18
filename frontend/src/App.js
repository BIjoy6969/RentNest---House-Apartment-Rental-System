import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RentalApplicationPage from "./pages/RentalApplicationPage";
import EditPropertyPage from "./pages/EditPropertyPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/rental-application/:propertyId" element={<RentalApplicationPage />} />
        <Route path="/edit-property/:propertyId" element={<EditPropertyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
