const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ status: 'error', error: 'الرابط مطلوب' });

    try {
        const response = await axios.get(url, {
            headers: { 
                // تم تحديثه ليبدو كمتصفح Chrome حقيقي 100%
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 10000,
            validateStatus: false // مهم جداً: لكي لا ينهار السيرفر إذا كانت الصفحة محمية
        });

        // إذا كانت الاستجابة HTML رغم أننا نتوقع بيانات، فهذا يعني حجب
        if (typeof response.data === 'string' && response.data.includes('<html')) {
             // سنحاول استخراج الرؤوس حتى لو كانت الصفحة محجوبة (لأن الرؤوس تسبق المحتوى)
             // ولكننا سنبلغ المستخدم أن هناك حماية
        }

        const respHeaders = response.headers;
        const securityChecks = [
            { name: 'Strict-Transport-Security', rec: 'تشفير HSTS.' },
            { name: 'Content-Security-Policy', rec: 'حماية CSP.' },
            { name: 'X-Frame-Options', rec: 'منع الـ iFrame.' },
            { name: 'X-Content-Type-Options', rec: 'منع الـ Sniffing.' },
            { name: 'Referrer-Policy', rec: 'سياسة الإحالة.' },
            { name: 'Permissions-Policy', rec: 'صلاحيات المتصفح.' }
        ];

        let secureCount = 0;
        const results = securityChecks.map(check => {
            const value = respHeaders[check.name.toLowerCase()];
            if (value) secureCount++;
            return {
                name: check.name,
                status: value ? 'Present (Good)' : 'Missing (At Risk)',
                value: value || 'مفقود',
                recommendation: value ? 'سليم' : check.rec
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
        // نضمن دائماً إرسال JSON حتى في حالة الفشل التام
        return res.status(200).json({ 
            status: 'error', 
            error: 'تعذر الاتصال', 
            details: 'الموقع المستهدف يمنع أدوات الفحص التلقائي.' 
        });
    }
};
