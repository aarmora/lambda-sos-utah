import { Browser } from "puppeteer";




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

	await page.click('[name=searchByNumberButton]');


	await page.waitFor(2500);

	await page.click('.entityName a');


	await page.waitFor(2500);

}