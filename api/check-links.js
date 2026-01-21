const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // 1. جلب محتوى الصفحة الأساسية
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const links = [];
        
        // 2. استخراج كل الروابط (<a> tags)
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('http')) {
                links.push(href);
            }
        });

        // حذف الروابط المكررة لسرعة الفحص
        const uniqueLinks = [...new Set(links)].slice(0, 15); // فحص أول 15 رابط فقط لتجنب بطء Vercel

        // 3. فحص حالة كل رابط
        const results = await Promise.all(uniqueLinks.map(async (link) => {
            try {
                const head = await axios.head(link, { timeout: 5000 });
                return { url: link, status: head.status, ok: true };
            } catch (err) {
                return { url: link, status: err.response?.status || 'Error', ok: false };
            }
        }));

        return res.status(200).json({
            success: true,
            total: uniqueLinks.length,
            links: results
        });

    } catch (error) {
        return res.status(500).json({ error: 'فشل الوصول للموقع', details: error.message });
    }
};
