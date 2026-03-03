from . import db
from flask_login import UserMixin
from datetime import datetime

# 1. جدول المستخدمين (طلاب، مدربين، أدمن)
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False) # الـ Unique يمنع تكرار الحسابات
    password = db.Column(db.String(200), nullable=False) # الباسورد هيتخزن مشفر (أمان عالي)
    role = db.Column(db.String(20), default='student') # رتبة المستخدم
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # علاقة لربط الطالب بالكورسات اللي اشتراها
    enrollments = db.relationship('Enrollment', backref='student', lazy=True)

# 2. جدول الكورسات (اللي بيرفعها المدربين)
class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, default=0.0)
    thumbnail = db.Column(db.String(300)) # صورة الكورس
    instructor_id = db.Column(db.Integer, db.ForeignKey('user.id')) # مين المدرب؟
    
    # علاقة لجلب الدروس التابعة للكورس ده بس
    lessons = db.relationship('Lesson', backref='course', lazy=True)

# 3. جدول الدروس (الفيديوهات)
class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    video_url = db.Column(db.String(500)) # لينك الفيديو المشفر
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))

# 4. جدول التسجيل (مين معاه كورس إيه؟)
class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    progress = db.Column(db.Integer, default=0) # الطالب خلص كام % من الكورس
