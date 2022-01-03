# Lighthouse Batcher
This project enables batch testing of URLs through lighthouse supporting authentication.

## Why should I use this script?
In order to obtain accurate lighthouse scores, tests must be run without a primed cache. Lighthouse supports this through the 'Clear Storage' flag. This flag removes all cached items, cookies, localStorage, IndexedDB, etc assets. Some pages depend on the presence of a cookie or localStorage value, or both, in order to pass authentication. In order to obtain accurate test results, we must manually disable the cache and run a lighthouse test against the given URL after logging in. This project achieves that, while also achieving batch testing via CSV support.

## Requirements
 - Node v10+
 - yarn
  
   `npm i -g yarn`

## Running Tests
 1. Update your config and oauth yamls as appropriate
 2. Close unnecessary, heavy programs. (Don't video chat or crunch numbers while running this!)
 3. Install yarn dependencies

   `$ yarn install`
 4. Execute script
   * Through npm

     `yarn start`
   * Directly through node

     `node cli.js`
 5. Run test

    `yarn run start [--headless] [--spreadsheet] [--only #,#-#] [--config path] [--auth path]`


## Testing Flags
 * `help`

   Display basic usage
 * `headless`

   Runs tests in a headless chrome browser, intended to avoid issues where opening new tabs steals focus on some platforms.
 * `config`

   Read a URL configuration yaml at the given path. Defaults to `./config.yaml`.
 * `auth`
   
   Read an authentication configuration yaml at the given path. Defaults to './oauth.yaml'.
 * `showIndexes`

   Show indexes of the given config for use with the `--only` option.
 * `only`

   Only run the test for the given index(es). Supports single, comma separated, and ranged values `--only 4,5,9,10-15`

   This flag is intended to assist in cases where specific tests fail by allowing individual tests to be run.
 * `spreadsheet`

   Output Excel-friendly output for easy batch comparison, tailored specifically for the Performance report that goes out monthly.

 * `nosave`
   
   Development focused flag to prevent writing test files during development or debugging of features.

 * `categories`
  
   Override Lighthouse categories for testing, defaults to [performance, seo, best-practices, accessibility].

 * `blockedGroups`

   Name of urlBlocks group(s) to block. Useful for testing impact of various third party code such as analytics, ads, or content from outbrain, etc. Options shipped with the repo: `analytics`, `thirdPartyPartner`, `ads`, `cmsCss`, `cmsJs`, `cmsImages`, `legacyAppDevJs`, `custom`. `custom` is blank by default for easy ad-hoc testing.

## Configuration
When setting this project up for the first time, you will need to obtain or create url and authentication configurations.

## config.yaml
```
--- // Config is an array of objects
-
    name: GROUP NAME // String
    items:
        -
            name: SITE NAME
            path: SITE URL
            needsAuth: {oauth, basic} // This value is optional, omit for anonymous pages
```

## oauth.yaml
```
---
useragent: CUSTOM USER AGENT
headers:
    HEADER: VALUE

accessTokens:
    - TOKEN_NAME
    
login:  // Traditional authentication
    username: USERNAME
    password: PASSWORD
    selectors: // These are UI selectors for login form data
        username: SELECTOR
        password: SELECTOR
        submit: SELECTOR
    baseUrl: URL TO LOGIN // Supports ${state} -> current URL replacement
logout:
    baseUrl: URL TO LOGOUT // Supports ${state} -> current URL replacement

configs: // Array of authentication configs
    -   // Oauth type configuration
        name: NAME // Human readable name, optional
        regex: PATTERN // Pattern for urls this config applies to
        username: USERNAME
        password: PASSWORD
        selectors: // These are UI selectors for login form data
            username: SELECTOR
            password: SELECTOR
            submit: SELECTOR
        redirectUri: URL TO CALLBACK // Supports ${uri.origin} -> current origin replacement
        baseUrl: URL TO LOGIN
        clientID: CLIENTID
        responseType: code
        scope:
            - SCOPE1
        extraData: 'foo=bar'
    - // HTTP basic auth type configuration
        name: NAME
        regex: PATTERN
        username: USERNAME
        password: PASSWORD
        type: basic
```

## Versions
* `2.1.2`

  Spreadsheet output now includes name

* `2.1.1`

  Fix authentication bot bypass header breaking authentication in lighthouse test

* `2.1.0`

  Added support for Basic Auth
  Fix issue where no configured oauth configs caused script failure
  Added support for passing headers into lighthouse test
  Fix for empty header config block breaking tests
  Logout is now done by re-initializing the browser rather than actually logging out, which is more reliable

* `2.0.1`

  Fixed issue where cli blocks weren't working correctly
  Added logging output to reflect blocked patterns
* `2.0.0`

  Configurations are now YAML, which is much cleaner and more easily maintained.
  Includes previously unreleased inprovements in authentication management
  CLI was rewritten to be more greppable and maintainable, as well as shareable with third parties

* `1.3.0`

  Switch to chrome-launcher like the lighthouse cli, which produces scores similar to dev tools and the extension.
  Improve console output
  Reorganize saved files so date is first, allowing a complete run to be zipped without other files
  Add more timeouts to puppeteer commands, resulting in a speed boost
  Support skipping the login flow, assuming that the login selector not being found means that we are already logged in

* `1.2.0`

  Support needing to click to expose the login link via a menu button

* `0.1.0`

  Initial script
