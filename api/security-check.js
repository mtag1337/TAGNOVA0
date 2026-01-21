const axios = require('axios');

module.exports = async (req, res) => {
    // إعدادات الـ CORS لضمان قبول الطلبات من أي مكان (خاصة TajNova)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ status: 'error', error: 'الرابط مطلوب' });
    }

    try {
        // نستخدم axios لإجراء طلب "HEAD" أولاً للحصول على الرؤوس بسرعة وتجنب الحظر
        const response = await axios({
            method: 'get', // نستخدم get مع معالجة الرؤوس فقط لضمان أقصى توافق
            url: url,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 12000, // مهلة كافية للمواقع البطيئة
            maxRedirects: 5,
            validateStatus: () => true // استخراج الرؤوس حتى لو كانت الاستجابة 403 أو 404
        });

        const respHeaders = response.headers;
        
        // قائمة الفحوصات الأمنية
        const securityChecks = [
            { name: 'Strict-Transport-Security', rec: 'تفعيل HSTS لفرض اتصال HTTPS مشفر.' },
            { name: 'Content-Security-Policy', rec: 'تفعيل CSP لمنع حقن النصوص الخبيثة XSS.' },
            { name: 'X-Frame-Options', rec: 'منع هجمات Clickjacking عبر حظر الـ iFrame.' },
            { name: 'X-Content-Type-Options', rec: 'منع المتصفح من تخمين نوع الملفات MIME Sniffing.' },
            { name: 'Referrer-Policy', rec: 'التحكم في بيانات الإحالة المرسلة عند الانتقال لروابط أخرى.' },
            { name: 'Permissions-Policy', rec: 'إدارة صلاحيات المتصفح مثل الكاميرا والموقع الجغرافي.' }
        ];

        let secureCount = 0;
        const results = securityChecks.map(check => {
            const headerKey = check.name.toLowerCase();
            const value = respHeaders[headerKey];
            const isPresent = !!value;
            
            if (isPresent) secureCount++;

            return {
                name: check.name,
                status: isPresent ? 'Present (Good)' : 'Missing (At Risk)',
                value: value || 'غير موجود',
                recommendation: isPresent ? 'الإعداد سليم ومفعل.' : check.rec
            };
        });

        // إرسال النتيجة بتنسيق JSON نظيف
        return res.status(200).json({
            status: 'success',
            targetUrl: url,
            score: `${secureCount} / 6`,
            percentage: ((secureCount / 6) * 100).toFixed(0),
            headers: results
        });

    } catch (error) {
        console.error('Scan Error:', error.message);
        return res.status(200).json({ 
            status: 'error', 
            error: 'تعذر تحليل الموقع', 
            details: 'الموقع المستهدف يرفض اتصالات الفحص الآلية أو الرابط غير صحيح.' 
        });
    }
};
