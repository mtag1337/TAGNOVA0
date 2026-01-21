const axios = require('axios');

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ status: 'error', error: 'الرابط مطلوب' });

    try {
        const response = await axios.get(url, {
            headers: { 
                // محاكاة متصفح Chrome حقيقي بدقة عالية
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000,
            validateStatus: () => true // استخراج الرؤوس حتى لو كانت الحالة 403 أو 404
        });

        const respHeaders = response.headers;
        const securityChecks = [
            { name: 'Strict-Transport-Security', rec: 'تفعيل HSTS لحماية التشفير.' },
            { name: 'Content-Security-Policy', rec: 'تفعيل CSP لمنع هجمات XSS.' },
            { name: 'X-Frame-Options', rec: 'منع وضع الموقع في iFrame.' },
            { name: 'X-Content-Type-Options', rec: 'منع تخمين أنواع الملفات.' },
            { name: 'Referrer-Policy', rec: 'حماية بيانات الإحالة.' },
            { name: 'Permissions-Policy', rec: 'التحكم في ميزات المتصفح.' }
        ];

        let secureCount = 0;
        const results = securityChecks.map(check => {
            const value = respHeaders[check.name.toLowerCase()];
            if (value) secureCount++;
            return {
                name: check.name,
                status: value ? 'Present (Good)' : 'Missing (At Risk)',
                value: value || 'مفقود',
                recommendation: value ? 'الإعداد سليم.' : check.rec
            };
        });

        return res.status(200).json({
            status: 'success',
            targetUrl: url,
            score: `${secureCount} / 6`,
            percentage: ((secureCount / 6) * 100).toFixed(0),
            headers: results
        });

    } catch (error) {
        return res.status(200).json({ 
            status: 'error', 
            error: 'تعذر الاتصال', 
            details: 'الموقع المستهدف يمنع أدوات الفحص التلقائية تماماً.' 
        });
    }
};
