// src/components/Login.jsx
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 🌟 新增：加载状态
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 🌟 开始请求，锁住按钮
    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/login",
        formData,
      );
      toast.success("Welcome back!");
      // 这里的 setIsLoading(false) 其实可以不写，因为马上就切换页面组件了
      onLogin(response.data.access_token);
    } catch (error) {
      toast.error("Login failed, please check your credentials");
      // 🌟 失败了，解锁按钮，让用户重试
      setIsLoading(false);
    }
  };

  return (
    <div className="post-card">
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <form onSubmit={handleSubmit}>
        {/* Input 保持不变 */}
        <input
          type="email"
          placeholder="Email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Button 升级 */}
        <button
          type="submit"
          disabled={isLoading} // 🌟 加载中禁用点击
          style={{
            width: "100%",
            padding: "12px",
            // 🌟 加载中变灰色，平时是黑色
            background: isLoading ? "#ccc" : "black",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            // 🌟 加载中鼠标变成禁止符号
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "background 0.3s",
          }}
        >
          {/* 🌟 文字变化 */}
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* ... 底部切换按钮保持不变 ... */}
      <p style={{ marginTop: "15px", textAlign: "center", fontSize: "0.9rem" }}>
        Don't have an account?{" "}
        <span
          onClick={onSwitchToRegister}
          style={{
            color: "blue",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Register here
        </span>
      </p>
    </div>
  );
}

export default Login;
