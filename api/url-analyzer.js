const axios = require('axios');

module.exports = async (req, res) => {
    // إعدادات الوصول (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    const apiKey = process.env.PAGESPEED_API_KEY;

    if (!url) return res.status(400).json({ error: 'الرجاء إدخال رابط صالح' });

    try {
        // 1. منطق فحص الأمان
        const suspiciousKeywords = ['bit.ly', 't.co', 'shorte.st', 'virus', 'malware', 'login-update'];
        const isSuspicious = suspiciousKeywords.some(keyword => url.toLowerCase().includes(keyword));
        const isHttps = url.startsWith('https://');

        // 2. طلب البيانات من Google PageSpeed
        // أضفنا شرطاً لاستخدام المفتاح إذا وجد، وإذا لم يوجد سيحاول النظام الطلب بدونه (ولكن بحدود ضيقة جداً)
        const googleApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}${apiKey ? `&key=${apiKey}` : ''}&category=performance`;
        
        const response = await axios.get(googleApiUrl);

        // 3. دمج النتائج
        const finalData = response.data;
        finalData.securityReport = {
            safe: !isSuspicious && isHttps,
            isHttps: isHttps,
            message: isSuspicious 
                ? "⚠️ تنبيه: الرابط يحتوي كلمات مشبوهة أو خدمة اختصار." 
                : (isHttps ? "✅ الرابط آمن ومشفر." : "⚠️ تحذير: الرابط لا يستخدم بروتوكول HTTPS.")
        };

        return res.status(200).json(finalData);

    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);

        // التعامل مع خطأ تجاوز الطلبات 429
        if (error.response && error.response.status === 429) {
            return res.status(429).json({ 
                error: 'تجاوزت حد الطلبات المسموح به (Rate Limit).',
                details: 'جوجل تفرض حداً للطلبات. يرجى إضافة API Key في إعدادات Vercel أو المحاولة لاحقاً.' 
            });
        }

        return res.status(500).json({ 
            error: 'حدث خطأ أثناء الاتصال بخدمة جوجل.', 
            details: error.response?.data?.error?.message || error.message 
        });
    }
};
