from flask import Blueprint, render_template, redirect, url_for

main = Blueprint('main', __name__)

# 1. الصفحة الرئيسية (بوابة الدخول)
@main.route('/')
@main.route('/auth')
def home():
    # بنفتح صفحة الـ auth اللي فيها كود Firebase العالمي
    return render_template('auth.html')

# 2. لوحة تحكم الطالب
@main.route('/dashboard')
def dashboard():
    # Firebase في الـ HTML هو اللي هيتأكد لو الطالب مسجل ولا لا
    return render_template('dashboard.html')

# 3. لوحة تحكم المدرس (رفع الكورسات)
@main.route('/admin_dashboard')
def admin_dashboard():
    return render_template('admin_dashboard.html')

# 4. تسجيل الخروج (اختياري كـ Route)
@main.route('/logout')
def logout():
    return redirect(url_for('main.home'))
