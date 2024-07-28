const fs = require('fs');
const { default: usePaxful } = require("@paxful/sdk-js");

// In real word application you should consider using a database to store
// credentials

const credentialsStorage = {
    // private
    storageFilename: __dirname + '/../storage/credentials.json',

    saveCredentials(credentials) {
        fs.writeFileSync(this.storageFilename, JSON.stringify(credentials));
    },

    getCredentials() {
        return fs.existsSync(this.storageFilename) ? JSON.parse(fs.readFileSync(this.storageFilename)) : null;
    }
};

module.exports.createPaxfulApi = () => {
    return usePaxful({
        clientId: process.env.PAXFUL_CLIENT_ID,
        clientSecret: process.env.PAXFUL_API_SECRET
    }, credentialsStorage);
};