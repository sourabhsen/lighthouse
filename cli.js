const parseArguments = require('./args');
const puppetFactory = require('./puppetMaster');
const lighthouse = require('lighthouse');
const chalk = require('chalk');
const authenticator = require('./authenticator');
const writer = require('./writer');
const args = parseArguments();
let currentlyTesting = false;

const initBrowser = async () => {
    const browser = await puppetFactory.getBrowser(args);
    browser.on('targetchanged', async target => {
        args.verbose && console.info(target.url());
        currentlyTesting && target.url().match('/auth/callback') &&
            console.warn(chalk.bgRedBright(chalk.whiteBright(
                '! OAuth redirect detected. Was this expected? !'
            )));
    });
    return browser;
}
(async() => {
    const date = new Date();
    const totalLength = args.lines && args.lines.length;
    let browser = await initBrowser();
    let currentCount = 0;
    for (const grouping of args.config) {
        args.spreadsheet && grouping.name == 'Peers' && console.info();
        for (const item of grouping.items) {
            currentCount++;
            !args.spreadsheet && console.info(
                ` | ${currentCount} of ${args.totalLength} | ${grouping.name} ${item.name} | ${item.path}`
            );
            let extraHeaders = authenticator.getExtraHeaders(args);
            if (item.needsAuth) {
                const basicAuthHeaderValue = await authenticator.auth(browser)(args)(item);
                if (basicAuthHeaderValue) {
                    extraHeaders['Authorization'] = `Basic ${basicAuthHeaderValue}`;
                }
            } else {
                // Re-init is easier and cleaner than logging out
                await browser.close();
                browser = await initBrowser();
                authenticator.reset();
            }
            let run = 1;
            while (run <= args.runs) {
                currentlyTesting = true;
                const results = await lighthouse(item.path, {
                    port: (new URL(browser.wsEndpoint())).port,
                    disableStorageReset: !!item.needsAuth,
                    blockedUrlPatterns: args.blocked,
                    onlyCategories: args.categories,
                    extraHeaders: extraHeaders
                });
                currentlyTesting = false;
                writer.writeOutput(date)(grouping.name)(item.name)(args)(results)(run);
                writer.printOutput(args)(item.name)(item.path)(results);
                run++;
            }
    
        }
    }
    await browser.close();
})()