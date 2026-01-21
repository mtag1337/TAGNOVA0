const axios = require('axios');

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // نقوم بعمل طلب HEAD لجلب الرؤوس فقط أو GET إذا لزم الأمر
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000,
            maxRedirects: 5 // تتبع التحويلات لمعرفة الرابط النهائي
        });

        // تحويل كائن الرؤوس إلى مصفوفة يسهل التعامل معها في الجدول
        const headersArray = Object.keys(response.headers).map(key => ({
            name: key,
            value: response.headers[key]
        }));

        return res.status(200).json({
            initialUrl: url,
            finalUrl: response.request.res.responseUrl || url,
            statusCode: response.status,
            statusText: response.statusText,
            headers: headersArray
        });

    } catch (error) {
        const status = error.response?.status || 500;
        return res.status(status).json({
            error: 'فشل تحليل الرؤوس',
            details: error.response?.statusText || error.message
        });
    }
};
