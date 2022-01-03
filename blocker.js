const blockGroups = require('./urlBlocks');

const patternSwapper = item => item.replace(/\*/g, '');

const blockAnalytics = async page => {
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        const shouldAbort = [
            ...blockGroups['analytics'].map(patternSwapper),
            ...blockGroups['ads'].map(patternSwapper)
        ].some(urlPart => url.includes(urlPart));

        if (shouldAbort) {
            request.abort();
        } else {
            request.continue();
        }
    });
}

module.exports = {
    blockAnalytics: blockAnalytics
}