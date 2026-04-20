const { app } = require("@azure/functions");
const { fetchWithRetry } = require('./retry.js');
const fs = require('fs');
const path = require('path');

/** GA4 Measurement Protocol endpoint */
const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

/**
 * Azure Function HTTP handler for Google Analytics tracking beacon.
 * Receives requests from embedded Markdown image tags and forwards
 * pageview events to the GA4 Measurement Protocol.
 */
async function gaforgithub(request, context) {
  context.log('Function received a request.');

  const repo = request.query.get('repo');

  if (repo) {
    // create/get client id
    let cid = "00000000-0000-0000-0000-000000000000";
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    if ('GAGH' in cookies) {
      context.log('Existing GAGH cookie found.');
      cid = cookies.GAGH;
    } else {
      context.log('Creating new cid.');
      cid = uuidv4();
      cookies.GAGH = cid;
    }
    context.log('cid: ' + cid);

    await trackVisit(context, request, repo, cid, cookies);
    return sendResponse(request, cookies);
  } else {
    context.warn('Query string "repo" missing.');
    return {
      status: 400,
      body: "Please pass a repo on the query string"
    };
  }
}

/**
 * Builds the GA4 Measurement Protocol event payload.
 * @param {string} repo - Repository name from the query string.
 * @param {string} cid - Client ID (UUID v4 from cookie or newly generated).
 * @param {string} userAgent - User-Agent header value.
 * @param {string} ip - Client IP from X-Forwarded-For header.
 * @param {string} referer - Referer header value.
 * @returns {object} GA4 event payload ready for JSON serialization.
 */
function buildGA4Payload(repo, cid, userAgent, ip, referer) {
  const eventParams = {
    page_location: '/' + repo,
    engagement_time_msec: '1',
  };

  if (userAgent) {
    eventParams.user_agent = userAgent;
  }

  if (referer) {
    eventParams.page_referrer = referer;
  }

  // GA4 handles IP anonymization by default. When ANONYMIZE_IP is set to "1",
  // omit IP entirely to prevent any IP-based processing.
  const anonymizeIp = process.env.ANONYMIZE_IP === '1';
  if (ip && !anonymizeIp) {
    eventParams.ip_override = ip;
  }

  return {
    client_id: cid,
    events: [
      {
        name: 'page_view',
        params: eventParams,
      }
    ]
  };
}

/**
 * Sends a pageview event to the GA4 Measurement Protocol.
 * Uses native fetch with exponential backoff retry logic for resilience.
 */
async function trackVisit(context, request, repo, cid, cookies) {
  context.log('Tracking visit.');
  let ip = "";
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    ip = forwardedFor.split(":")[0];
  }
  let referer = "";
  const refererHeader = request.headers.get('referer');
  if (refererHeader) {
    referer = refererHeader;
  }

  const measurementId = process.env.GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;
  const userAgent = request.headers.get('user-agent') || '';

  const payload = buildGA4Payload(repo, cid, userAgent, ip, referer);

  //GitHub currently uses Camo, so all the below details are hidden unfortunately
  //listed here in case you want to use this in an environment other than GitHub
  //https://help.github.com/articles/about-anonymized-image-urls/
  context.log('GA4 event: name=page_view, repo=' + repo + ', referer=' + referer + ', ip=' + ip + ', cid=' + cid);

  const url = `${GA4_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  try {
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      {
        maxAttempts: 5,
        minTimeout: 1000,
        maxTimeout: 60000,
        onRetry: (error, attempt) => {
          context.error('GA4 request failed (attempt ' + attempt + '): ' + (error.message || error));
        },
      }
    );

    context.log('GA4 response status: ' + response.status);
  } catch (error) {
    context.error('GA4 request failed after all retries: ' + (error.message || error));
    // Resolve gracefully — always serve the SVG even if GA tracking fails
  }
}

/**
 * Returns the appropriate SVG response (badge or invisible pixel)
 * with cache-control and cookie headers.
 */
function sendResponse(request, cookies) {
  const hasEmpty = request.query.has('empty');
  const filename = hasEmpty ? 'empty' : 'gag-green';
  const svgData = fs.readFileSync(path.resolve(__dirname, `${filename}.svg`), 'utf-8');

  return {
    status: 200,
    headers: {
      'Set-Cookie': stringifyCookies(cookies),
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'private, no-store'
    },
    body: svgData
  };
}

/**
 * Generates a UUID v4 string for anonymous client identification.
 * @returns {string} A random UUID v4 string.
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Parses a cookie header string into a key-value object.
 * @param {string} cookie - The raw cookie header string.
 * @returns {Object} Parsed cookies as key-value pairs.
 */
function parseCookies(cookie) {
  return (cookie && cookie.split(';').reduce(
    function (prev, curr) {
      var m = / *([^=]+)=(.*)/.exec(curr);
      if (!m) return prev;
      var key = m[1];
      var value = decodeURIComponent(m[2]);
      prev[key] = value;
      return prev;
    }, {}
  )) || {};
}

/**
 * Serializes a cookie object into a Set-Cookie header string.
 * @param {Object} cookies - Cookie key-value pairs.
 * @returns {string} Serialized cookie string.
 */
function stringifyCookies(cookies) {
  var list = [];
  for (var key in cookies) {
    list.push(key + '=' + encodeURIComponent(cookies[key]));
  }
  return list.join('; ');
}

// Register the HTTP-triggered function with Azure Functions v4 runtime
app.http('gaforgithub', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: '{*segments}',
  handler: gaforgithub
});

// Export utilities for testing
module.exports = { parseCookies, stringifyCookies, uuidv4, buildGA4Payload, trackVisit, sendResponse, gaforgithub, GA4_ENDPOINT };

//GA4 Measurement Protocol documentation:
//https://developers.google.com/analytics/devguides/collection/protocol/ga4
//https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference