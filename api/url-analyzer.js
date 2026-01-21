const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    const apiKey = process.env.PAGESPEED_API_KEY;

    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // 1. فحص الأمان المبدئي (بسيط)
        const suspiciousKeywords = ['bit.ly', 't.co', 'shorte.st', 'virus', 'malware', 'login-update'];
        const isSuspicious = suspiciousKeywords.some(keyword => url.toLowerCase().includes(keyword));

        // 2. طلب بيانات الأداء من جوجل
        const googleApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=performance`;
        const response = await axios.get(googleApiUrl);

        // 3. إضافة نتيجة فحص الأمان للرد
        const finalData = response.data;
        finalData.securityCheck = {
            isSafe: !isSuspicious,
            message: isSuspicious ? "⚠️ تنبيه: هذا الرابط قد يكون مشبوهاً أو يستخدم خدمة اختصار روابط." : "✅ الرابط يبدو آمناً للاستخدام."
        };

        return res.status(200).json(finalData);
    } catch (error) {
        return res.status(500).json({ error: 'فشل التحليل', details: error.message });
    }
};
