// src/components/Navbar.jsx
import React from "react";

function Navbar({ token, onLogout, setView, setKeyword }) {
  return (
    <div className="navbar">
      {/* 1. Brand / Logo */}
      <h1
        className="nav-brand"
        onClick={() => {
          setView("feed");
          setKeyword(""); // 点击标题清空搜索，回到首页
        }}
      >
        FastForum
      </h1>

      {/* 2. Right Actions */}
      <div>
        {token ? (
          <button className="nav-btn logout" onClick={onLogout}>
            Logout
          </button>
        ) : (
          <button className="nav-btn login" onClick={() => setView("login")}>
            Login
          </button>
        )}
      </div>
    </div>
  );
}

export default Navbar;
