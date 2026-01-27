// src/App.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

// 引入样式
import "./App.css";

// 引入组件 (我们刚拆分的)
import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import Login from "./components/Login";
import Register from "./components/Register";
import CreatePost from "./components/CreatePost";
import Post from "./components/Post";

function App() {
  // === 1. 状态管理 (逻辑保持原样) ===
  const [posts, setPosts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  // isRegistering 被 view 替代了，这里删掉也没事，或者你留着也不影响
  const [view, setView] = useState("feed");
  const [keyword, setKeyword] = useState("");

  // === 2. 核心副作用：获取数据 (逻辑保持原样) ===
  useEffect(() => {
    // 没登录，清空列表，直接返回
    if (!token) {
      console.log("No token, skipping authenticated fetch.");
      setPosts([]);
      return;
    }

    const fetchData = async () => {
      try {
        const config = token
          ? {
              headers: { Authorization: `Bearer ${token}` },
              params: { search: keyword },
            }
          : {};

        const response = await axios.get("http://127.0.0.1:8000/posts", config);
        setPosts(response.data);
      } catch (error) {
        console.error("Error", error);
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          toast.error("Failed to fetch posts");
        }
      }
    };

    // 防抖逻辑
    const timer = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timer);
  }, [token, keyword]);

  // === 3. 事件处理 (逻辑保持原样) ===
  const handleLoginSuccess = (accessToken) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setView("feed");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    toast.success("Logged out successfully");
  };

  const handleNewPost = (newPostWrapper) => {
    setPosts([newPostWrapper, ...posts]);
  };

  const handleRemovePost = (deletedId) => {
    const updatedPosts = posts.filter((item) => item.Post.id !== deletedId);
    setPosts(updatedPosts);
  };

  // === 4. 辅助渲染函数 (让 return 更干净) ===

  // 渲染登录/注册页面
  const renderAuthView = () => {
    if (view === "login") {
      return (
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <Login
            onLogin={handleLoginSuccess}
            onSwitchToRegister={() => setView("register")}
          />
          <p className="back-link">
            <span onClick={() => setView("feed")}>← Back to Feed</span>
          </p>
        </div>
      );
    }
    if (view === "register") {
      return (
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <Register onSwitchToLogin={() => setView("login")} />
          <p className="back-link">
            <span onClick={() => setView("feed")}>← Back to Feed</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // 渲染 Feed 内容 (未登录提示 或 帖子列表)
  const renderFeed = () => {
    // 情况 A: 没登录 -> 显示大大的提示框
    if (!token) {
      return (
        <div className="auth-prompt-container">
          <h2 className="auth-prompt-title">Welcome to FastForum 🚀</h2>
          <p className="auth-prompt-text">
            Please login to view posts and use AI features.
          </p>
          <button className="auth-prompt-btn" onClick={() => setView("login")}>
            Login Now
          </button>
        </div>
      );
    }

    // 情况 B: 已登录 -> 显示搜索栏、发帖框、列表
    return (
      <>
        {/* 🌟 搜索栏组件 */}
        <SearchBar keyword={keyword} setKeyword={setKeyword} />

        <CreatePost onPostCreated={handleNewPost} token={token} />

        {posts.length === 0 ? (
          <p className="loading-text">Loading posts or no posts yet...</p>
        ) : (
          posts.map((item) => (
            <Post
              key={item.Post.id}
              post={item}
              onDelete={handleRemovePost}
              token={token}
            />
          ))
        )}
      </>
    );
  };

  // === 5. 主渲染 ===
  return (
    <div className="feed-container">
      <Toaster position="top-center" />

      {/* 🌟 导航栏组件 */}
      <Navbar
        token={token}
        onLogout={handleLogout}
        setView={setView}
        setKeyword={setKeyword}
      />

      {/* 根据 view 决定渲染什么 */}
      {(view === "login" || view === "register") && !token
        ? renderAuthView()
        : renderFeed()}
    </div>
  );
}

export default App;
