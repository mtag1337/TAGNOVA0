import os
import sys

# السطر ده "إجباري" لـ Vercel عشان يشوف مجلد academy اللي جنبه
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from academy import create_app

app = create_app()
application = app

if __name__ == '__main__':
    app.run()
