from academy import create_app

# Vercel بيدور على متغير اسمه app أو application بره أي Condition
app = create_app()

# السطر ده اختياري بس بيساعد في حل المشاكل لو حصلت
application = app 

if __name__ == '__main__':
    # ده هيفضل شغال لو جربت تشغل الملف من جهازك
    app.run(debug=True)
