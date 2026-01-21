const sharp = require('sharp');
const { IncomingForm } = require('formidable');
const fs = require('fs');

// إعدادات Vercel لمعالجة الملفات المرفوعة
export const config = {
    api: {
        bodyParser: false, // ضروري جداً للسماح لـ formidable بمعالجة البيانات
    },
};

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'X-Original-Size, X-Optimized-Size');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'الطريقة غير مسموح بها' });
    }

    const form = new IncomingForm({ keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: 'خطأ أثناء رفع الصورة' });
        }

        // الوصول للملف (formidable v3 يستخدم مصفوفة للملفات)
        const file = Array.isArray(files.imageFile) ? files.imageFile[0] : files.imageFile;

        if (!file || !file.filepath) {
            return res.status(400).json({ error: 'لم يتم استلام أي ملف' });
        }

        try {
            const originalSize = file.size;
            
            // البدء في معالجة الصورة باستخدام Sharp
            const optimizedBuffer = await sharp(file.filepath)
                .webp({ quality: 75, effort: 4 }) // ضغط متوازن للجودة والحجم
                .toBuffer();

            // إرسال الأحجام في الرؤوس ليقرأها الفرونت إند
            res.setHeader('X-Original-Size', originalSize.toString());
            res.setHeader('X-Optimized-Size', optimizedBuffer.length.toString());
            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Content-Disposition', `attachment; filename="tajnova_${Date.now()}.webp"`);

            // إرسال الصورة النهائية
            return res.send(optimizedBuffer);

        } catch (error) {
            console.error('Sharp Error:', error);
            return res.status(500).json({ error: 'فشل في معالجة الصورة', details: error.message });
        } finally {
            // تنظيف الملفات المؤقتة من السيرفر
            if (file.filepath && fs.existsSync(file.filepath)) {
                fs.unlinkSync(file.filepath);
            }
        }
    });
};
