const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const Wallet = require('../models/Wallet');
const functions = require('../tools/functions');
const Transaction = require('../models/Transaction');
const Config = require('../models/Config');
const PartyReferralCode = require('../models/PartyReferralCode');
const request = require('request');




//Controllers
const cloverController = require('../controllers/cloverController');
const configController = require('../controllers/configController');
const walletController = require('../controllers/walletController');
const transactionController = require('../controllers/transactionController');
const bonusCapController = require('../controllers/bonusCapController');
const partyReferralCodeController = require('../controllers/partyReferralCodeController');



//Pages
router.get('/', (req, res) => res.render('index'));

router.get('/mission', (req, res) => res.render('mission'));

router.get('/citizenship', (req, res) => {
    configController.configGetPrice()
        .then(price => {
            res.render('citizenship', {
                price10: (10 * price).toFixed(4),
                price50: (50 * price).toFixed(4),
                price250: (250 * price).toFixed(4),
                price1000: (1000 * price).toFixed(4),
            })
        })
});

router.get('/statistics', (req, res) => {
    cloverController.getClvAmount()
        .then(clvAmount => {
            walletController.getWalletsAmount()
                .then(walletsAmmount => {
                    configController.configGetPrice()
                        .then(price => {
                            transactionController.getTransactionsAmount()
                                .then(transactionsAmount => {




                                    walletController.getFemalePercent()
                                        .then(percent => {




                                            configController.getPriceChange()
                                                .then(priceChange =>{

                                                    const marketCap = (100000000000 * price).toFixed(0);
                                                    const formatedMarketCap = functions.numberWithSpaces(marketCap);
                                                    const formatedClvSold = functions.numberWithSpaces(clvAmount.toFixed(0));
                
                                                  
                
                                                    res.render('statistics', {
                                                        citizens: walletsAmmount,
                                                        marketCap: formatedMarketCap,
                                                        clvSold: formatedClvSold,
                                                        operationsAmount: transactionsAmount+95,
                                                        price: price,
                                                        female: percent,
                                                        priceChange: priceChange
                                                    });

                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                })






                                     





        
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.redirect('/');
                                        })


                                



                                })
                                .catch(err => {
                                    console.log(err);
                                    res.redirect('/');
                                })
                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect('/');
                        })
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/');
                })
        })
        .catch(err => {
            console.log(err);
            res.redirect('/');
        })
})

router.get('/faq', (req, res) => res.render('faq'));

router.get('/contact', (req, res) => res.render('contact'));

router.post('/contact', (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const captcha = req.body['g-recaptcha-response'];
    let errors = [];

       //Check captcha
    if (captcha === undefined || captcha === '' || captcha === null) {
        errors.push({ msg: 'Please complete the Captcha' });
    }


        //Secret key
        const secretKey = process.env.CAPTCHA;
        //reCaptcha verify URL
        const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;
        //Make request to verify
        request(verifyUrl, (err, response, body) => {
            body = JSON.parse(body);
    
            if (body.success !== undefined && !body.success) {
                errors.push({ msg: 'Please complete the Captcha' })
            }
    
    
        })


        if (!firstName || !email || !message) {
            errors.push({ msg: 'Please fill in all fields' })
        }



        if (errors.length > 0) {
            res.render('contact', {
                errors,
                firstName,
                lastName,
                email,
                message
            });
        }else{
            const data = {
                firstName,
                lastName,
                email,
                message
            }
            configController.sendContactMessage(data)
                .then(result => {
                    console.log(result);
                    req.flash('success_msg', 'Your message has been submitted!');
                    res.redirect('/contact');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/contact');
                })
                
        }

})


router.get('/dashboard', ensureAuthenticated, (req, res) => {
    cloverController.getPremiumClv(req.user.id)
        .then(premiumClv => {
            cloverController.getReferralClv(req.user.id)
                .then(referralClv => {
                    configController.configGetPrice()
                        .then(price => {
                            cloverController.getFreeClv(req.user.id)
                                .then(freeClv => {

                               
                                    cloverController.getClvAmount()
                                        .then(amount => {




                                            cloverController.getAllClvForDashboard(req.user.id) 
                                                .then(allClv => {

                                                    
                                                let premiumClvAmount;
                                                let clvTotal;
                                                let usdTotal;


                                                if(req.user.id === '5f5f0dc069ed595ce6e15928'){
                                                    const clvLeft = 100000000000 - amount;
                                                    premiumClvAmount = 100000000000 - amount;
                                                    clvTotal = premiumClvAmount;
                                                    usdTotal = clvLeft * price;
                                                }else{
                                                    premiumClvAmount = premiumClv.amount;
                                                    clvTotal = (Number(premiumClv.amount) + Number(freeClv.amount)).toFixed(4);
                                                    usdTotal = (Number(premiumClv.usd) + Number(freeClv.usd) + Number(req.user.usdBonus)).toFixed(4);
                                                }

                                                
                                            
                                        
                                                res.render('dashboard', {
                                                    layout: 'dashboardLayout',
                                                    price,
                                                    clvTotal,
                                                    usdTotal,
                                                    email: req.user.email,
                                                    firstName: req.user.firstName,
                                                    lastName: req.user.lastName,
                                                    premiumClvAmount,
                                                    freeClv: freeClv.clv,
                                                    freeClvAmount: freeClv.amount - referralClv.amount,
                                                    usdBonus: req.user.usdBonus,
                                                    referralClvAmount: (referralClv.amount).toFixed(4),
                                                    premiumClv: premiumClv.clv,
                                                    referralClv: referralClv.clv,
                                                    allClv: allClv.clv
                                                })

                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.redirect('/dashboard')
                                                })















                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.redirect('/dashboard')
                                        })


                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect('/dashboard')
                        })
                        
                    })


                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/dashboard')
                })

        })
        .catch(err => {
            console.log(err);
            res.redirect('/dashboard')
        })
})

router.get('/exchange', ensureAuthenticated, (req, res) => {
    configController.configGetPrice()
        .then(price => {
            res.render('exchange', {
                layout: 'dashboardLayout',
                walletId: req.user.id,
                price10: (price * 10).toFixed(4),
                price50: (price * 50).toFixed(4),
                price250: (price * 250).toFixed(4),
                price1000: (price * 1000).toFixed(4)
            })
        })
})

router.get('/transactions', ensureAuthenticated, (req, res) => {
    transactionController.findTransactions(req.user.id)
        .then(transactions => {
            res.render('transactions', {
                layout: 'dashboardLayout',
                transactions
            })
        })

})

router.get('/referral', ensureAuthenticated, (req, res) => {
    walletController.findReferralAmount(req.user.codeReferral)
        .then(referrals => {
            configController.configGetPercent()
                .then(percent => {
                    cloverController.getReferralClv(req.user.id)
                        .then(clv => {

                         

                            walletController.findPartyReferralAmount(req.user.codeReferral)
                                .then(partyReferrals => {

                                 

                                    res.render('referral', {
                                        layout: 'dashboardLayout',
                                        clvAmount: (clv.amount).toFixed(4),
                                        usdAmount: clv.usd,
                                        percent: percent * 100,
                                        amount: referrals.amount + partyReferrals.amount,
                                        referrals: referrals.referrals,
                                        partyReferrals: partyReferrals.referrals,
                                        code: req.user.codeReferral,
                                        referralClv: clv.clv,
                                        link: 'https://clovercountry.org/wallet/create/?referral=' + req.user.codeReferral,
                                    })

                                })
                                .catch(err => {
                                    console.log(err);
                                })




                           



                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect('/dashboard')
                        })


                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/dashboard')
                })

        })
        .catch(err => {
            console.log(err);
            res.redirect('/dashboard')
        });

})



module.exports = router;
