import puppeteer from 'puppeteer';
import { getDetails } from '.';

(async () => {

	const browser = await puppeteer.launch({
		headless: false
	});

	for (let i = 0; i < 10; i++) {
		try {
			await getDetails(browser, 11728064 + i);
		}
		catch (e) {
			console.log('Error getting details for', 11728064 + i, e);
		}
	}

	await browser.close();


})();
