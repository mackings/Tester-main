const lockfile = require('proper-lockfile');
const fs = require('fs').promises;
const Big = require('big.js');
const sleep = require('sleep-promise');

class TradesHandler {
    
    constructor(paxfulApi) {
        this.storageFilename = __dirname + '/../storage/trades.json';

        this.paxfulApi = paxfulApi;
    }

    // private
    generatePaymentReference(trade) {
        // Feel free to re-implement this method to return any unique string that this application
        // can use to match incoming bank payment with a trade
        return trade.trade_hash;
    }

    async markAsStarted(tradeHash) {
        const trade = await this.getTrade(tradeHash);
        if (!trade) {
            const data = (await this.paxfulApi.invoke('/paxful/v1/trade/get', { trade_hash: tradeHash })).data.trade;

            const paymentReference = this.generatePaymentReference(data);
            // await this.saveTrade(tradeHash, {
            //     isCryptoReleased: false,
            //     fiatBalance: 0,
            //     expectedFiatAmount: new Big(data.fiat_amount_requested).toNumber(),
            //     expectedFiatCurrency: data.fiat_currency_code,
            //     expectedPaymentReference: this.generatePaymentReference(data)
            // });

//This is a fully automated trade. Please follow instructions that will follow.

            await sleep(2000);
            await this.paxfulApi.invoke('/paxful/v1/trade-chat/post', {
                trade_hash: tradeHash,
                message: ``
            });

            await sleep(2000);
            const response = await this.paxfulApi.invoke('/paxful/v1/trade/share-linked-bank-account', {
                trade_hash: tradeHash
            });

            await sleep(2000);
            // await this.paxfulApi.invoke('/paxful/v1/trade-chat/post', {
            //     trade_hash: tradeHash,
            //     //When making a payment please specify the following payment reference: ${paymentReference}
            //     message: ``
            // });
        } else {
            throw new Error('You can mark a trade as started only once.');
        }
    }

    async isCryptoReleased(tradeHash) {
        return (await this.getTradeOrDie(tradeHash)).isCryptoReleased;
    }

    async getFiatBalanceAndCurrency(tradeHash) {
        const trade = await this.getTradeOrDie(tradeHash);

        return {
            currency: trade.expectedFiatCurrency,
            balance: new Big(trade.fiatBalance),
            expectedAmount: new Big(trade.expectedFiatAmount)
        }
    }

    async updateBalance(tradeHash, newBalance) {
        await this.updateTrade(tradeHash, async (trade) => {
            trade.fiatBalance = newBalance.toNumber();

            return trade;
        })
    }

    // async markCompleted(tradeHash) {
    //     await this.releaseCrypto(tradeHash);
    //     await this.paxfulApi.invoke('/paxful/v1/feedback/give', {
    //         trade_hash: tradeHash,
    //         message: 'Good business partner!',
    //         rating: 1
    //     });
    // }

    async isFiatPaymentReceivedInFullAmount(tradeHash) {
        const trade = await this.getFiatBalanceAndCurrency(tradeHash);

        return trade.balance.eq(trade.expectedAmount) || trade.balance.gt(trade.expectedAmount);
    }

    async findTradeHashByPaymentReference(paymentReference) {
        const trades = await this.getTrades();

        let foundTradeHash = null;
        Object.keys(trades).forEach((tradeHash) => {
            const trade = trades[tradeHash];
            if (trade.expectedPaymentReference == paymentReference) {
                foundTradeHash = tradeHash;
            }
        })

        return foundTradeHash;
    }

    // async releaseCrypto(tradeHash) {
    //     if (!(await this.isFiatPaymentReceivedInFullAmount(tradeHash))) {
    //         throw new Error('You cannot release crypto for a trade which has not received a bank payment yet.');
    //     }

    //     await this.updateTrade(tradeHash, async (trade) => {
    //         await this.paxfulApi.invoke('/paxful/v1/trade/release', { trade_hash: tradeHash });
    //         trade.isCryptoReleased = true;

    //         return trade;
    //     })
    // }



    // Here we're relying on storing data in a JSON file. For a production use please re-implement to use
    // database
    // <persistence>:

    // private
    async getTrades() {
        if (!require('fs').existsSync(this.storageFilename)) {
            await fs.writeFile(this.storageFilename, JSON.stringify({}));
        }

        return await JSON.parse(await fs.readFile(this.storageFilename, 'binary'));
    }

    // private
    async getTrade(tradeHash) {
        return (await this.getTrades())[tradeHash];
    }

    // private
    async getTradeOrDie(tradeHash) {
        const trade = await this.getTrade(tradeHash);
        if (!trade) {
            throw new Error(`No trade found with trade hash - '${tradeHash}'.`);
        }

        return trade;
    }

    // private
    // async updateTrade(tradeHash, operation) {
    //     try {
    //         await lockfile.lock(this.storageFilename);
    //         const trades = await this.getTrades();

    //         if (!trades[tradeHash]) {
    //             throw new Error(`No trade found with trade hash - '${tradeHash}'.`);
    //         }
    //         const trade = trades[tradeHash];

    //         const updatedTrade = await operation(trade);
    //         if (!updatedTrade) {
    //             throw new Error('Updated trade cannot be empty.');
    //         }
    //         trades[tradeHash] = updatedTrade;

    //         await fs.writeFile(this.storageFilename, JSON.stringify(trades, null, 2));
    //     } finally {
    //         await lockfile.unlock(this.storageFilename);
    //     }
    // } 

    // private
    // async saveTrade(id, trade) {
    //     await lockfile.lock(this.storageFilename);
    //     const trades = await this.getTrades();
    //     trades[id] = trade;
    //     await fs.writeFile(this.storageFilename, JSON.stringify(trades, null, 2));
    //     await lockfile.unlock(this.storageFilename);
    // }

    // </persistence>
}

module.exports.TradesHandler = TradesHandler;