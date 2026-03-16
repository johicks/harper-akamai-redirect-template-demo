import { httpRequest } from 'http-request';
import { logger } from 'log';

// This value is injected by GitHub Actions	
const HARPER_TOKEN = '';

// This value is injected by GitHub Actions
const HARPER_BASE_URL = '';

export async function onClientRequest(request) {
	try {
		const url = `${HARPER_BASE_URL}/checkredirect?h=${request.host}&path=${request.path}`;

		const requestHeaders = {
			Authorization: `Basic ${HARPER_TOKEN}`,
			'Content-Type': 'application/json',
			'X-Query-String': request.query,
		};

		const options = {
			timeout: 250,
			method: 'GET',
			headers: requestHeaders,
		};

		const response = await httpRequest(url, options);

		if (response.ok) {
			const data = await response.json();

			if (!data.redirectURL) {
				logger.log(`Redirect response missing redirectURL for ${request.url}`);
				return;
			}

			const responseHeaders = {
				Location: data.redirectURL,
			};

			const body = '{}';

			logger.log(`Redirecting ${request.url} to ${data.redirectURL}`);
			request.respondWith(data.statusCode, responseHeaders, body);
		} else {
			logger.log(`No redirect found for ${request.url}`);
		}
	} catch (exception) {
		logger.log(`Error occurred while calling HDB: ${exception.message}`);
	}
}
