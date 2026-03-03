from academy import create_app

# إحنا بننادي على الوظيفة اللي بتبني المنصة من جوه الأساس (academy)
app = create_app()

if __name__ == '__main__':
    print("---")
    print("🚀 TajNova is starting...")
    print("🌍 Open your browser at: http://127.0.0.1:5000")
    print("---")
    
    # تشغيل السيرفر في وضع التطوير (Debug Mode) 
    # ده بيخلي أي تعديل تعمله في الكود يتحدث فوراً من غير ما تقفل السيرفر
    app.run(debug=True, port=5000)
