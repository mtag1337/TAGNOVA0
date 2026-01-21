const axios = require('axios');

module.exports = async (req, res) => {
    // 1. إعدادات CORS للسماح لموقعك بالاتصال بالـ API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // التعامل مع طلبات التشييك المسبق (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. التحقق من أن الطلب من نوع POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'الطريقة غير مسموح بها، استخدم POST' });
    }

    const { url } = req.body;

    // 3. التحقق من وجود الرابط
    if (!url) {
        return res.status(400).json({ error: 'الرابط مطلوب' });
    }

    try {
        // 4. محاولة جلب ملف robots.txt مع وضع User-Agent لتبدو كمتصفح حقيقي
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TajNovaBot/1.0; +https://tagnova-0.vercel.app/)',
                'Accept': 'text/plain'
            },
            timeout: 10000 // مهلة 10 ثوانٍ للجلب
        });

        // 5. إرسال المحتوى في حال النجاح
        return res.status(200).json({
            status: 'success',
            url: url,
            content: response.data
        });

    } catch (error) {
        // 6. التعامل مع الأخطاء المختلفة
        if (error.response) {
            // الموقع رد ولكن بخطأ (مثل 404 غير موجود)
            if (error.response.status === 404) {
                return res.status(200).json({
                    status: 'not_found',
                    url: url,
                    content: '# تنبيه: هذا الموقع لا يمتلك ملف robots.txt (خطأ 404)'
                });
            }
            return res.status(error.response.status).json({
                error: 'فشل جلب الملف',
                details: `الموقع رد بالكود: ${error.response.status}`
            });
        } else if (error.request) {
            // الطلب أرسل ولكن لم يصل رد (مشكلة اتصال أو حظر)
            return res.status(504).json({
                error: 'فشل الاتصال',
                details: 'الموقع المستهدف لم يستجب أو قام بحظر الاتصال.'
            });
        } else {
            // خطأ آخر في الإعدادات
            return res.status(500).json({
                error: 'خطأ داخلي',
                details: error.message
            });
        }
    }
};
