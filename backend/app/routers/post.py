from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, Response
from sqlalchemy.orm import Session
from .. import models, schemas, oauth2
from ..database import get_db
from sqlalchemy import func

router = APIRouter(
    prefix="/posts",  # remove duplication of /posts in each path
    tags=["Posts"],  # add tags for better documentation
)


# @router.get("/", response_model=List[schemas.PostResponse])
@router.get("/", response_model=List[schemas.PostOut])
def get_posts(
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user),
    limit: int = 10,
    skip: int = 0,
    search: Optional[str] = "",
):

    # Using raw SQL
    # cursor.execute("SELECT * FROM posts")
    # posts = cursor.fetchall()

    # Using SQLAlchemy ORM
    # posts = (
    #     db.query(models.Post)
    #     .filter(models.Post.title.contains(search))
    #     .limit(limit)
    #     .offset(skip)
    #     .all()
    # )

    # SQL = SELECT posts.*, COUNT(votes.post_id) AS votes
    #       FROM posts LEFT JOIN votes ON posts.id = votes.post_id
    #       GROUP BY posts.id
    results = (
        db.query(models.Post, func.count(models.Vote.post_id).label("votes"))
        .join(models.Vote, models.Vote.post_id == models.Post.id, isouter=True)
        .group_by(models.Post.id)
        .filter(models.Post.title.contains(search))
        .order_by(models.Post.id.desc())
        .limit(limit)
        .offset(skip)
        .all()
    )
    if not results:
        return []
    
    # Get the post IDs from the current page results
    current_page_post_ids = [post[0].id for post in results]

    # Query to get votes by the current user for these posts
    my_votes_query = (
        db.query(models.Vote.post_id)
        .filter(
            models.Vote.post_id.in_(current_page_post_ids),
            models.Vote.user_id == current_user.id
        )
        .all()
    )

    # Extract post IDs from the query result
    my_voted_ids = {vote[0] for vote in my_votes_query}    

    # Prepare the final response combining posts, votes, and is_liked
    final_response = []
    
    # Build the response list
    for post_obj, votes_count in results:
        final_response.append({
            "Post": post_obj,
            "votes": votes_count,
            # 🌟 核心判断：如果这个帖子的 ID 在我的点赞集合里，就是 True
            "is_liked": post_obj.id in my_voted_ids
        })

    return final_response
    

    # Using SQLAlchemy ORM to get posts for the current user only
    # posts = db.query(models.Post).filter(models.Post.owner_id == current_user.id).all()
    # return posts


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=schemas.PostResponse
)
def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user),
):

    # Using Raw SQL
    # cursor.execute(
    #     "INSERT INTO posts (title, content, published) VALUES (%s, %s, %s) RETURNING *",
    #     (post.title, post.content, post.published),
    # )
    # new_post = cursor.fetchone()

    # conn.commit()

    # TODO: 等做完登录功能后，记得把 owner_id 改回 current_user.id
    # Using SQLAlchemy ORM
    # .dict()
    new_post = models.Post(
        owner_id=current_user.id, **post.model_dump()
    )  # Unpacking the post data
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("/{id}", response_model=schemas.PostOut)
def get_post(
    id: int,
    db: Session = Depends(get_db),
    # current_user: int = Depends(oauth2.get_current_user),
):

    # Using raw SQL
    # cursor.execute("SELECT * FROM posts WHERE id = %s", (str(id),))
    # post = cursor.fetchone()

    # Using SQLAlchemy ORM
    # post = db.query(models.Post).filter(models.Post.id == id).first()

    post = (
        db.query(models.Post, func.count(models.Vote.post_id).label("votes"))
        .join(models.Vote, models.Vote.post_id == models.Post.id, isouter=True)
        .group_by(models.Post.id)
        .filter(models.Post.id == id)
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id: {id} was not found",
        )
    return post


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user),
):

    # Using raw SQL
    # cursor.execute("DELETE FROM posts WHERE id = %s RETURNING *", (str(id),))
    # deleted_post = cursor.fetchone()
    # conn.commit()

    # Using SQLAlchemy ORM
    post_query = db.query(models.Post).filter(models.Post.id == id)  # Returns the query

    post = post_query.first()  # Execute the query

    if post == None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id: {id} does not exist",
        )

    # TODO: Enable this after implementing authentication
    if post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform requested action",
        )

    post_query.delete(synchronize_session=False)  # Execute the delete

    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{id}", response_model=schemas.PostResponse)
def update_post(
    id: int,
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user),
):

    # # Using raw SQL
    # cursor.execute(
    #     "UPDATE posts SET title = %s, content = %s, published = %s WHERE id = %s RETURNING *",
    #     (post.title, post.content, post.published, str(id)),
    # )
    # updated_post = cursor.fetchone()
    # conn.commit()

    # Using SQLAlchemy ORM
    post_query = db.query(models.Post).filter(models.Post.id == id)

    updated_post = post_query.first()

    if updated_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id: {id} does not exist",
        )

    if updated_post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform requested action",
        )

        # .dict()
    post_query.update(post.model_dump(), synchronize_session=False)
    db.commit()
    return post_query.first()
