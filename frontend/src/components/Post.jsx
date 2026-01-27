import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

// 🎨 AI 总结框的样式 (稍微调得更像 ChatBot 气泡)
const aiSummaryStyle = {
  background: "linear-gradient(to right, #e0f2fe, #f0f9ff)", // 渐变蓝
  border: "1px solid #bae6fd",
  padding: "15px",
  borderRadius: "8px",
  marginTop: "15px",
  fontSize: "0.95rem",
  color: "#0369a1",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  display: "flex", // 👈 用 Flex 布局
  alignItems: "start", // 👈 图标和文字对齐
  gap: "10px", // 👈 图标和文字的间距
};

function Post({ post, onDelete, token }) {
  // 注意：这里我们假设后端返回的数据里包含 ai_summary 字段
  // 结构可能是 post.Post.ai_summary 或者 post.ai_summary，根据你实际后端调整
  const [postData, setPostData] = useState(post.Post);

  // 👍 点赞数状态
  const [votes, setVotes] = useState(post.votes);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(postData.title);
  const [editContent, setEditContent] = useState(postData.content);

  const [isLiked, setIsLiked] = useState(post.is_liked);

  // === 🤖 新增：AI Summary 相关的状态 ===
  // 如果数据库里本来就有 summary，就用它；否则为空
  const [summary, setSummary] = useState(postData.ai_summary || "");
  // loading 状态：为了防止用户疯狂点击，也为了显示“生成中...”
  const [isSummarizing, setIsSummarizing] = useState(false);

  // === 💬 评论相关的状态 ===
  // 1. 评论列表 (初始值直接从 postData 里拿)
  const [comments, setComments] = useState(postData.comments || []);
  // 2. 新评论的内容
  const [newCommentText, setNewCommentText] = useState("");
  // 3. 是否展开评论区
  const [showComments, setShowComments] = useState(false);
  // 4. 发送中的 loading 状态
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // ... (handleDeleteClick 保持不变) ...
  const handleDeleteClick = async () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this post?",
    );
    if (!isConfirmed) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/posts/${postData.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Post deleted successfully!");
      onDelete(postData.id);
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  // ... (handleSave 保持不变) ...
  const handleSave = async () => {
    /* ...省略，和你之前的一样... */
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Title and content cannot be empty");
      return;
    }
    try {
      await axios.put(
        `http://127.0.0.1:8000/posts/${postData.id}/`,
        {
          title: editTitle,
          content: editContent,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Updated!");
      setPostData({ ...postData, title: editTitle, content: editContent });
      setIsEditing(false);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // 🌟 新增：处理点赞 (乐观更新)
  const handleVote = async () => {
    // 1. 决定方向：如果已经赞了(true)，那这次就是取消(0)；否则就是点赞(1)
    const dir = isLiked ? 0 : 1;

    if (isLiked) {
      setVotes((prev) => prev - 1); // 取消赞：票数 -1
    } else {
      setVotes((prev) => prev + 1); // 点赞：票数 +1
    }

    setIsLiked(!isLiked); // 切换状态

    try {
      // 2. 发送请求给后端
      // 假设你的点赞 API 是 POST /vote，body 传 { post_id: ..., dir: 1 }
      // 你需要根据你实际后端的 API 文档来修改这里
      await axios.post(
        "http://127.0.0.1:8000/vote",
        { post_id: postData.id, dir: dir },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // 成功了就不需要做任何事了，因为界面已经 +1 了
    } catch (error) {
      // 出错了，回滚状态
      if (isLiked) {
        setVotes((prev) => prev + 1); // 回滚：票数 +1
      } else {
        setVotes((prev) => prev - 1); // 回滚：票数 -1
      }
      setIsLiked(isLiked); // 回滚状态

      // 错误处理
      if (error.response && error.response.status === 401) {
        toast.error("Please login to vote");
      } else {
        toast.error("Failed to vote");
      }
    }
  };

  // === 🤖 新增：调用 AI 总结接口 ===
  const handleSummarize = async () => {
    // 1. 设置正在加载 (UI 会转圈圈)
    setIsSummarizing(true);

    try {
      // ⚠️ 注意：这里假设你的 URL 是 /summarize/ID
      // 如果你的 router 有 prefix (比如 /posts)，那可能就是 /posts/summarize/ID
      // 请根据你的 main.py 确认这个 URL
      const response = await axios.post(
        `http://127.0.0.1:8000/ai/summarize/${postData.id}`,
        {}, // body 是空的，因为 post_id 在 URL 里
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // 2. 拿到结果，显示出来
      const aiText = response.data.summary;
      setSummary(aiText);
      toast.success("AI Summary generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate summary");
    } finally {
      // 3. 无论成功失败，都要关掉 loading
      setIsSummarizing(false);
    }
  };

  // === 💬 发送评论函数 ===
  const handleAddComment = async (e) => {
    e.preventDefault(); // 防止表单刷新
    if (!newCommentText.trim()) return; // 防止发空评论

    setIsSubmittingComment(true);
    try {
      // ⚠️ 注意：这里假设你的 API 是 POST /comments/
      // 并且 Body 需要 post_id 和 content
      const payload = {
        post_id: postData.id,
        content: newCommentText,
      };

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post(
        "http://127.0.0.1:8000/comments/",
        payload,
        config,
      );

      // 成功后：
      // 1. 把后端返回的新评论加到列表最前面 (或者最后面)
      setComments([...comments, response.data]);
      // 2. 清空输入框
      setNewCommentText("");
      toast.success("Comment added!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="post-card">
      {/* 头部 (保持刚才的 Flex 布局) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "15px",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2 className="post-title" style={{ margin: "0 0 5px 0" }}>
            {postData.title}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#999", margin: 0 }}>
            📅 {new Date(postData.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* 按钮组 */}
        {!isEditing && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "#f0f0f0",
                border: "1px solid #ddd",
                padding: "5px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Edit
            </button>
            <button
              onClick={handleDeleteClick}
              style={{
                background: "#ff4d4f",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        // ... (编辑模式保持不变) ...
        <div style={{ marginTop: "20px" }}>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{ width: "100%", padding: "8px", minHeight: "100px" }}
          />
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
          >
            <button onClick={() => setIsEditing(false)}>Cancel</button>
            <button
              onClick={handleSave}
              style={{
                background: "black",
                color: "white",
                padding: "8px 16px",
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* === 🤖 AI Summary 展示区 === */}

          {/* 情况 A: 已经有 Summary 了 -> 显示内容 */}
          {summary && (
            <div style={aiSummaryStyle}>
              <span style={{ fontSize: "1.2rem" }}>🤖</span>
              <div>
                <strong style={{ display: "block", marginBottom: "5px" }}>
                  AI Summary:
                </strong>
                <p style={{ margin: 0, lineHeight: "1.5" }}>{summary}</p>
              </div>
            </div>
          )}

          {/* 情况 B: 还没有 Summary -> 显示生成按钮 */}
          {/* 只有当没有 summary 时，才显示这个按钮 */}
          {!summary && (
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing} // 生成中禁用按钮
                style={{
                  background: isSummarizing
                    ? "#ccc"
                    : "linear-gradient(45deg, #6366f1, #8b5cf6)", // 紫色渐变
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  cursor: isSummarizing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  transition: "transform 0.1s",
                }}
              >
                {isSummarizing ? (
                  <>⏳ Generating...</>
                ) : (
                  <>✨ Summarize with AI</>
                )}
              </button>
            </div>
          )}

          {/* 正文内容 */}
          <p
            className="post-content"
            style={{
              marginTop: "15px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: "1.6",
              color: "#4a5568",
            }}
          >
            {postData.content}
          </p>

          {/* 🌟 核心修改：点赞按钮区域 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "15px",
              gap: "10px",
            }}
          >
            {/* 把点赞做成一个按钮，而不只是文字 */}
            <button
              onClick={handleVote}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: isLiked ? "#ffe4e6" : "transparent",
                border: "1px solid #e2e8f0",
                padding: "5px 12px",
                borderRadius: "20px",
                cursor: "pointer",
                color: "#e11d48", // 玫瑰红
                fontWeight: "bold",
              }}
            >
              {/* 这里可以用 unicode 图标，也可以以后换成 SVG */}
              {isLiked ? "❤️" : "🤍"} {votes}
            </button>

            {/* 这里的 ID 用于调试，以后可以删掉 */}
            <span style={{ fontSize: "0.7rem", color: "#ccc" }}>
              ID: {postData.id}
            </span>
          </div>
        </>
      )}

      <hr
        style={{ margin: "15px 0", border: "0", borderTop: "1px solid #eee" }}
      />

      {/* === 👇 评论区入口 === */}
      <div style={{ marginTop: "10px" }}>
        {/* 1. 切换按钮：显示/隐藏评论 */}
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "0",
          }}
        >
          💬 {comments.length} Comments {showComments ? "▲" : "▼"}
        </button>

        {/* 2. 评论列表区域 (只有 showComments 为 true 才显示) */}
        {showComments && (
          <div style={{ marginTop: "15px", paddingLeft: "10px" }}>
            {/* A. 现有评论列表 */}
            {comments.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    style={{
                      marginBottom: "10px",
                      borderBottom: "1px solid #f0f0f0",
                      paddingBottom: "5px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        color: "#333",
                      }}
                    >
                      {/* 这里假设 comment 对象里有 user 信息，如果没有可能只显示 id */}
                      {comment.owner
                        ? comment.owner.email.split("@")[0]
                        : "Anonymous User"}
                      <span
                        style={{
                          fontWeight: "normal",
                          color: "#999",
                          marginLeft: "10px",
                          fontSize: "0.75rem",
                        }}
                      >
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#555",
                        marginTop: "2px",
                      }}
                    >
                      {comment.content}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#aaa",
                  fontStyle: "italic",
                }}
              >
                No comments yet. Be the first!
              </p>
            )}

            {/* B. 写评论的输入框 (只有登录了才显示) */}
            {token && (
              <form
                onSubmit={handleAddComment}
                style={{ display: "flex", gap: "10px", marginTop: "15px" }}
              >
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "20px",
                    border: "1px solid #ddd",
                    fontSize: "0.9rem",
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  style={{
                    background: isSubmittingComment ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    padding: "8px 15px",
                    cursor: isSubmittingComment ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {isSubmittingComment ? "..." : "Post"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Post;
