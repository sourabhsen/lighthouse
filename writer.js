const fs = require('fs');
const padNumber = number => {
    return `${number}`.padStart(2, '0');
}

let jsonFileName;

const writeOutput = date => group => name => args => results => run => {
    if (!args.nosave) {
        const outputPath = `./tests/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}/${group}/${name}`;
        const timestampFilename = `${padNumber(date.getHours())}${padNumber(date.getMinutes())}${padNumber(date.getSeconds())}`;
        const baseOutputFile = `${outputPath}/${timestampFilename}${run > 1 ? `-${run}` : ''}`;
        jsonFileName = `${timestampFilename}${run > 1 ? `-${run}` : ''}`;
        // Ensure output path exists
        !fs.existsSync(outputPath) && fs.mkdirSync(outputPath, {recursive: true});
        // Write output json
        fs.writeFileSync(`${baseOutputFile}.json`, JSON.stringify(results.lhr));
    }
}
const printOutput = args => name => path => results => {
    if (args.metrics) {
        // console.info(`${results.audits.}\t${name}`);
        return;
    } 
    if (args.spreadsheet) {
        const date = new Date();
        const dateStamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        const outputPath = `./tests/${dateStamp}/${dateStamp}-${jsonFileName}`;
        var fullDateWithZero = new Date().toISOString().substr(0, 10).replace(/-/g, '');

        console.info(`${path}, ${Object.values(results.lhr.categories).map(c => `${Math.round(c.score * 100)}`).join(', ')}, ${name}, ${fullDateWithZero}-${jsonFileName}`);
        fs.writeFileSync(`${outputPath}.csv`, `\n${path}, ${Object.values(results.lhr.categories).map(c => `${Math.round(c.score * 100)}`).join(', ')}, ${name}, ${fullDateWithZero}-${jsonFileName}`, {flag:'a+'});
        return;
    }
    
    console.info(`\t${Object.values(results.lhr.categories).map(c => `${c.title}: ${Math.round(c.score * 100)}`).join(' | ')}\n`);
}
module.exports = {
    writeOutput: writeOutput,
    printOutput: printOutput
};
