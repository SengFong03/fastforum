// src/components/SearchBar.jsx
import React from "react";

function SearchBar({ keyword, setKeyword }) {
  return (
    <div className="search-wrapper">
      <input
        type="text"
        placeholder="🔍 Search posts..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="search-input"
      />
    </div>
  );
}

export default SearchBar;
