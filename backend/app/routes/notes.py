from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import Note, Material, User
from ..dependencies import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])


class NoteCreate(BaseModel):
    material_id: int
    text: str


@router.get("/material/{material_id}")
def get_note(
    material_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Получить заметку к материалу"""
    note = db.query(Note).filter(
        Note.user_id == user.id,
        Note.material_id == material_id
    ).first()
    
    if not note:
        return None
    
    return {
        "id": note.id,
        "material_id": note.material_id,
        "text": note.text,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }


@router.post("/")
def save_note(
    data: NoteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Сохранить заметку (создать или обновить)"""
    material = db.query(Material).filter(Material.id == data.material_id).first()
    if not material:
        raise HTTPException(404, "Материал не найден")
    
    note = db.query(Note).filter(
        Note.user_id == user.id,
        Note.material_id == data.material_id
    ).first()
    
    if note:
        note.text = data.text
        db.commit()
        db.refresh(note)
    else:
        note = Note(
            user_id=user.id,
            material_id=data.material_id,
            text=data.text
        )
        db.add(note)
        db.commit()
        db.refresh(note)
    
    return {
        "id": note.id,
        "material_id": note.material_id,
        "text": note.text,
        "updated_at": note.updated_at,
    }


@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Удалить заметку"""
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()
    
    if not note:
        raise HTTPException(404, "Заметка не найдена")
    
    db.delete(note)
    db.commit()
    return {"message": "Удалено"}


@router.get("/my")
def get_all_notes(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Все заметки студента"""
    notes = db.query(Note).filter(Note.user_id == user.id).all()
    
    result = []
    for n in notes:
        material = db.query(Material).filter(Material.id == n.material_id).first()
        result.append({
            "id": n.id,
            "material_id": n.material_id,
            "material_title": material.title if material else "",
            "material_type": material.type if material else "",
            "group_id": material.group_id if material else None,
            "text": n.text,
            "updated_at": n.updated_at,
        })
    
    return result