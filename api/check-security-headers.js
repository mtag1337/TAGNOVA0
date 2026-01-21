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
            headers: { 'User-Agent': 'TajNova-Security-Scanner/1.0' },
            timeout: 10000,
            validateStatus: false
        });

        const respHeaders = response.headers;
        const securityChecks = [
            { name: 'Strict-Transport-Security', rec: 'يجب تفعيل HSTS لإجبار الاتصال الآمن HTTPS.' },
            { name: 'Content-Security-Policy', rec: 'يمنع هجمات XSS عن طريق تحديد مصادر المحتوى الموثوقة.' },
            { name: 'X-Frame-Options', rec: 'يحمي من هجمات Clickjacking بمنع عرض الموقع داخل iFrame.' },
            { name: 'X-Content-Type-Options', rec: 'يمنع المتصفح من تخمين نوع الملفات (MIME sniffing).' },
            { name: 'Referrer-Policy', rec: 'يتحكم في مقدار المعلومات المرسلة في رابط الإحالة.' },
            { name: 'Permissions-Policy', rec: 'يحدد الميزات التي يمكن للمتصفح استخدامها (مثل الكاميرا).' }
        ];

        let secureCount = 0;
        const results = securityChecks.map(check => {
            const value = respHeaders[check.name.toLowerCase()];
            const isPresent = !!value;
            if (isPresent) secureCount++;

            return {
                name: check.name,
                status: isPresent ? 'Present (Good)' : 'Missing (At Risk)',
                value: value || 'لا يوجد قيمة مرصودة',
                recommendation: isPresent ? 'الإعداد سليم.' : check.rec
            };
        });

        const percentage = ((secureCount / securityChecks.length) * 100).toFixed(0);

        return res.status(200).json({
            status: 'success',
            targetUrl: url,
            score: `${secureCount} / ${securityChecks.length}`,
            percentage: percentage,
            headers: results
        });

    } catch (error) {
        return res.status(200).json({ 
            status: 'error', 
            error: 'تعذر الوصول للموقع', 
            details: 'تأكد من صحة الرابط أو أن الموقع يسمح بالفحص.' 
        });
    }
};
