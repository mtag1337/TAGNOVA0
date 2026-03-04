from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os

db = SQLAlchemy()

def create_app():
    # 1. تعريف التطبيق ببساطة (Vercel بيعرف المسارات لوحده)
    app = Flask(__name__)

    # 2. إعدادات قاعدة البيانات - المسار الوحيد المسموح في Vercel هو /tmp/
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/tajnova.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'tajnova_beast_mode_99'

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'main.home'
    login_manager.init_app(app)

    from .models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    with app.app_context():
        from . import models 
        from . import routes
        
     try:
            db.create_all()
        except:
            pass # لو موجودة أو فيها مشكلة، كمل متبوظش الموقع
            
        app.register_blueprint(routes.main)

    return app
