const { app } = require("@azure/functions");
const retry = require('retry');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Azure Function HTTP handler for Google Analytics tracking beacon.
 * Receives requests from embedded Markdown image tags and forwards
 * pageview events to the Google Analytics Measurement Protocol.
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
 * Sends a pageview hit to the Google Analytics Measurement Protocol (UA).
 * Uses exponential backoff retry logic for resilience.
 */
function trackVisit(context, request, repo, cid, cookies) {
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

  const params = new URLSearchParams({
    v: 1,
    tid: process.env.PROPERTY_ID,
    cid: cid,
    t: 'pageview',
    dp: '/' + repo,
    dr: referer ? referer : null,
    aip: process.env.ANONYMIZE_IP ? process.env.ANONYMIZE_IP : null,
    uip: ip,
    ua: request.headers.get('user-agent'),
  });
  //GitHub currently uses Camo, so all the below details are hidden unfortunately
  //listed here in case you want to use this in an environment other than GitHub
  //https://help.github.com/articles/about-anonymized-image-urls/
  context.log('formdata: repo=' + repo + ', referer=' + referer + ', uip=' + ip + ', cid=' + cid);

  return new Promise((resolve, reject) => {
    const operation = retry.operation({
      retries: 5,
      minTimeout: 1 * 1000,
      maxTimeout: 60 * 1000,
      randomize: true,
    });

    operation.attempt(function(currentAttempt) {
      context.log('sending request: ' + currentAttempt + ' attempt');
      try {
        axios.post(
          'https://www.google-analytics.com/collect',
          {},
          { params: params }
        ).then(function (response) {
          context.log('response code: ' + response.status);
          resolve();
        })
        .catch(function (error) {
          context.error('failed sending request (' + currentAttempt + ' attempt)');
          context.log(error.message || error);
          if (operation.retry(error)) { return; }
          resolve(); // resolve even on failure — we still serve the SVG
        });
      } catch (e) {
        context.error('failed request (' + currentAttempt + ' attempt)');
        if (operation.retry(e)) { return; }
        resolve(); // resolve even on failure — we still serve the SVG
      }
    });
  });
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
module.exports = { parseCookies, stringifyCookies, uuidv4 };

//GA documentation links and more
//https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide
//https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters