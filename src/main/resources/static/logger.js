const DEV_ENV = "DEV";
const PROD_ENV = "PROD";
const ENV = PROD_ENV;

function log(...args) {
    if (ENV === DEV_ENV) {
        console.log(...args);
    }
}

function error(...args) {
    if (ENV === DEV_ENV) {
        console.error(...args);
    }
}
