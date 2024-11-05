const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
const app = express();

app.use(cors());
app.use(express.json());

// Retry configuration
const axiosRetry = async (url, maxRetries = 3, delay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
        } catch (error) {
            if (error.response?.status === 429 && attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
                continue;
            }
            throw {
                status: error.response?.status || 500,
                message: getErrorMessage(error)
            };
        }
    }
};

const getErrorMessage = (error) => {
    if (error.response?.status === 404) return 'Job posting not found. It might have been removed or the URL is invalid.';
    if (error.response?.status === 403) return 'Access denied. LinkedIn might require authentication.';
    return 'An error occurred while fetching the job details. Please try again later.';
};

app.post('/fetch-job', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !url.includes('linkedin.com/jobs')) {
            return res.status(400).json({ success: false, error: 'A valid LinkedIn job URL is required' });
        }

        const response = await axiosRetry(url);
        const $ = cheerio.load(response.data);

        const getLocation = () => {
            const locationSelectors = [
                '.job-details-jobs-unified-top-card__bullet',
                '.job-details-jobs-unified-top-card__workplace-type',
                '.job-details-jobs-unified-top-card__primary-description',
                '.topcard__flavor--bullet',
                '[class*="location"]'
            ];

            for (const selector of locationSelectors) {
                const element = $(selector).first();
                const text = element.text().trim();
                if (text) return text;
            }

            return 'Location not available';
        };

        const getFormattedDescription = () => {
            const descriptionElement = $('.show-more-less-html__markup, .description__text, .job-description').first();

            if (!descriptionElement.length) return 'Description not available';

            let description = descriptionElement.html()
                .replace(/<li>/gi, '\n• ')
                .replace(/<\/li>/gi, '')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/[ \t]+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            description = description
                .replace(/Show\s*(more|less)/gi, '')
                .replace(/Seniority level[^\n]*/gi, '')
                .replace(/Employment type[^\n]*/gi, '')
                .replace(/Job function[^\n]*/gi, '')
                .replace(/Industries[^\n]*/gi, '')
                .replace(/^Not Applicable\s*$/gim, '')
                .replace(/\n\s*\n/g, '\n\n')
                .trim();

            return description || 'Description not available';
        };

        const jobData = {
            title: $('h1').first().text().trim() || 'Title not found',
            company: $('.topcard__org-name-link, .topcard__org-name, .job-details-jobs-unified-top-card__primary-description a')
                .first().text().trim() || 'Company not found',
            location: getLocation(),
            description: getFormattedDescription()
        };

        if (!jobData.title && !jobData.company) {
            throw {
                status: 404,
                message: 'Unable to extract job details. The page might be unavailable.'
            };
        }

        res.json({
            success: true,
            data: jobData
        });

    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            error: error.message,
            retryAfter: error.status === 429 ? '30 seconds' : undefined
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});