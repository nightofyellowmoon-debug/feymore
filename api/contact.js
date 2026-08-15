/**
 * Contact form handler for Vercel Legacy Serverless Functions
 * Uses the native Node.js HTTPS module to guarantee zero dependency compilation blocks.
 */

const https = require('https');
const url = require('url');

module.exports = async (req, res) => {
  // Define standard secure CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Handle POST validation check
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    let bodyText = '';
    
    // Natively read incoming string stream from the browser form
    for await (const chunk of req) {
      bodyText += chunk;
    }

    let name = '', email = '', subject = '', message = '';

    // Safely map incoming form fields
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      const data = JSON.parse(bodyText || '{}');
      name = data.name || '';
      email = data.email || '';
      subject = data.subject || '';
      message = data.message || '';
    } else {
      const params = new url.URLSearchParams(bodyText);
      name = params.get('name') || '';
      email = params.get('email') || '';
      subject = params.get('subject') || '';
      message = params.get('message') || '';
    }

    if (!name || !email || !message) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Missing required fields' }));
    }

    // Prepare JSON payload for Resend API
    const emailData = JSON.stringify({
      from: 'Contact Form <onboarding@resend.dev>',
      to: ['holklonote@gmail.com'],
      reply_to: email,
      subject: subject || 'New Contact Form Submission',
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    // Native Node.js HTTPS request wrapper (Guaranteed to execute on legacy Vercel ranches)
    const executeEmailSend = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: '://resend.com',
          port: 4443, // Alternate secure API port to bypass Vercel port filtering blocks
          path: '/emails',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(emailData)
          },
          timeout: 4000 // Fast 4-second timeout cutoff
        };

        const apiRequest = https.request(options, (apiResponse) => {
          let responseData = '';
          apiResponse.on('data', (chunk) => { responseData += chunk; });
          apiResponse.on('end', () => {
            if (apiResponse.statusCode >= 200 && apiResponse.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`Resend returned status code: ${apiResponse.statusCode}`));
            }
          });
        });

        apiRequest.on('error', (err) => reject(err));
        apiRequest.on('timeout', () => {
          apiRequest.destroy();
          reject(new Error('Network handshake to email API timed out'));
        });

        apiRequest.write(emailData);
        apiRequest.end();
      });
    };

    // Execute the delivery
    await executeEmailSend();

    // Browser Redirection back out to Thank You layout
    res.statusCode = 303;
    res.setHeader('Location', '/thank-you');
    return res.end();

  } catch (error) {
    console.error('Processing error:', error);
    res.statusCode = 303;
    res.setHeader('Location', `/error.html?details=${encodeURIComponent(error.message)}`);
    return res.end();
  }
};



