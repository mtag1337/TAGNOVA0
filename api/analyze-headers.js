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
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            },
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: false // لكي لا ينهار السيرفر إذا كان الكود 404 أو 500
        });

        const headersArray = Object.keys(response.headers).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1), // تحسين شكل الاسم
            value: response.headers[key]
        }));

        return res.status(200).json({
            success: true,
            initialUrl: url,
            finalUrl: response.request.res.responseUrl || url,
            statusCode: response.status,
            statusText: response.statusText || 'Unknown',
            headers: headersArray
        });

    } catch (error) {
        return res.status(200).json({
            success: false,
            error: 'فشل تحليل الرؤوس',
            details: 'الموقع المستهدف رفض الاتصال أو الرابط غير صحيح.'
        });
    }
};
