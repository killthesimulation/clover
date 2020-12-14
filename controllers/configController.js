const Config = require('../models/Config');
const PriceChange = require('../models/PriceChange');
const nodemailer = require('nodemailer');

exports.addPriceChange = function(price){
    return new Promise((resolve, reject) => {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonthIndex = currentDate.getMonth();
        const currentMonth = monthNames[currentMonthIndex];
        const currentYear = currentDate.getFullYear();
        const dateMaster = `${currentDay} ${currentMonth} ${currentYear}`;

        newPriceChange = new PriceChange({
            price: price,
            date: dateMaster,
            time: '12:00 GMT'
        })

        newPriceChange.save()
            .then(priceChange => {
                resolve(priceChange);
            })
            .catch(err => {
                reject(err);
            })

    })
}

exports.getPriceChange = function(){
    return new Promise((resolve, reject) => {
        PriceChange.find().sort({_id:-1}).limit(10)
            .then(priceChange => {
                resolve(priceChange)
            })
            .catch(err => {
                reject(err);
            })
    })
}

exports.configGetPrice = function(){
    return new Promise((resolve, reject) => {
        Config.findOne({ _id: '5f7d91778011548a5a92ae96' })
            .then(config => {
                const price = config.clvPriceUsd.toFixed(4);
                resolve(price);
            })
            .catch(err => {
                reject(err);
            })
    })
}

exports.configUpdatePrice = function(price){
    return new Promise((resolve, reject) => {
        Config.findOneAndUpdate({  _id: '5f7d91778011548a5a92ae96' }, {$set:{clvPriceUsd: price}}, {new: true})
            .then(config => {
                this.addPriceChange(price)
                    .then(priceChange => {
                        resolve(priceChange);
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
            .catch(err => {
                reject(err);
            })
    })
}


exports.configGetPercent = function(){
    return new Promise((resolve, reject) => {
        Config.findOne({ _id: '5f7d91778011548a5a92ae96' })
            .then(config => {
                const percent = config.referralPercent;
                resolve(percent);
            })
            .catch(err => {
                reject(err);
            })
    })
}



exports.configUpdatePercent = function(percent){
    return new Promise((resolve, reject) => {
        Config.findOneAndUpdate({  _id: '5f7d91778011548a5a92ae96' }, {$set:{referralPercent: (percent/100)}}, {new: true})
            .then(config => {
                resolve(config);
            })
            .catch(err => {
                reject(err);
            })
    })
}





exports.configGetPercent2 = function(){
    return new Promise((resolve, reject) => {
        Config.findOne({ _id: '5f7d91778011548a5a92ae96' })
            .then(config => {
                const percent = config.referralPercent2;
                resolve(percent);
            })
            .catch(err => {
                reject(err);
            })
    })
}



exports.configUpdatePercent2 = function(percent){
    return new Promise((resolve, reject) => {
        Config.findOneAndUpdate({  _id: '5f7d91778011548a5a92ae96' }, {$set:{referralPercent2: (percent/100)}}, {new: true})
            .then(config => {
                resolve(config);
            })
            .catch(err => {
                reject(err);
            })
    })
}



exports.configGetPercent3 = function(){
    return new Promise((resolve, reject) => {
        Config.findOne({ _id: '5f7d91778011548a5a92ae96' })
            .then(config => {
                const percent = config.referralPercent3;
                resolve(percent);
            })
            .catch(err => {
                reject(err);
            })
    })
}



exports.configUpdatePercent3 = function(percent){
    return new Promise((resolve, reject) => {
        Config.findOneAndUpdate({  _id: '5f7d91778011548a5a92ae96' }, {$set:{referralPercent3: (percent/100)}}, {new: true})
            .then(config => {
                resolve(config);
            })
            .catch(err => {
                reject(err);
            })
    })
}

exports.configGetDefaultBonusCap = function(){
    return new Promise((resolve, reject) => {
        Config.findOne({ _id: '5f7d91778011548a5a92ae96' })
        .then(config => {
            const defaultCap = config.defaultBonusCap;
            resolve(defaultCap);
        })
        .catch(err => {
            reject(err);
        })
    })
}

exports.configUpdateDefaultBonusCap = function(amount){
    return new Promise((resolve, reject) => {
        Config.findOne({ _id: '5f7d91778011548a5a92ae96' })
        .then(config => {
            config.defaultBonusCap = amount;
            config.save()
                .then(config => {
                    resolve(config);
                })
                .catch(err => {
                    reject(err);
                })
           
        })
        .catch(err => {
            reject(err);
        })
    })
}





exports.sendContactMessage = function (data) {
    return new Promise((resolve, reject) => {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });
    
        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.EMAIL,
            subject: `Contact form message from: ${data.firstName}`,
            html: `<h1>Contact Message</h1><br> From: ${data.firstName} ${data.lastName} <br> Email: ${data.email} <br><br><br> ${data.message}`
        }
    
        transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
                reject(err);
            }else{
                resolve('Email send');
            }
        })

    })
}
