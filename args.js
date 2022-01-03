const allArgs = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const YAML = require('yaml');
const chalk = require('chalk');
const blockGroups = require('./urlBlocks');
const printHelp = () => {
    console.info(`yarn run start [--headless] [--showIndexes] [--config path/to/config.yaml] [--auth path/to/oauth.yaml] [--only {#},{#}-{#}] [--runs {#}]
headless
    Runs tests in a headless chrome browser
config
    Specify the config file path, defaults to './config.yaml'.
auth
    Specify the auth file path, defaults to './oauth.yaml'
showIndexes
    Show indexes of current config
only
    Specify one or more indexes (comma separated or a range with a hyphen) of tests to run
runs
    Number of runs per URL
spreadsheet
    Output excel-friendly results
nosave
    Don't save json results to disk
categories
    Override the lighthouse test categories
blockedGroups
    Block URL groups by named groups defined in urlBlocks.js
    `);
    return process.exit(0);
}
const defaults = {
    config: './config.yaml',
    auth: './oauth.yaml',
}
const parseLineRestrictions = args => {
    if (typeof args.only === 'number') {
        return [args.only];
    }
    if (typeof args.only === 'string') {
        const groups = args.only.split(',');
        const lines = groups.reduce((output, group) => {
            const [lower, upper] = group.split('-');
            if (upper) {
                let count = parseInt(lower);
                while (count <= parseInt(upper)) {
                    output.push(count);
                    count++;
                }
            } else {
                output.push(parseInt(lower));
            }
            return output;
        }, []);
        return lines;
    }
    return null;
}
const parseCategories = args => {
    return args.categories && args.categories.split(',') || [
        'performance',
        'seo',
        'best-practices',
        'accessibility'
    ];
}
const parseBlocks = args => {
    return args.blockedGroups ? args.blockedGroups.split(',').reduce((groups, group) => {
        groups.push(...blockGroups[group]);
        return groups;
    }, []) : [];
}
const readFile = filename => {
    return fs.readFileSync(filename, 'utf8');
}
const showIndexes = config => {
    let index = 0;
    for (const grouping of config.config) {
        console.info(`\t${chalk.greenBright(grouping.name)}`);
        for (const item of grouping.items) {
            index++;
            console.info(`\t\t${chalk.yellowBright(index)}\t${chalk.whiteBright(item.name)}\n\t\t\t\t${chalk.gray(item.path)}`);
        }
    }
    return process.exit(0);
}
const getLengthOfConfig = object => {
    return object.reduce((accumulator, grouping) => {
        accumulator = accumulator + grouping.items.length;
        return accumulator;
    }, 0);
}
const applyIndexRestriction = lineRestrictions => config => {
    if (!lineRestrictions) {
        return config;
    }
    let index = 0;
    return config.map(grouping => {
        const filteredItems = grouping.items.filter(item => {
            index++;
            return lineRestrictions.includes(index);
        });
        return Object.assign(grouping, {
            items: filteredItems
        });
    }).filter(grouping => grouping.items.length);
}
const processArgs = args => {
    if (!args) {
        args = allArgs;
    }
    // OR defaults
    const finalArgs = Object.assign({}, defaults, args);
    finalArgs.help && printHelp();
    const lineRestrictions = parseLineRestrictions(finalArgs);
    const userConfiguration = applyIndexRestriction(lineRestrictions)(YAML.parse(readFile(finalArgs.config)));
    const config = {
        runs: 1,
        ...args,
        lines: lineRestrictions,
        categories: parseCategories(finalArgs),
        blocked: parseBlocks(finalArgs),
        config: userConfiguration,
        auth: YAML.parse(readFile(finalArgs.auth)),
        totalLength: getLengthOfConfig(userConfiguration)
    }
    config.blocked.length && console.info(chalk.red(`Blocking the following patterns:\n\t${chalk.redBright(config.blocked.join('\n\t'))}\n`));
    finalArgs.showIndexes && showIndexes(config);
    return config;
}
module.exports = processArgs;