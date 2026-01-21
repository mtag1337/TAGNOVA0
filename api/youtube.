const axios = require('axios');

exports.handler = async (event, context) => {
    // 1. إعداد الرؤوس (Headers) للسماح بالاتصال من أي مكان (حل مشكلة CORS)
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    };

    // 2. التعامل مع طلبات الاختبار (Preflight) التي يرسلها المتصفح
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: ""
        };
    }

    // 3. استلام الـ Video ID من الرابط (Query Parameters)
    const videoId = event.queryStringParameters.videoId;
    
    // جلب المفتاح من إعدادات Netlify (Environment Variables) لضمان الأمان
    const API_KEY = process.env.PAGESPEED_API_KEY;

    // التحقق من وجود المعرف
    if (!videoId) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'برجاء إدخال رابط فيديو أو معرف (Video ID) صحيح.' })
        };
    }

    try {
        // 4. طلب البيانات من Google YouTube API
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet,statistics`;
        const response = await axios.get(apiUrl);

        // التحقق من وجود بيانات للفيديو
        if (!response.data.items || response.data.items.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'لم يتم العثور على الفيديو. تأكد من صحة الرابط.' })
            };
        }

        // 5. إرسال بيانات الفيديو بنجاح
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data.items[0])
        };

    } catch (error) {
        // في حالة حدوث خطأ في الشبكة أو في مفتاح الـ API
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'فشل في الاتصال بخدمة يوتيوب.', 
                details: error.message 
            })
        };
    }
};
