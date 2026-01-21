const sharp = require('sharp');
const formidable = require('formidable');
const fs = require('fs');

export const config = {
  api: { bodyParser: false }, // لتعطيل معالج النصوص الافتراضي وقبول ملفات الصور
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: 'خطأ في رفع الصورة' });

        const imageFile = files.image[0] || files.image; // معالجة اختلاف إصدارات formidable
        
        try {
            // معالجة الصورة باستخدام Sharp
            const optimizedBuffer = await sharp(imageFile.filepath)
                .webp({ quality: 80 }) // التحويل لصيغة WebP مع ضغط بنسبة 80%
                .toBuffer();

            // إرسال الصورة المحسنة مباشرة كملف
            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Content-Disposition', 'attachment; filename=tajnova-optimized.webp');
            return res.send(optimizedBuffer);

        } catch (error) {
            return res.status(500).json({ error: 'فشل في تحويل الصورة' });
        }
    });
};
