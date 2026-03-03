from flask import Blueprint, render_template, request, redirect, url_for, flash
from .models import User
from . import db

main = Blueprint('main', __name__)

@main.route('/')
def home():
    return render_template('auth.html')

# --- مسار إنشاء حساب جديد ---
@main.route('/signup', methods=['POST'])
def signup():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')
    role = request.form.get('role', 'student')

    user = User.query.filter_by(email=email).first()
    if user:
        return "هذا البريد مسجل بالفعل!" 

    new_user = User(full_name=name, email=email, password=password, role=role)
    db.session.add(new_user)
    db.session.commit()
    return redirect(url_for('main.dashboard'))

# --- مسار تسجيل الدخول (الجديد) ---
@main.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    # البحث عن المستخدم
    user = User.query.filter_by(email=email).first()

    # التأكد من وجود المستخدم وصحة الباسورد
    if not user or user.password != password:
        return "خطأ في الإيميل أو كلمة المرور!"

    # لو كله تمام، وّديه للداشبورد
    return redirect(url_for('main.dashboard'))

@main.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')
