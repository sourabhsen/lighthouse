const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer-core');
const disableCache = browser => {
    browser.on('targetchanged', async target => {
        const page = await target.page();
        if (page) {
            await page.setCacheEnabled(false)
                .catch(() => {});
        }
    });
}
const launchChromeAndConnect = async args => {
    const chrome = await chromeLauncher.launch({
        chromeFlags: [
            args.headless ? '--headless' : null,
            '--ignore-certificate-errors'
        ]
    });
    const browser = await puppeteer.connect({
        browserURL: `http://localhost:${chrome.port}`,
        defaultViewport: false
    });
    disableCache(browser);
    return browser;
};
module.exports = {
    getBrowser: launchChromeAndConnect
}