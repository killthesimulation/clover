const Clover = require('../models/Clover');
const Wallet = require('../models/Wallet');
const PartyReferralCode = require('../models/PartyReferralCode');
const walletController = require('../controllers/walletController');
const configController = require('../controllers/configController');
const bonusCapController = require('../controllers/bonusCapController');
const transactionController = require('../controllers/transactionController');



exports.mintPremiumClv = function (id, amount, wallet, paid, type) {
    return new Promise((resolve, reject) => {
        const newPremiumClv = new Clover({
            amount: amount,
            owner: id,
            type: 'premium'
        });

        newPremiumClv.save()
            .then(premiumClv => {
                transactionController.createTransaction(wallet, amount, paid, type)
                    .then(transaction => {
                        resolve(transaction)
                    }).catch(err => {
                        reject(err);
                    })
            })
            .catch(err => {
                reject(err);
            })
    })
}

exports.mintFreeClv = function (id, amount, wallet, paid, type) {
    return new Promise((resolve, reject) => {
        const newFreeClv = new Clover({
            amount: amount,
            owner: id,
            type: 'free'
        });

        newFreeClv.save()
            .then(freeClv => {
                transactionController.createTransaction(wallet, amount, paid, type)
                    .then(transaction => {
                        resolve(transaction)
                    }).catch(err => {
                        reject(err);
                    })
            })
            .catch(err => {
                reject(err);
            })
    })
}


exports.ReferralClvMaster = function (referralCode, boughtAmount, source) {
    return new Promise((resolve, reject) => {


        configController.configGetPercent()
            .then(percent => {

                const referralAmount = Number(percent) * Number(boughtAmount);


                if(referralCode.length === 6 || referralCode.length === 7){

                    if(referralCode.length === 6){

                        Wallet.findOne({ codeReferral: referralCode})
                            .then(wallet => {
                                
                                if(wallet){

                                    this.mintReferralClv(wallet._id, referralAmount, source,  wallet, 'None', 'Referral')
                                        .then(referralClv => {
                                            resolve(referralClv);
                                        })
                                        .catch(err => {
                                            reject(err);
                                        })

                                }else{
                                    

                                    //Wrong referral code so send referrals to agape wallet

                                    Wallet.findOne({_id: '5f6f3f09f11bf8242bc2983f'})
                                        .then(wallet => {
                                            this.mintReferralClv(wallet._id, referralAmount, source,  wallet, 'None', 'Referral')
                                                .then(referralClv => {
                                                    resolve(referralClv);
                                                })
                                                .catch(err => {
                                                    reject(err);
                                                })
                                            })
                                            .catch(err => {
                                                reject(err);
                                            })

                                    


                                    

                                }
                            })
                            .catch(err => {
                                reject(err);
                            })

                    }else if(referralCode.length === 7){

                        //Party referral code

                        PartyReferralCode.findOne( { codeReferral: referralCode} )
                            .then(partyReferralCode => {

                                if(partyReferralCode){

                                    partyReferralCode.users.forEach(user => {
                                        Wallet.findOne({ codeReferral: user.referralCode })
                                            .then(wallet => {

                                                const userPercent = user.percent / 100;
                                                const referralPart = (referralAmount * userPercent).toFixed(4);
                                                this.mintReferralClv(wallet._id, referralPart, source, wallet, 'None', 'Referral')
                                                    .then(referralClv => {
                                                        // console.log(referralClv);
                                                    })
                                                    .catch(err => {
                                                        console.log(err);
                                                    })

                                            })
                                            .catch(err => {
                                                console.log(err);
                                            })
                                    })

                                    resolve('Success');

                                }else{

                                     //Wrong referral code so send referrals to agape wallet

                                    Wallet.findOne({_id: '5f6f3f09f11bf8242bc2983f'})
                                    .then(wallet => {
                                        this.mintReferralClv(wallet._id, referralAmount, source,  wallet, 'None', 'Referral')
                                            .then(referralClv => {
                                                resolve(referralClv);
                                            })
                                            .catch(err => {
                                                reject(err);
                                            })
                                        })
                                        .catch(err => {
                                            reject(err);
                                        })

                                }

                            })
                            .catch(err => {
                                reject(err);
                            })
                        



                    }

                }else{
                    
                    //Wrong referral code so send referrals to agape wallet

                    Wallet.findOne({_id: '5f6f3f09f11bf8242bc2983f'})
                    .then(wallet => {
                        this.mintReferralClv(wallet._id, referralAmount, source,  wallet, 'None', 'Referral')
                            .then(referralClv => {
                                resolve(referralClv);
                            })
                            .catch(err => {
                                reject(err);
                            })
                        })
                        .catch(err => {
                            reject(err);
                        })



                }


            })
            .catch(err => {
                reject(err);
            })





    })
}




exports.mintReferralClv = function (ownerId, amount, source, wallet, paid, type) {
    return new Promise((resolve, reject) => {
        const newReferralClv = new Clover({
            amount: amount,
            owner: ownerId,
            type: 'free',
            subType: 'referral',
            source: source
        });
        newReferralClv.save()
            .then(referralClv => {
                transactionController.createTransaction(wallet, amount, paid, type)
                    .then(transaction => {
                        resolve(transaction)
                    }).catch(err => {
                        reject(err);
                    })
            })
            .catch(err => {
                reject(err);
            })
    })
}



exports.addBonus = function (id, amount, percent, wallet, paid, type) {
 
    return new Promise((resolve, reject) => {

        if(percent >= 0) {

        const total = amount;

        const newFreeClv = new Clover({
            amount: total,
            owner: id,
            type: 'free'
        });

        newFreeClv.save()
            .then(freeClv => {
                transactionController.createTransaction(wallet, total, paid, type)
                    .then(transaction => {
                        resolve(transaction)
                    }).catch(err => {
                        reject(err);
                    })
            })
            .catch(err => {
                reject(err);
            })

        }else{
            resolve('Success');
        }

    })

}


exports.giveSignUpReferralBonus = function (id, referralCode, source) {
    return new Promise((resolve, reject) => {
        if(referralCode.length === 6 || referralCode.length === 7){

            if(referralCode.length === 6){

                Wallet.findOne({ codeReferral: referralCode})
                    .then(wallet => {
                        if(wallet){
                            bonusCapController.checkBonusCap(wallet.codeReferral)
                                .then(result => {
                                    configController.configGetPrice()
                                        .then(price => {

                                            const amount = (5 / price).toFixed(4);

                                            if(result){
                                                this.mintReferralClv(wallet._id, amount, source, wallet, 'None', 'Bonus')
                                                    .then(referralClv => {


                                                        Wallet.findOne({_id: id})
                                                            .then(wallet2 => {


                                                                this.mintReferralClv(wallet2._id, amount, wallet.codeReferral, wallet2, 'None', 'Bonus')
                                                                    .then(referralClv => {
                                                                        bonusCapController.increaseBonusCapValue(wallet.codeReferral)
                                                                            .then(bonusCap => {
                                                                                resolve(bonusCap);
                                                                            })
                                                                            .catch(err => {
                                                                                reject(err);
                                                                            })
                                                                    })
                                                                    .catch(err => {
                                                                        reject(err);
                                                                    })
    


                                                            })
                                                            .catch(err => {
                                                                reject(err);
                                                            })

                                                    



                                                    })
                                                    .catch(err => {
                                                        reject(err);
                                                    })
                                            }else{

                                                //Not allowed to get bonus but give bonus to user2
                                                Wallet.findOne({_id: id})
                                                    .then(wallet3 => {

                                                        this.mintReferralClv(wallet3._id, amount, wallet.codeReferral, wallet3, 'None', 'Bonus')
                                                            .then(referralClv => {
                                                                resolve(referralClv);
                                                            })
                                                            .catch(err => {
                                                                reject(err);
                                                            })

                                                    })
                                                    .catch(err => {
                                                        reject(err);
                                                    })


                                                
                                                    

                                            }

                                        })
                                        .catch(err => {
                                            reject(err);
                                        })
                                })
                                .catch(err => {
                                    reject(err);
                                })
                        }else{
                            reject("Wrong referral code")
                        }
                    })
                    .catch(err => {
                        reject(err);
                    })

            }else if(referralCode.length === 7){


                //party code section


                PartyReferralCode.findOne( { codeReferral: referralCode} )
                    .then(partyReferralCode => {
                        if(partyReferralCode){

                            bonusCapController.checkBonusCap(partyReferralCode.codeReferral)
                                .then(result => {
                                    configController.configGetPrice()
                                        .then(price => {

                                            const amount = (5 / price).toFixed(4);

                                            if(result){

                                                partyReferralCode.users.forEach(user => {
                                                    Wallet.findOne({ codeReferral: user.referralCode })
                                                        .then(wallet => {
                                                            const userPercent = user.percent / 100;
                                                            const referralPart = (amount * userPercent).toFixed(4);
                                                            this.mintReferralClv(wallet._id, referralPart, source, wallet, 'None', 'Bonus')
                                                                .then(referralClv => {
                                                                   // console.log(referralClv);
                                                                })
                                                                .catch(err => {
                                                                    console.log(err);
                                                                })
                                                        })
                                                        .catch(err => {
                                                            console.log(err);
                                                        })
                                                })



                                                Wallet.findOne({_id: id})
                                                    .then(wallet2 => {
                                                        this.mintReferralClv(wallet2._id, amount, referralCode, wallet2, 'None', 'Bonus')
                                                                .then(referralClv => {

                                                                    bonusCapController.increaseBonusCapValue(partyReferralCode.codeReferral)
                                                                        .then(bonusCap => {
                                                                            resolve(bonusCap);
                                                                        })
                                                                        .catch(err => {
                                                                            reject(err);
                                                                        })

                                                                })
                                                                .catch(err => {
                                                                    reject(err);
                                                                })
                                                    })
                                                    .catch(err => {
                                                        reject(err);
                                                    })

                                                








                                            }else{


                                                 //Not allowed to get bonus but give bonus to user2
                                                 Wallet.findOne({_id: id})
                                                    .then(wallet2 => {

                                                        this.mintReferralClv(wallet2._id, amount, referralCode, wallet2, 'None', 'Bonus')
                                                            .then(referralClv => {
                                                                resolve(referralClv);
                                                            })
                                                            .catch(err => {
                                                                reject(err);
                                                            })

                                                    })
                                                    .catch(err => {
                                                        reject(err);
                                                    })



                                                 


                                            }

                                        })
                                        .catch(err => {
                                            reject(err);
                                        })
                                })
                                .catch(err => {
                                    reject(err);
                                })

                        }else{
                            reject("Wrong referral code")
                        }
                    })
                    .catch(err => {
                        reject(err);
                    })



            }

        }else{
            reject("Wrong referral code")
        }
    })
}


exports.getPremiumClv = function (id) {
    return new Promise((resolve, reject) => {


        configController.configGetPrice()
            .then(price => {

                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                let premiumClvs = [];
                let premiumClvsAmount = 0;
                Clover.find({ owner: id, type: 'premium' })
                    .then(premiumClv => {
                        premiumClv.forEach(item => {
                            const datePurchased = item.dateCreated;
                            const datePurchasedFormated = `${datePurchased.getDate()} ${monthNames[datePurchased.getMonth()]} ${datePurchased.getYear() + 1900}`;
                            const lockDate = new Date(datePurchased.setMonth(datePurchased.getMonth() + 3));
                            const lockDateFormated = `${lockDate.getDate()} ${monthNames[lockDate.getMonth()]} ${lockDate.getYear() + 1900}`;
                            const clvItem = {
                                amount: item.amount,
                                usd: (Number(item.amount) * Number(price)).toFixed(4),
                                type: item.type,
                                created: datePurchasedFormated,
                                lock: lockDateFormated
                            }
                            premiumClvsAmount += item.amount;
                            premiumClvs.push(clvItem);
                        });

                        const data = {
                            clv: premiumClvs,
                            amount: premiumClvsAmount,
                            usd: (premiumClvsAmount * price).toFixed(4)
                        }

                        resolve(data);

                    })
                    .catch(err => {
                        reject(err);
                    })


            })
    })
}


exports.getReferralClv = function (id) {
    return new Promise((resolve, reject) => {


        configController.configGetPrice()
            .then(price => {


                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                let referralClvs = [];
                let referralClvsAmount = 0;
                Clover.find({ owner: id, subType: 'referral' })
                    .then(referralClv => {
                        referralClv.forEach(item => {
                            const datePurchased = item.dateCreated;
                            const datePurchasedFormated = `${datePurchased.getDate()} ${monthNames[datePurchased.getMonth()]} ${datePurchased.getYear() + 1900}`;
                            const lockDate = new Date(datePurchased.setYear(datePurchased.getFullYear() + 1));
                            const lockDateFormated = `${lockDate.getDate()} ${monthNames[lockDate.getMonth()]} ${lockDate.getYear() + 1900}`;
                            const clvItem = {
                                amount: item.amount,
                                usd: (Number(item.amount) * Number(price)).toFixed(4),
                                type: item.type,
                                created: datePurchasedFormated,
                                lock: lockDateFormated,
                                source: item.source
                            }
                            referralClvsAmount += item.amount;
                            referralClvs.push(clvItem);
                        });
                        const data = {
                            clv: referralClvs,
                            amount: referralClvsAmount,
                            usd: (referralClvsAmount * price).toFixed(4)
                        }

                        resolve(data);

                    })
                    .catch(err => {
                        reject(err);
                    })


            })


    })
}

exports.getFreeClv = function (id) {
    return new Promise((resolve, reject) => {


        configController.configGetPrice()
            .then(price => {


                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                let freeClvs = [];
                let freeClvsAmount = 0;
                Clover.find({ owner: id, type: 'free' })
                    .then(freeClv => {
                        freeClv.forEach(item => {
                            const datePurchased = item.dateCreated;
                            const datePurchasedFormated = `${datePurchased.getDate()} ${monthNames[datePurchased.getMonth()]} ${datePurchased.getYear() + 1900}`;
                            const lockDate = new Date(datePurchased.setYear(datePurchased.getFullYear() + 1));
                            const lockDateFormated = `${lockDate.getDate()} ${monthNames[lockDate.getMonth()]} ${lockDate.getYear() + 1900}`;

                            const clvItem = {
                                amount: item.amount,
                                usd: (Number(item.amount) * Number(price)).toFixed(4),
                                type: item.type,
                                created: datePurchasedFormated,
                                lock: lockDateFormated
                            }



                            freeClvsAmount += item.amount;
                            freeClvs.push(clvItem);
                        });
                        const data = {
                            clv: freeClvs,
                            amount: freeClvsAmount,
                            usd: (freeClvsAmount * price).toFixed(4)
                        }

                        resolve(data);

                    })
                    .catch(err => {
                        reject(err);
                    })


            })


    })
}

exports.getAllClvForDashboard = function (id) {
    return new Promise((resolve, reject) => {
        configController.configGetPrice()
        .then(price => {


            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            let clvs = [];
            let clvsAmount = 0;
            Clover.find({ owner: id })
                .then(clv => {
                    clv.forEach(item => {
                        const datePurchased = item.dateCreated;
                        const datePurchasedFormated = `${datePurchased.getDate()} ${monthNames[datePurchased.getMonth()]} ${datePurchased.getYear() + 1900}`;

			let lockDateFormated;
                        if(item.type === 'free'){
                            const lockDate = new Date(datePurchased.setYear(datePurchased.getFullYear() + 1));
                            lockDateFormated = `${lockDate.getDate()} ${monthNames[lockDate.getMonth()]} ${lockDate.getYear() + 1900}`;
                        }else if(item.type === 'premium'){
                            const lockDate = new Date(datePurchased.setMonth(datePurchased.getMonth() + 3));
                            lockDateFormated = `${lockDate.getDate()} ${monthNames[lockDate.getMonth()]} ${lockDate.getYear() + 1900}`;
                        }
                       

                        const clvItem = {
                            amount: item.amount,
                            usd: (Number(item.amount) * Number(price)).toFixed(4),
                            type: item.type,
                            created: datePurchasedFormated,
                            lock: lockDateFormated
                        }



                        clvsAmount += item.amount;
                        clvs.push(clvItem);
                    });
                    const data = {
                        clv: clvs,
                        amount: clvsAmount,
                        usd: (clvsAmount * price).toFixed(4)
                    }

                    resolve(data);

                })
                .catch(err => {
                    reject(err);
                })


        })
    })
}



exports.getClvAmount = function () {
    return new Promise((resolve, reject) => {
        let amount = 0;
        Clover.find({})
            .then(clvs => {
                clvs.forEach(item => {
                    amount += item.amount;
                })
                resolve(amount);
            })
            .catch(err => {
                reject(err);
            })
    })
}

exports.getPremiumClvAmount = function () {
    return new Promise((resolve, reject) => {
        let amount = 0;
        Clover.find({ type: 'premium' })
            .then(clvs => {
                clvs.forEach(item => {
                    amount += item.amount;
                })
                resolve(amount);
            })
            .catch(err => {
                reject(err);
            })
    })
}


exports.getFreeClvAmount = function () {
    return new Promise((resolve, reject) => {
        let amount = 0;
        Clover.find({ type: 'free' })
            .then(clvs => {
                clvs.forEach(item => {
                    amount += item.amount;
                })
                resolve(amount);
            })
            .catch(err => {
                reject(err);
            })
    })
}


exports.getReferralClvAmount = function () {
    return new Promise((resolve, reject) => {
        let amount = 0;
        Clover.find({ subType: 'referral' })
            .then(clvs => {
                clvs.forEach(item => {
                    amount += item.amount;
                })
                resolve(amount);
            })
            .catch(err => {
                reject(err);
            })
    })
}
