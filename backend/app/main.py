from fastapi import FastAPI, Request
from . import models
from .database import engine
from .routers import post, user, auth, vote, comment, ai
from .config import settings
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse

# Create the database tables
# Commented out to use Alembic for migrations
# models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# 1. 告诉 FastAPI：凡是找 /static 开头的，去 static 文件夹里拿
# 这一步是为了让浏览器能下载到 CSS 和 JS
app.mount("/static", StaticFiles(directory="static"), name="static")

# 2. 告诉 FastAPI：HTML 文件都在 templates 文件夹里
templates = Jinja2Templates(directory="templates")

origins = ["http://localhost:5173",
           "https://fastforum-frontend.onrender.com"]  # Allow all origins; adjust for production use
                 # e.g., ["https://yourdomain.com"] for specific domains

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(post.router)
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(vote.router)
app.include_router(comment.router)
app.include_router(ai.router)

@app.get("/")
async def read_root():
    return RedirectResponse(url="/login_page")

@app.get("/home")
async def view_home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login_page")
async def view_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register_page")
async def view_register(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})