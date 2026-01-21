const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    const apiKey = process.env.PAGESPEED_API_KEY; 

    // فحص إضافي: هل المفتاح واصل للسيرفر؟
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'خطأ في الإعدادات', 
            details: 'المفتاح (API Key) غير موجود في إعدادات Vercel. تأكد من إضافة PAGESPEED_API_KEY وعمل Redeploy.' 
        });
    }

    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        const googleApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=performance`;
        
        const response = await axios.get(googleApiUrl);

        const isHttps = url.startsWith('https://');
        const finalData = response.data;
        finalData.securityReport = {
            safe: isHttps,
            message: isHttps ? "✅ الرابط آمن ومشفر." : "⚠️ تحذير: الرابط غير مشفر (HTTP)."
        };

        return res.status(200).json(finalData);

    } catch (error) {
        // إذا جوجل أعطت 429 رغم وجود المفتاح، قد يكون الحساب عليه قيود
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message;
        
        return res.status(status).json({ 
            error: 'فشل التحليل من جوجل', 
            details: message 
        });
    }
};
