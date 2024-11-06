# Job Description Fetcher

A lightweight Express.js server that scrapes job posting details from LinkedIn job URLs. This API extracts key information including job title, company name, location, and a cleaned description from LinkedIn job postings.

## Features

- Scrapes job details from LinkedIn job posting URLs
- Handles rate limiting with automatic retries
- Cleans and formats job descriptions
- CORS enabled
- Error handling with meaningful messages
- User-agent spoofing to prevent blocking

## Prerequisites

- Node.js (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
npm install
```

## Dependencies

- express
- axios
- cors
- cheerio

## Usage

1. Start the server:
```bash
node server.js
```

The server will start on port 3000 by default (configurable via PORT environment variable).

2. Make a POST request to `/fetch-job` endpoint:

```javascript
// Example request using fetch
const response = await fetch('http://localhost:3000/fetch-job', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.linkedin.com/jobs/view/[job-id]'
  })
});

const data = await response.json();
```

### API Response Format

Successful response:
```json
{
  "success": true,
  "data": {
    "title": "Job Title",
    "company": "Company Name",
    "location": "Job Location",
    "description": "Formatted job description..."
  }
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message",
  "retryAfter": "30 seconds" // Only included for rate limit errors
}
```

## Error Handling

The API handles various error scenarios:
- Invalid URLs (400)
- Job posts not found (404)
- Access denied (403)
- Rate limiting (429)
- General server errors (500)

## Rate Limiting

The server implements a retry mechanism for rate-limited requests:
- Maximum 3 retry attempts
- Exponential backoff delay between retries
- Automatic handling of 429 responses

## Limitations

- Only works with public LinkedIn job postings
- May be affected by LinkedIn's rate limiting
- Requires valid LinkedIn job URLs
- Does not support authentication for private job postings

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.
