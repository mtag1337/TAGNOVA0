from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

# تعريف قاعدة البيانات ككائن عالمي
db = SQLAlchemy()

def create_app():
    app = Flask(__name__, 
                template_folder=os.path.dirname(os.path.abspath(__file__)), 
                static_folder=os.path.dirname(os.path.abspath(__file__)))

    # إعدادات قاعدة البيانات
    # هتبقى موجودة جوه فولدر TAGNOVA0 باسم tajnova.db
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base_dir, '../tajnova.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'tajnova_beast_mode_99'

    # ربط قاعدة البيانات بالتطبيق
    db.init_app(app)

    with app.app_context():
        # استدعاء الجداول اللي كتبناها في models.py
        from . import models 
        # الأمر السحري اللي بيبني ملف الـ .db فعلياً
        db.create_all() 
        
        # ربط المسارات (Routes)
        from . import routes
        app.register_blueprint(routes.main)

    return app
