from flask import Blueprint, render_template

# تعريف الـ Blueprint اللي هيجمع كل المسارات
main = Blueprint('main', __name__)

@main.route('/')
def home():
    # هيفتح صفحة الدخول اللي موجودة في academy مباشرة
    return render_template('auth.html')

@main.route('/dashboard')
def dashboard():
    # لوحة الطالب
    return render_template('dashboard.html')

@main.route('/instructor')
def instructor():
    # لوحة المدرب (اليوتيوبر)
    return render_template('instructor.html')

@main.route('/player')
def player():
    # مشغل الفيديوهات
    return render_template('player.html')

@main.route('/admin')
def admin():
    # لوحة التحكم الخاصة بيك (المدير)
    return render_template('admin.html')
