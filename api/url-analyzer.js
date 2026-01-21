const axios = require('axios');

module.exports = async (req, res) => {
    // إعدادات الـ CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    const apiKey = process.env.PAGESPEED_API_KEY;

    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // نستخدم Axios مع إرسال المفتاح كـ Parameter واضح
        const response = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
            params: {
                url: url,
                key: apiKey, // هذا هو المفتاح الذي وضعته في Vercel
                category: 'performance'
            },
            timeout: 15000 // ننتظر حتى 15 ثانية لأن جوجل أحياناً تتأخر في التحليل
        });

        const isHttps = url.startsWith('https://');
        
        return res.status(200).json({
            ...response.data,
            securityReport: {
                safe: isHttps,
                message: isHttps ? "✅ الرابط آمن ومشفر." : "⚠️ تحذير: الرابط غير مشفر (HTTP)."
            }
        });

    } catch (error) {
        // إذا كان الخطأ 429 رغم وجود المفتاح، فهذا يعني أن هناك ضغط لحظي
        if (error.response && error.response.status === 429) {
            return res.status(429).json({ 
                error: 'ضغط كبير على الخدمة', 
                details: 'جوجل تطلب الانتظار قليلاً. يرجى المحاولة مرة أخرى بعد 30 ثانية.' 
            });
        }

        return res.status(error.response?.status || 500).json({ 
            error: 'فشل التحليل', 
            details: error.response?.data?.error?.message || error.message 
        });
    }
};
