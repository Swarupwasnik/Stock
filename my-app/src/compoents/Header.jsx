import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaList, FaBell, FaSignOutAlt, FaUserCircle, FaBars } from "react-icons/fa";
import "../styles/header.css";

const Header = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
    setSearchQuery("");
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo" onClick={() => navigate("/")}>
          StockWatch 📈
        </div>

        <div className={`nav-section ${isMobileMenuOpen ? "active" : ""}`}>
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">
              <FaSearch className="search-icon" />
            </button>
          </form>

          <nav className="nav-links">
            <button className="nav-link" onClick={() => navigate("/watchlist")}>
              <FaList className="icon" />
              <span className="link-text">Watchlist</span>
            </button>
            <button className="nav-link" onClick={() => navigate("/alerts")}>
              <FaBell className="icon" />
              <span className="link-text">Alerts</span>
            </button>
          </nav>

          {user && (
            <div className="user-section">
              <div className="user-info">
                <FaUserCircle className="user-icon" />
                <span className="username">{user.username}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt className="logout-icon" />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          )}
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <FaBars />
        </button>
      </div>
    </header>
  );
};

export default Header;

// import React from "react";
// import { useAuth } from "../context/authContext";
// import { useNavigate } from "react-router-dom";
// import "../styles/header.css";

// const Header = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   return (
//     <header className="header">
//       <div className="container">
//         <div className="logo">ChatApp 💬</div>
//         {user && (
//           <div className="nav-section">
//             <div className="user-greeting">
//               👋 Welcome, <span className="username">{user.username}</span>
//             </div>
//             <button className="logout-btn" onClick={handleLogout}>
//               Logout
//             </button>
//           </div>
//         )}
//       </div>
//     </header>
//   );
// };

// export default Header;



