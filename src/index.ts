import puppeteer, { Browser, Page } from "puppeteer";
import axios, { AxiosRequestConfig } from 'axios';
import cheerio from 'cheerio';
import FormData from 'form-data';

const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const recaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

// Business types
// 0160 - LLC - Domestic
// 0142 - Corporation - Domestic - Profit
// 0151 - DBA

const BusinessTypes = [
	'0160',
	'0142',
	'0151'
];

export async function getDetails(browser: Browser, sosId: number, businessType = 0, solveForCaptcha = false) {
	console.log('Searching for sosId', `${sosId}-${BusinessTypes[businessType]}`);

	const searchUrl = 'https://secure.utah.gov/bes/';

	const page = await browser.newPage();

	await page.goto(searchUrl);
	await page.click('#searchNumberTab');

	await page.click('#entityNumber1', { clickCount: 3 });

	await page.type('#entityNumber1', sosId.toString());

	await page.click('#entityNumber2', { clickCount: 3 });
	await page.type('#entityNumber2', BusinessTypes[businessType]);

	await page.click('[name=searchByNumberButton]');

	// Check for invalid captcha. 
	// If we see invalid captcha deal, let's try again but solve the captcha first.

	if (solveForCaptcha) {
		
	}

	try {
		await page.waitForSelector('.entityName a', { timeout: 2500 });

		await page.click('.entityName a');
	}
	catch (e) {
		console.log('No business found for', `${sosId}-${BusinessTypes[businessType]}`);
		await page.waitForTimeout(10000);
		await page.close();

		if (businessType - 1 < BusinessTypes.length) {
			await getDetails(browser, sosId, businessType + 1);
		}
	}

	await page.waitForSelector('#entityDetails');

	const title = await page.$eval('#entityDetails', element => element.textContent);
	const businessDateStuff = await page.$eval('#businessDetailsFO p:nth-of-type(3)', element => element.textContent);

	console.log('Title', title);
	console.log('Business date stuff', businessDateStuff);
}

export async function setUpBrowser() {
	console.log('Starting in prod mode');
	const pptrArgs: puppeteer.LaunchOptions = {
		headless: false,
		ignoreHTTPSErrors: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-infobars',
			'--window-position=0,0',
			'--ignore-certifcate-errors',
			'--ignore-certifcate-errors-spki-list',
			'--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
		]
	};

	puppeteerExtra.use(pluginStealth());
	puppeteerExtra.use(
		recaptchaPlugin({
			provider: { id: '2captcha', token: process.env.captchaApiKey },
			visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
		})
	);
	const browser = await puppeteerExtra.launch(pptrArgs);

	return browser;

}

export function timeout(ms: number) {
	return new Promise(res => setTimeout(res, ms));
}

// export async function callWithAxios() {
// 	const searchUrl = 'https://secure.utah.gov/bes/';

// 	const axiosResponse = await axios.get(searchUrl, {
// 		headers: {
// 			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36'
// 		}
// 	});

// 	const $ = cheerio.load(axiosResponse.data);
// 	const csrf = $('#searchByNumberForm div:nth-of-type(2) input').val();
// 	console.log('csrf', csrf);

// 	console.log('headers', axiosResponse.headers);
// 	const jSessionCookie = axiosResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];
// 	const tsCookie1 = axiosResponse.headers['set-cookie'][1].split(';')[0].split('=')[1];
// 	const tsCookie2 = axiosResponse.headers['set-cookie'][2].split(';')[0].split('=')[1];

// 	await submitForm(solvedCaptcha.data.request, 11728064, BusinessTypes[0], csrf,
// 		jSessionCookie, tsCookie1, tsCookie2);

// }

// async function submitForm(gCaptchaResponse: string, sosId: number,
// 	businessType: string, csrf: string, jSessionCookie: string, tsCookie1: any, tsCookie2: any) {
// 	const body = new FormData();

// 	body.append('g-recaptcha-response', gCaptchaResponse);
// 	body.append('searchBy', 'NUMBER');
// 	body.append('entityNumber1', sosId.toString());
// 	body.append('entityNumber2', businessType);
// 	body.append('_csrf', csrf);

// 	console.log('JSessionCookie', jSessionCookie, 'tsCookie1', tsCookie1, 'tsCookie2', tsCookie2);

// 	const config: AxiosRequestConfig = {
// 		headers: {
// 			cookies: {
// 				'JSESSIONID': jSessionCookie,
// 				'Content-Type': 'application/x-www-form-urlencoded',
// 				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36'
// 			}
// 		},
// 		withCredentials: true
// 	};

// 	config.headers.cookies[tsCookie1.key] = tsCookie1.value;
// 	config.headers.cookies[tsCookie2.key] = tsCookie2.value;

// 	const axiosResponse = await axios.post('https://secure.utah.gov/bes/searchResults.html', body, config);

// 	console.log('Headers from submission', axiosResponse.headers);

// }

async function solveCaptcha() {	

	const captchaToken = '6LcQUqIUAAAAAG7lgG1BfDlhvVUuFP26QsY4Eq6_';

	const captchaApiResponse = await axios.get(`https://2captcha.com/in.php?key=${process.env.captchaApiKey}&method=userrecaptcha&googlekey=${captchaToken}&pageurl=https://secure.utah.gov/bes/&json=1`);

	console.log('Captcha api response', captchaApiResponse.data);

	await timeout(15000);
	
	const captchaSolvingUrl = `https://2captcha.com/res.php?key=${process.env.captchaApiKey}&action=get&id=${captchaApiResponse.data.request}&json=1`;

	let solvedCaptcha = await axios.get(captchaSolvingUrl);
	let attempt = 0;

	while (solvedCaptcha.data.request === 'CAPCHA_NOT_READY' || attempt < 3) {
		console.log('Captcha not ready, trying again');
		await timeout(5000);
		
		solvedCaptcha = await axios.get(captchaSolvingUrl);
		attempt++;
	}

	console.log('solvedCaptcha', solvedCaptcha.data);
}