const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    // هنا يتم سحب المفتاح تلقائياً من إعدادات Vercel اللي عملناها فوق
    const apiKey = process.env.PAGESPEED_API_KEY; 

    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // نرسل المفتاح لجوجل ليعرفوا أن هذا الطلب تابع لمشروعك الموثق
        const googleApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=performance`;
        
        const response = await axios.get(googleApiUrl);

        // فحص الأمان البسيط
        const isHttps = url.startsWith('https://');
        const finalData = response.data;
        finalData.securityReport = {
            safe: isHttps,
            message: isHttps ? "✅ الرابط آمن ومشفر." : "⚠️ تحذير: الرابط غير مشفر (HTTP)."
        };

        return res.status(200).json(finalData);

    } catch (error) {
        // في حال حدوث خطأ، سنظهر لك السبب الحقيقي
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message;
        return res.status(status).json({ error: 'فشل التحليل', details: message });
    }
};
