const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'TajNova-Security-Scanner/1.0' },
            timeout: 10000,
            validateStatus: false
        });

        const headers = response.headers;
        const securityHeaders = [
            { name: 'Strict-Transport-Security', desc: 'تشفير الاتصال الدائم (HSTS)' },
            { name: 'Content-Security-Policy', desc: 'منع حقن النصوص الخبيثة (CSP)' },
            { name: 'X-Frame-Options', desc: 'حماية من هجمات Clickjacking' },
            { name: 'X-Content-Type-Options', desc: 'منع تخمين نوع الملفات' },
            { name: 'Referrer-Policy', desc: 'التحكم في معلومات الإحالة' },
            { name: 'Permissions-Policy', desc: 'التحكم في ميزات المتصفح (الكاميرا/الموقع)' }
        ];

        let score = 0;
        const results = securityHeaders.map(sh => {
            const value = headers[sh.name.toLowerCase()];
            if (value) score += 1;
            return {
                header: sh.name,
                description: sh.desc,
                value: value || 'مفقود ❌',
                status: value ? 'safe' : 'unsafe'
            };
        });

        // حساب التقييم النهائي
        const grade = score >= 5 ? 'A' : score >= 3 ? 'B' : score >= 1 ? 'C' : 'F';

        return res.status(200).json({
            success: true,
            url: url,
            grade: grade,
            score: score,
            total: securityHeaders.length,
            results: results
        });

    } catch (error) {
        return res.status(200).json({ success: false, error: 'فشل فحص الموقع' });
    }
};
