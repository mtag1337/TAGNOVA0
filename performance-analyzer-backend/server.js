// server.js - الكود النهائي المدمج والمصحح لـ 10 أدوات

require('dotenv').config(); 
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const sharp = require('sharp'); 
const multer = require('multer'); 
const path = require('path');
const fs = require('fs'); 

const app = express();
const port = 3000;

// تفعيل CORS والـ bodyParser
app.use(cors());
app.use(express.json());

const API_KEY = process.env.PAGESPEED_API_KEY; 

if (!API_KEY) {
    console.error("FATAL ERROR: PAGESPEED_API_KEY is not set in the .env file.");
    process.exit(1); 
} else {
    console.log("API Key loaded successfully.");
}

// ----------------------------------------------------
// 1. دالة تحليل PageSpeed Insights 
// ----------------------------------------------------
const analyzeUrlHandler = async (req, res) => {
    const url = req.body.url || req.query.url; 
    if (!url) return res.status(400).json({ error: 'URL is required in the request body/query.' });

    const apiUrl = 'https://www.googleapis.com/pagespeedinsights/v5/runPagespeed';
    const params = {
        url: url,
        key: API_KEY,
        strategy: 'desktop',
        category: ['performance', 'best-practices', 'seo'],
    };

    try {
        const response = await axios.get(apiUrl, { params });
        if (response.status === 200) {
            res.json(response.data);
        } else {
            res.status(500).json({ error: 'Failed to get data from Google PageSpeed Insights.', details: `API Status: ${response.status} - ${response.statusText}` });
        }
    } catch (error) {
        let statusCode = error.response ? error.response.status : 500;
        let errorMessage = error.response && error.response.data.error.message ? error.response.data.error.message : 'An unknown error occurred during API communication.';
        res.status(statusCode).json({ error: 'Analysis Failed (PageSpeed).', details: errorMessage });
    }
};

// ----------------------------------------------------
// 2. دالة تحليل YouTube Video Info 
// ----------------------------------------------------
const analyzeYoutubeVideoHandler = async (req, res) => {
    const videoId = req.body.videoId || req.query.videoId;
    if (!videoId) return res.status(400).json({ error: 'Video ID is required.' });

    const apiUrl = 'https://www.googleapis.com/youtube/v3/videos';
    const params = {
        id: videoId,
        key: API_KEY,
        part: 'snippet,statistics',
        fields: 'items(id,snippet(title,description,publishedAt,tags,categoryId,thumbnails),statistics(viewCount,likeCount,commentCount))',
    };

    try {
        const response = await axios.get(apiUrl, { params });
        if (response.status === 200 && response.data.items.length > 0) {
            res.json(response.data.items[0]); 
        } else if (response.status === 200 && response.data.items.length === 0) {
            res.status(404).json({ error: 'Video Not Found.', details: 'The provided Video ID is either incorrect or the video is private.' });
        } else {
            res.status(500).json({ error: 'Failed to get data from YouTube API.', details: `API Status: ${response.status} - ${response.statusText}` });
        }
    } catch (error) {
        const statusCode = error.response ? error.response.status : 500;
        let errorMessage = error.response && error.response.data.error.message ? error.response.data.error.message : 'Network or unknown error.';
        res.status(statusCode).json({ error: 'Analysis Failed (YouTube).', details: errorMessage });
    }
};

// ----------------------------------------------------
// 3. دالة جلب ملف Robots.txt
// ----------------------------------------------------
const fetchRobotsTxtHandler = async (req, res) => {
    const baseUrl = req.body.url || req.query.url;
    if (!baseUrl) return res.status(400).json({ error: 'Base URL is required.' });
    
    const normalizedUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const robotsTxtUrl = normalizedUrl + 'robots.txt';

    try {
        const response = await axios.get(robotsTxtUrl, {
            validateStatus: (status) => status >= 200 && status < 500, 
            responseType: 'text',
        });

        if (response.status === 200) {
            res.json({ status: 'success', content: response.data, url: robotsTxtUrl });
        } 
        else if (response.status === 404) {
             res.json({ status: 'not_found', content: 'ملف robots.txt غير موجود على هذا الرابط (خطأ 404).', url: robotsTxtUrl });
        }
        else {
            res.status(500).json({ error: 'Failed to fetch file due to server error or access issue.', details: `Status: ${response.status} - ${response.statusText}` });
        }
    } catch (error) {
        const errorMessage = error.message || 'Network or unknown error during file fetching.';
        res.status(500).json({ error: 'Fetching Failed.', details: errorMessage });
    }
};

// ----------------------------------------------------
// 4. دالة تحليل رؤوس HTTP (HTTP Headers Analyzer)
// ----------------------------------------------------
const analyzeHeadersHandler = async (req, res) => {
    const url = req.body.url || req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required.' });

    try {
        const response = await axios.get(url, {
            maxRedirects: 10, 
            validateStatus: (status) => status >= 200 && status < 505, 
        });

        const finalUrl = response.request.res.responseUrl || url;
        const statusCode = response.status;
        const statusText = response.statusText;
        const headers = response.headers;
        
        const headersArray = Object.keys(headers).map(key => ({ name: key, value: headers[key] }));

        res.json({ status: 'success', initialUrl: url, finalUrl: finalUrl, statusCode: statusCode, statusText: statusText, headers: headersArray });

    } catch (error) {
        const errorMessage = error.message || 'Network or unknown error during analysis.';
        let statusCode = 500;
        if (error.response) {
            statusCode = error.response.status;
            errorMessage = `HTTP Error ${statusCode}: ${error.response.statusText || 'Unknown'}`;
        }
        res.status(statusCode).json({ error: 'Analysis Failed.', details: errorMessage });
    }
};

// ----------------------------------------------------
// 5. دالة مدقق الروابط المعطلة (Broken Link Checker)
// ----------------------------------------------------
const checkLinkStatus = async (url) => {
    try {
        const response = await axios.head(url, { maxRedirects: 10, timeout: 5000, validateStatus: (status) => status >= 200 && status < 505 });
        return { status: response.status, statusText: response.statusText };
    } catch (error) {
        if (error.response) { return { status: error.response.status, statusText: error.response.statusText || 'Error' }; }
        return { status: 'N/A', statusText: 'Connection Error / Timeout' };
    }
};

const checkBrokenLinksHandler = async (req, res) => {
    const targetUrl = req.body.url || req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'Target URL is required.' });

    try {
        const pageResponse = await axios.get(targetUrl);
        const $ = cheerio.load(pageResponse.data);
        const links = new Set();
        
        $('a').each((i, element) => {
            const href = $(element).attr('href');
            if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
                try {
                    links.add(new URL(href, targetUrl).href);
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        });
        
        const checkedLinks = await Promise.all(
            Array.from(links).map(async (link) => {
                const statusData = await checkLinkStatus(link);
                let type = 'Success (2xx)';
                if (statusData.status >= 400 || statusData.status === 'N/A') { type = 'Broken (4xx/5xx)'; } 
                else if (statusData.status >= 300 && statusData.status < 400) { type = 'Redirect (3xx)'; }
                return { url: link, status: statusData.status, statusText: statusData.statusText, type: type };
            })
        );

        res.json({ status: 'success', targetUrl: targetUrl, totalLinks: links.size, results: checkedLinks });
    } catch (error) {
        let errorMessage = error.message || 'An unknown error occurred during analysis.';
        res.status(500).json({ error: 'Analysis Failed (Link Checker).', details: errorMessage });
    }
};




// server.js (إضافة الدالة الجديدة في قسم الدوال)

// ... بعد دالة imageOptimizerHandler

// ----------------------------------------------------
// 7. دالة مدقق رؤوس الأمان (Security Headers Checker) - الأداة 11
// ----------------------------------------------------

const SECURITY_HEADERS_LIST = [
    'strict-transport-security',
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy', // إضافة رأس حديث
    'cross-origin-embedder-policy',
    'cross-origin-opener-policy'
];

const checkSecurityHeadersHandler = async (req, res) => {
    const url = req.body.url || req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required.' });

    try {
        const response = await axios.get(url, {
            maxRedirects: 10,
            validateStatus: (status) => status >= 200 && status < 505,
        });

        const headers = response.headers;
        const securityResults = [];
        let score = 0;
        const maxScore = SECURITY_HEADERS_LIST.length;

        SECURITY_HEADERS_LIST.forEach(headerName => {
            const headerValue = headers[headerName];
            const isPresent = !!headerValue;
            let status = isPresent ? 'Present' : 'Missing';
            let recommendation = 'Must be implemented.';

            if (isPresent) {
                score++;
                if (headerName === 'x-frame-options' && headerValue.toUpperCase() === 'DENY') {
                    recommendation = 'Correctly configured to prevent Clickjacking.';
                } else if (headerName === 'strict-transport-security' && headerValue.includes('max-age=')) {
                    recommendation = 'HSTS is correctly configured.';
                } else if (headerName === 'content-security-policy') {
                    recommendation = 'CSP is implemented. Verify configuration for completeness.';
                } else {
                    recommendation = 'Present, but verify configuration.';
                }
                status = 'Good';
            }

            securityResults.push({
                name: headerName,
                value: headerValue || 'N/A',
                status: status,
                recommendation: recommendation
            });
        });
        
        const finalScore = (score / maxScore) * 100;

        res.json({
            status: 'success',
            targetUrl: response.request.res.responseUrl || url,
            score: `${score} / ${maxScore}`,
            percentage: finalScore.toFixed(2),
            headers: securityResults
        });

    } catch (error) {
        let errorMessage = error.message || 'An unknown error occurred during analysis.';
        res.status(500).json({ error: 'Analysis Failed (Security Checker).', details: errorMessage });
    }
};

// ... (نهاية الدوال)










// ----------------------------------------------------
// 6. دالة مُحسن الصور (Image Optimizer) - الأداة العاشرة
// ----------------------------------------------------
// حل مشكلة Multer:
const storage = multer.memoryStorage(); 
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
}).single('imageFile'); 


const imageOptimizerHandler = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            const details = err instanceof multer.MulterError ? err.message : 'Unknown upload error.';
            return res.status(500).json({ error: 'Upload Failed.', details: details });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }

        const originalFileBuffer = req.file.buffer;
        const originalSize = originalFileBuffer.length;
        const targetFormat = 'webp';

        try {
            const optimizedBuffer = await sharp(originalFileBuffer)
                .resize(1200, 1200, { fit: sharp.fit.inside, withoutEnlargement: true })
                .webp({ quality: 90 })
                .toBuffer();

            const optimizedSize = optimizedBuffer.length;

            // إرسال البيانات المحسنة والرؤوس
            res.set({
                'Content-Type': `image/${targetFormat}`,
                // هذا الرأس يضمن التنزيل (Attachment) وليس العرض في المتصفح
                'Content-Disposition': `attachment; filename="optimized-${path.basename(req.file.originalname, path.extname(req.file.originalname))}.${targetFormat}"`,
                'Original-Size': originalSize,
                'Optimized-Size': optimizedSize,
                'File-Extension': targetFormat
            });

            res.send(optimizedBuffer);

        } catch (error) {
            console.error('[Image Optimizer Error]:', error.message);
            res.status(500).json({ error: 'Image processing failed with Sharp.', details: error.message });
        }
    });
};


// ----------------------------------------------------
// 7. ربط المسارات (Endpoints)
// ----------------------------------------------------

// مسارات PageSpeed Insights
app.post('/api/analyze', analyzeUrlHandler); 
app.get('/api/analyze', analyzeUrlHandler);  

// مسارات YouTube Video Info
app.post('/api/youtube-analyze', analyzeYoutubeVideoHandler); 
app.get('/api/youtube-analyze', analyzeYoutubeVideoHandler); 

// المسار لـ Robots.txt
app.post('/api/fetch-robots', fetchRobotsTxtHandler);
app.get('/api/fetch-robots', fetchRobotsTxtHandler);

// المسار لـ HTTP Headers Analyzer
app.post('/api/analyze-headers', analyzeHeadersHandler);
app.get('/api/analyze-headers', analyzeHeadersHandler);

// المسار لـ Broken Link Checker
app.post('/api/check-links', checkBrokenLinksHandler);
app.get('/api/check-links', checkBrokenLinksHandler); 

// المسار لـ Image Optimizer 
app.post('/api/optimize-image', imageOptimizerHandler); 


// ... (المسارات السابقة)

// المسار الجديد لـ Security Headers Checker
app.post('/api/security-check', checkSecurityHeadersHandler);
app.get('/api/security-check', checkSecurityHeadersHandler); 

// ... (بقية المسارات)


// ----------------------------------------------------
// 8. تشغيل الخادم
// ----------------------------------------------------

app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
