from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, oauth2
from ..database import get_db
from app.services.ai_service import generate_summary

router = APIRouter(
    prefix="/ai",
    tags=["AI Features"],
)

@router.post("/summarize/{post_id}")
def summarize_post(
    post_id: int, 
    db: Session = Depends(get_db), 
    current_user: int = Depends(oauth2.get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} does not exist",
        )
    
    if post.ai_summary:
        return {"post_id": post_id, "summary": post.ai_summary}
    
    # Call to AI service to summarize the post content
    summary = generate_summary(title=post.title, content=post.content)

    post.ai_summary = summary
    db.add(post)     # 标记修改
    db.commit()      # 提交保存
    db.refresh(post) # 刷新数据

    return {"post_id": post_id, "summary": summary}