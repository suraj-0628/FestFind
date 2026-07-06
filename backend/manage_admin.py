"""CLI tool to manage admin users."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import User


def make_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email '{email}' not found")
            return
        user.is_admin = True
        user.role = "admin"
        db.commit()
        print(f"User '{user.name}' ({user.email}) is now an admin")
    finally:
        db.close()


def list_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.is_admin == True).all()
        if not admins:
            print("No admin users found")
            return
        for u in admins:
            print(f"  {u.name} <{u.email}> (active: {u.is_active})")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python manage_admin.py list          - List all admins")
        print("  python manage_admin.py add <email>   - Make user admin")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "list":
        list_admins()
    elif cmd == "add" and len(sys.argv) >= 3:
        make_admin(sys.argv[2])
    else:
        print("Invalid command")
