from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from .models import User
from . import db

main = Blueprint('main', __name__)

# 1. الصفحة الرئيسية (بوابة الدخول)
@main.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('auth.html')

# 2. مسار إنشاء حساب جديد (Sign Up)
@main.route('/signup', methods=['POST'])
def signup():
    name = request.form.get('name')
    email = request.form.get('email').lower().strip()
    password = request.form.get('password')
    role = request.form.get('role', 'student')

    user = User.query.filter_by(email=email).first()
    if user:
        return "هذا البريد مسجل بالفعل! جرب تسجيل الدخول." 

    try:
        new_user = User(full_name=name, email=email, password=password, role=role)
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user, remember=True)
        return redirect(url_for('main.dashboard'))
    except Exception as e:
        db.session.rollback()
        return f"خطأ أثناء التسجيل: {str(e)}"

# 3. مسار تسجيل الدخول (Login) - حل مشكلة الـ 500
@main.route('/login', methods=['POST'])
def login():
    email = request.form.get('email').lower().strip()
    password = request.form.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or user.password != password:
        return "بيانات غير صحيحة، حاول مرة أخرى."

    try:
        # تسجيل الدخول وتثبيت الجلسة
        login_user(user, remember=True)
        return redirect(url_for('main.dashboard'))
    except Exception as e:
        return f"خطأ في السيرفر أثناء تسجيل الدخول: {str(e)}"

# 4. لوحة التحكم (المنطقة الآمنة)
@main.route('/dashboard')
@login_required 
def dashboard():
    return render_template('dashboard.html', user=current_user)

# 5. تسجيل الخروج
@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.home'))
