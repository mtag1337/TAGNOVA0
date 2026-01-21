const axios = require('axios');

module.exports = async (req, res) => {
    // 1. إعداد الرؤوس (Headers) بنظام Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    // 2. التعامل مع طلبات OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. استلام الـ Video ID (في فيرسيل نستخدم req.query)
    const { videoId } = req.query;
    const API_KEY = process.env.PAGESPEED_API_KEY;

    if (!videoId) {
        return res.status(400).json({ error: 'برجاء إدخال رابط فيديو أو معرف (Video ID) صحيح.' });
    }

    try {
        // 4. طلب البيانات من Google YouTube API
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet,statistics`;
        const response = await axios.get(apiUrl);

        if (!response.data.items || response.data.items.length === 0) {
            return res.status(404).json({ error: 'لم يتم العثور على الفيديو. تأكد من صحة الرابط.' });
        }

        // 5. إرسال بيانات الفيديو بنجاح
        return res.status(200).json(response.data.items[0]);

    } catch (error) {
        return res.status(500).json({ 
            error: 'فشل في الاتصال بخدمة يوتيوب.', 
            details: error.message 
        });
    }
};
