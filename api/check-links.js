const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // 1. جلب محتوى الصفحة
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const links = [];
        
        // 2. استخراج الروابط وتصحيحها
        $('a').each((i, el) => {
            let href = $(el).attr('href');
            if (href && href.startsWith('http')) {
                links.push(href);
            } else if (href && href.startsWith('/')) {
                // تحويل الروابط النسبية لروابط كاملة
                const root = new URL(url).origin;
                links.push(root + href);
            }
        });

        // فحص أول 10 روابط فقط لتجنب تجاوز وقت Vercel المسموح (10 ثواني)
        const uniqueLinks = [...new Set(links)].slice(0, 10);

        // 3. فحص حالة الروابط
        const results = await Promise.all(uniqueLinks.map(async (link) => {
            try {
                const check = await axios.get(link, { timeout: 5000, validateStatus: false });
                return {
                    url: link,
                    status: check.status,
                    statusText: check.statusText,
                    ok: check.status >= 200 && check.status < 400,
                    type: check.status >= 200 && check.status < 400 ? 'Success (2xx/3xx)' : 'Broken (4xx/5xx)'
                };
            } catch (err) {
                return {
                    url: link,
                    status: err.response?.status || 'Error',
                    statusText: 'Failed',
                    ok: false,
                    type: 'Broken (Error)'
                };
            }
        }));

        return res.status(200).json({
            success: true,
            totalLinks: uniqueLinks.length,
            results: results
        });

    } catch (error) {
        console.error(error);
        return res.status(200).json({ 
            error: true, 
            details: 'تعذر الوصول للموقع المستهدف أو استخراج الروابط منه.' 
        });
    }
};
