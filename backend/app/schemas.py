from typing import Optional, Literal, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from pydantic.types import conint


class PostBase(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    published: bool = True

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: int
    created_at: datetime
    owner_id: int
    owner: 'UserResponse'   # Forward reference
    comments: List['CommentResponse'] = []
    ai_summary: Optional[str] = None

    model_config = {
        "from_attributes": True     #orm_mode = True
    }

class PostOut(BaseModel):
    Post: PostResponse
    votes: int
    is_liked : bool = False
    model_config = {
        "from_attributes": True     #orm_mode = True
    }

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    model_config = {
        "from_attributes": True     #orm_mode = True
    }

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[str] = None


class Vote(BaseModel):
    post_id: int
    dir: Literal[1, 0]  # 1 for upvote, 0 for removing vote

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    post_id: int
    pass

class CommentResponse(CommentBase):
    id: int
    created_at: datetime
    post_id: int
    user_id: int
    owner: UserResponse

    model_config = {
        "from_attributes": True     #orm_mode = True
    }