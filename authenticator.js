const blocker = require('./blocker');
let authedDomains = [];
const getAuthForUrl = authConfig => (url, urlConfig) => {
    if (urlConfig.needsAuth == 'generic') {
        return authConfig.login;
    }
    const oauthConfig = authConfig.configs && authConfig.configs.filter(config => {
        return new RegExp(config.regex).test(url.href);
    }).pop();
    return oauthConfig || authConfig.login; // Fallback to non oauth
};
const constructLoginUrl = authConfig => url => {
    if (!authConfig.clientId) {
        return authConfig.baseUrl.replace('${state}', url.href);
    }
    const redirectUri = authConfig.redirectUri.replace('${uri.origin}', url.origin);
    return authConfig.baseUrl + '?' +
        (authConfig.extraData ? `${authConfig.extraData}&` : '') +
        `response_type=${authConfig.responseType}&` +
        `client_id=${authConfig.clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${authConfig.scope && authConfig.scope.join('%20') || ''}&` +
        `state=${url.href}`;
}
const setWhitelistValues = authConfig => async page => {
    // Never use service workers
    await page._client.send('Network.setBypassServiceWorker', {
        bypass: true
    });
    await page.setUserAgent(authConfig.useragent);
    await blocker.blockAnalytics(page);
}
const authenticate = browser => args => async config => {
    const url = new URL(config.path);
    // Existing auth for this subdomain
    if (authedDomains.includes(url.hostname)) {
        return;
    }
    // Decline permission popups
    browser.defaultBrowserContext().overridePermissions(url.origin, [
        'geolocation',
        'notifications'
    ]);
    const authConfig = getAuthForUrl(args.auth)(url, config);
    if (authConfig.type == 'basic') {
        return Buffer.from(authConfig.username + ':' + authConfig.password)
            .toString('base64')
    }
    const loginUrl = constructLoginUrl(authConfig)(url);
    const loginPage = await browser.newPage();
    // loginPage.on('console', async msg => console.log(
    // ...await Promise.all(msg.args().map(arg => arg.jsonValue()))
    // ));
    await setWhitelistValues(args.auth)(loginPage);
    await loginPage.goto(loginUrl);
    await loginPage.waitForSelector(authConfig.selectors.username);
    await loginPage.waitForTimeout(1000);
    await loginPage.type(authConfig.selectors.username, authConfig.username);
    await loginPage.waitForTimeout(3000);
    await loginPage.type(authConfig.selectors.password, authConfig.password);
    await loginPage.waitForTimeout(3000);
    // Set bot bypass header before submission
    // await loginPage.setExtraHTTPHeaders(args.auth.authHeaders);
    await loginPage.click(authConfig.selectors.submit);
    await loginPage.waitForNavigation();
    await loginPage.waitForTimeout(10000);
    // await loginPage.close();
    // Login is kinda broken so navigate to the page in case we need to force oauth redirects
    // const forceRedirects = await browser.newPage();
    // await forceRedirects.goto(config.path);
    // await loginPage.waitForTimeout(13000);
    await persistTokenFromSessionToLocal(args.auth.accessTokens)(loginPage);
    // await forceRedirects.close();
    await loginPage.close();
    // await loginPage.waitForNavigation({timeout: 0});
    authedDomains.push(url.hostname);
}
const reset = () => {
    authedDomains = [];
}
const deauth = browser => args => async config => {
    // If no auths, skip
    if (!authedDomains.length) {
        return;
    }
    const logoutUrl = args.auth.logout.baseUrl.replace('${state}', config.path);
    const logoutPage = await browser.newPage();
    await setWhitelistValues(args.auth)(logoutPage);
    await logoutPage.goto(logoutUrl);
    await logoutPage.close();
    reset();
}
const persistTokenFromSessionToLocal = tokens => async page => {
    await page.evaluate(token => {
        token.map(t => {
            const session = sessionStorage.getItem(t);
            if (session) {
                localStorage.setItem(t, session);
            }
        });
    }, tokens);
};
const getAuthHeaders = args => {
    return args.auth.authHeaders;
}
const getExtraHeaders = args => {
    return args.auth.headers;
}
module.exports = {
    auth: authenticate,
    deauth: deauth,
    reset: reset,
    getAuthHeaders: getAuthHeaders,
    getExtraHeaders: getExtraHeaders
}