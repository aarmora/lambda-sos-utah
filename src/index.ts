import puppeteer, { Browser } from "puppeteer";

const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const recaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');




export async function getDetails(browser: Browser, sosId: number) {
	console.log('Searching for sosId', sosId);

	const searchUrl = 'https://secure.utah.gov/bes/';

	const page = await browser.newPage();

	await page.goto(searchUrl);

	await page.waitFor(2500);
	await page.click('#searchNumberTab');

	await page.click('#entityNumber1', { clickCount: 3 });

	await page.type('#entityNumber1', sosId.toString());

	await page.click('#entityNumber2', { clickCount: 3 });
	await page.type('#entityNumber2', '0160');

	// That's it, a single line of code to solve reCAPTCHAs 🎉
	await (<any>page).solveRecaptchas()

	// await Promise.all([
	// 	page.waitForNavigation(),
	// 	page.click(`#recaptcha-demo-submit`),
	// ]);

	await page.click('[name=searchByNumberButton]');


	await page.waitFor(2500);

	await page.click('.entityName a');


	await page.waitFor(2500);

}

export async function setUpBrowser() {
	console.log('			Starting in prod mode');
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