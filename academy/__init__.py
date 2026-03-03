from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager  # ضفنا الحارس هنا
import os

# تعريف قاعدة البيانات ككائن عالمي
db = SQLAlchemy()

def create_app():
    app = Flask(__name__, 
                template_folder=os.path.dirname(os.path.abspath(__file__)), 
                static_folder=os.path.dirname(os.path.abspath(__file__)))

    # إعدادات قاعدة البيانات
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base_dir, '../tajnova.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'tajnova_beast_mode_99'

    # ربط قاعدة البيانات بالتطبيق
    db.init_app(app)

    # --- بداية نظام الحماية (Login Manager) ---
    login_manager = LoginManager()
    login_manager.login_view = 'main.home' # لو حد حاول يدخل الداشبورد بدون حساب هيرجعه للهوم
    login_manager.init_app(app)

    # دالة تحميل المستخدم عشان الموقع يفضل فاكره
    from .models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    # --- نهاية نظام الحماية ---

    with app.app_context():
        # استدعاء الجداول
        from . import models 
        # الأمر السحري لبناء الداتا بيز
        db.create_all() 
        
        # ربط المسارات (Routes)
        from . import routes
        app.register_blueprint(routes.main)

    return app
