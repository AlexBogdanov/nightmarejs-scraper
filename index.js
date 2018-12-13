const { csvFormat } = require('d3-dsv');
const Nightmare = require('nightmare');
const { readFileSync, writeFileSync } = require('fs');

const numbers = readFileSync('./tesco-title-numbers.csv', { encoding: 'utf8' }).trim().split('\n');

const START = 'https://eservices.landregistry.gov.uk/wps/portal/Property_Search';

const series = numbers.reduce(async (queue, number) => {
    const dataArray = await queue;
    dataArray.push(await getAdress(number));
    return dataArray;
}, Promise.resolve([]));

series.then(data => {
    const csvData = csvFormat(data.filter(el => el));
    writeFileSync('./output.csv', csvData, { encoding: 'utf8' });
}).catch(error => {
    console.log(error);
});

const getAdress = async id => {
    console.log(`Now checking ${id}`);
    const nightmare = new Nightmare({ show: true });

    try {
        await nightmare
            .goto(START)
            .wait('.bodylinkcopy:first-child')
            .click('.bodylinkcopy:first-child');
    } catch(error) {
        console.log(error);
    }

    try {
        await nightmare
            .wait('input[name="titleNo"]')
            .type('input[name="titleNo"]', id)
            .click('input[value="Search >>"]');
    } catch (error) {
        console.log(error);
    }

    try {
        const result = await nightmare
            .wait('.w80p')
            .evaluate(() => {
                return [...document.querySelectorAll('.w80p')]
                    .map(el => el.innerText);
            }).end();

        return { id, address: result[0], lease: result[1] };
    } catch (error) {
        console.log(error);
        return undefined;
    }
};

getAdress(numbers[0])
    .then(data => console.dir(data))
    .catch(error => console.error(error));