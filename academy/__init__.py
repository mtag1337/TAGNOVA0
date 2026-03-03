from flask import Flask
import os

def create_app():
    # بنحدد المسار اللي فيه الملفات بتاعتك (HTML واللوجو)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # "لفل الوحش": بنخبر Flask إن ملفات الـ HTML والـ Static موجودين في academy مباشرة
    app = Flask(__name__, 
                template_folder=base_dir, 
                static_folder=base_dir)

    app.config['SECRET_KEY'] = 'tajnova_beast_key_2024'

    # بننادي على المسارات (Routes) اللي هتفتح الصفحات
    from .routes import main
    app.register_blueprint(main)

    return app
