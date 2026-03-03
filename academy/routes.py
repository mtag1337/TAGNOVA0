from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from .models import User
from . import db

main = Blueprint('main', __name__)

# 1. الصفحة الرئيسية (بوابة الدخول)
@main.route('/')
def home():
    # لو الطالب مسجل دخول أصلاً، وديه الداشبورد علطول ملوش لازمة يشوف صفحة الدخول
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('auth.html')

# 2. مسار إنشاء حساب جديد (Sign Up)
@main.route('/signup', methods=['POST'])
def signup():
    name = request.form.get('name')
    email = request.form.get('email').lower() # تحويل الإيميل لسمول لضمان عدم التكرار
    password = request.form.get('password')
    role = request.form.get('role', 'student')

    user = User.query.filter_by(email=email).first()
    if user:
        return "هذا البريد مسجل بالفعل! جرب تسجيل الدخول." 

    new_user = User(full_name=name, email=email, password=password, role=role)
    db.session.add(new_user)
    db.session.commit()
    
    # بعد ما يسجل، الموقع "يفتكره" فوراً ويدخله
    login_user(new_user, remember=True)
    return redirect(url_for('main.dashboard'))

# 3. مسار تسجيل الدخول (Login)
@main.route('/login', methods=['POST'])
def login():
    email = request.form.get('email').lower()
    password = request.form.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or user.password != password:
        return "بيانات غير صحيحة، حاول مرة أخرى."

    # تفعيل الجلسة (Session) للطالب ده
    login_user(user, remember=True)
    return redirect(url_for('main.dashboard'))

# 4. لوحة التحكم (المنطقة الآمنة)
@main.route('/dashboard')
@login_required # ممنوع الدخول لغير المسجلين
def dashboard():
    # بنبعت current_user للـ HTML عشان يعرض (اسمه، كورساته، إحصائياته) هو بس
    return render_template('dashboard.html', user=current_user)

# 5. تسجيل الخروج
@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.home'))
