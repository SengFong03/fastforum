# FastForum (Full Stack Social Platform) 🚀

A modern full-stack social media application built with **FastAPI**, **React**, and **PostgreSQL**, fully containerized with **Docker**.

## 🛠 Tech Stack

* **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
* **Frontend:** React, Vite, JavaScript
* **Database:** PostgreSQL
* **Infrastructure:** Docker, Docker Compose
* **AI Integration:** Google Gemini API (for post summarization)

## ✨ Features

* **User Authentication:** Secure login/register flow with JWT.
* **CRUD Operations:** Create, Read, Update, and Delete posts.
* **AI Power:** Automatic summary generation for long posts using AI.
* **Responsive UI:** Modern frontend interface.
* **Containerized:** One-command setup for the entire environment.

## 🚀 How to Run (The Magic Command)

Prerequisites: You only need **Docker** installed.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/SengFong03/fastforum.git](https://github.com/SengFong03/fastforum.git)
    cd fastforum
    ```

2.  **Start the app:**
    ```bash
    docker-compose up --build
    ```

3.  **Access the application:**
    * **Frontend:** Open [http://localhost:5173](http://localhost:5173) in your browser.
    * **Backend Docs:** Open [http://localhost:8000/docs](http://localhost:8000/docs).
    * **Database:** Running on port `5432`.

## 📂 Project Structure

* `/backend` - FastAPI application logic.
* `/frontend` - React application source code.
* `docker-compose.yml` - Orchestration for API, DB, and Frontend.

---
*Created by Seng Fong*