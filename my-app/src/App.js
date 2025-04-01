import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Header from "./compoents/Header"
import Watchlist from "./pages/Watchlist";
import { useAuth } from "./context/AuthContext";
import Register from "./pages/Register";
import "./App.css";

const App = () => {
  const { user, loading } = useAuth(); 

  if (loading) {
    return <div>Loading...</div>; 
  }
  return (
    <Router>
   {user && <Header />}
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/watchlist" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/watchlist" /> : <Register />} />
      <Route path="/watchlist" element={user ? <Watchlist /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={user ? "/watchlist" : "/login"} />} />
    </Routes>
  </Router>
  );
};

export default App;
