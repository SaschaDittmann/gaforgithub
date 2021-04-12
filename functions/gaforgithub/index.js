require('dotenv').config();
const retry = require('retry');
const axios = require('axios');
const fs = require('fs');

module.exports = function (context, req) {
  context.log('Function received a request.');

  if (req.query.repo) {
    // create/get client id
    let cid = "00000000-0000-0000-0000-000000000000";
    const cookies = parseCookies(req.headers.cookie);
    if ('GAGH' in cookies) {
      context.log.verbose('Existing GAGH cookie found.');
      cid = cookies.GAGH;
    } else {
      context.log.verbose('Creating new cid.');
      cid = uuidv4(); //generate an anonymous client ID
      cookies.GAGH = cid;
    }
    context.log.verbose('cid: ' + cid);

    trackVisit(context, req, cid, cookies);
  } else {
    context.log.warn('Query string "repo" missing.');
    context.res = {
      status: 400,
      body: "Please pass a repo on the query string"
    };
    context.done();
  }
};

function trackVisit(context, req, cid, cookies) {
  context.log.verbose('Tracking visit.');
  const repo = req.query.repo;
  let ip = "";
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"].split(":")[0];
  }
  let referer = "";
  if (typeof req.headers['referer'] !== 'undefined') {
    referer = req.headers['referer'];
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
    ua: req.headers['user-agent'],
  });
  //GitHub currently uses Camo, so all the below details are hidden unfortunately
  //listed here in case you want to use this in an environment other than GitHub
  //https://help.github.com/articles/about-anonymized-image-urls/
  context.log('formdata: repo=' + repo + ', referer=' + referer + ', uip=' + ip + ', cid=' + cid);

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
        context.log.verbose('response code: ' + response.status);
        sendResponse(context, req, cookies);
      })
      .catch(function (error) {
        context.log.error('failed sending request (' + currentAttempt + ' attempt)');
        context.log(error);
        if (operation.retry(error)) { return; }
      });
    } catch (e) {
      context.log.error('failed request (' + currentAttempt + ' attempt)');
      if (operation.retry(e)) { return; }
    }
  });
}

function sendResponse(context, req, cookies) {
  const filename = req.query.empty === '' ? 'empty' : 'gag-green';
  fs.readFile(require('path').resolve(__dirname, `${filename}.svg`), 'utf-8', function (err, data) {
    context.res = {
      status: 200,
      headers: {
        'Set-Cookie': stringifyCookies(cookies),
        'Content-Type': 'image/svg+xml', //SVG tutorial: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Getting_Started
        'Cache-Control': 'private, no-store'
      },
      isRaw: true,
      body: data
    };
    context.done();
  });
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function parseCookies(cookie) {
  //this is a really simple method for cookie parsing found here https://stackoverflow.com/a/31645958/1205817
  //this may not work, however, for more 'weird' cookie values, e.g. if the cookie contains a ':'
  return (cookie && cookie.split(';').reduce(
    function (prev, curr) {
      var m = / *([^=]+)=(.*)/.exec(curr);
      var key = m[1];
      var value = decodeURIComponent(m[2]);
      prev[key] = value;
      return prev;
    }, {}
  )) || {};
}

function stringifyCookies(cookies) {
  var list = [];
  for (var key in cookies) {
    list.push(key + '=' + encodeURIComponent(cookies[key]));
  }
  return list.join('; ');
}

//GA documentation links and more
//https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide
//https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
//https://img.shields.io/badge/googleanalytics-github-green.svg


//Azure Functions v2 will send output directly to response
//https://stackoverflow.com/questions/47614788/how-to-return-base64-image-from-azure-function-as-binary-data?rq=1
//more: https://stackoverflow.com/questions/43810082/azure-functions-nodejs-response-body-as-a-stream/43811778