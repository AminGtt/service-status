#!/usr/bin/env /usr/local/bin/node
const http = require('http');
const https = require('https');

// <xbar.title>Service Status</xbar.title>
// <xbar.version>v1.0</xbar.version>
// <xbar.author>Amin Gatta</xbar.author>
// <xbar.author.github>AminGtt</xbar.author.github>
// <xbar.desc>Simple plugin to monitor your services/websites availability (Forked from Vitaly Emelyanov) Added HTTP only and redirection support</xbar.desc>
// <xbar.image>https://hsto.org/webt/dd/yv/qn/ddyvqnycz-hytbdolo5ti48pii4.png</xbar.image>
// <xbar.dependencies>nodejs</xbar.dependencies>

// Customize as you wish!
const services = [
  { name: 'HTTPexample', url: 'http://example.com' },
  { name: 'HTTPSexample', url: 'https://example.com' },
];

// Emoji statuses
const successStatus = '🟢|size=10';
const warningStatus = '🟠|size=10';
const errorStatus = '🔴|size=10';

// Text statuses - replace emoji if you want
// const successStatus = '●|color=green';
// const warningStatus = '●|color=orange';
// const errorStatus = '●|color=red';

function main() {
  Promise.all(services.map(checkStatus))
    .then((serviceStatuses) => {
      const allSuccess = serviceStatuses.every((s) => s.status === 'success');
      const allError = serviceStatuses.every((s) => s.status === 'error');

      let globalStatusIcon;

      if (allSuccess) globalStatusIcon = successStatus;
      else if (allError) globalStatusIcon = errorStatus;
      else globalStatusIcon = warningStatus;

      console.log(`${globalStatusIcon}`);
      console.log('---');

      serviceStatuses.forEach((s) => {
        const color = s.status === 'success' ? 'green' : 'red';
        console.log(`${s.service.name} |color=${color}`);
        if (s.status === 'success') {
          console.log(`${s.res.statusCode} ${s.res.statusMessage} |size=10`);
        } else {
          console.log(`${s.error} |size=10`);
        }
        console.log('---');
      });

      if (!serviceStatuses.length) console.log('There are no configured services to check!\n---');
    });
}
main();

function checkStatus(service, redirectCount = 0) {
  // console.log('Checking URL:', service.url) // Here to make debug easier
  return new Promise((resolve) => {
    const client = service.url.startsWith('https') ? https : http;

    const req = client.get(service.url, (res) => {
      if (res.statusCode === 200) {
        return resolve({ status: 'success', res, service });
      } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirections
        if (redirectCount < 5) { // here you can change the number of max jumps
          return resolve(checkStatus({ name: service.name, url: res.headers.location }, redirectCount + 1));
        } else {
          return resolve({ status: 'error', error: 'Too many redirections', service });
        }
      }
      return resolve({ status: 'error', error: `${res.statusCode} ${res.statusMessage}`, service });
    });

    req.on('error', (error) => resolve({ status: 'error', error, service }));
    req.end();

    setTimeout(() => {
      resolve({ status: 'error', error: 'Request timeout', service });
      req.abort();
    }, 3000);
  });
}
