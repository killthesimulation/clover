const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcryptjs');
const functions = require('../tools/functions');
const paypal = require('paypal-rest-sdk');
const coinbase = require('coinbase-commerce-node');
const Client = coinbase.Client;
const { ensureAuthenticated } = require('../config/auth');
const request = require('request');


//CoinBase Init Client
Client.init(process.env.COINBASE2);




//Controllers connect
const walletController = require('../controllers/walletController');
const cloverController = require('../controllers/cloverController');
const transactionController = require('../controllers/transactionController');
const configController = require('../controllers/configController');
const resetRequestController = require('../controllers/resetRequestController');



//Models connect
const Wallet = require('../models/Wallet');
const ResetRequest = require('../models/ResetRequest');






//Login page
router.get('/login', (req, res) => res.render('login'));



//Create page
router.get('/create', (req, res) => {

    walletController.getUserGeoInfo(req)
        .then(geo => {
            console.log(geo);
            if (req.query.referral) {
                const referral = req.query.referral;
                res.render('create', {
                    referral,
                    phone: geo.dialCode
                })
            } else {
                res.render('create', {
                    phone: geo.dialCode
                });
            }
        })
        .catch(err => {
            console.log(err);
        })

});


//Create handle

router.post('/create', (req, res) => {
    walletController.createWallet(req, res)
        .then(wallet => {
            cloverController.giveSignUpReferralBonus(wallet._id, wallet.referralSource, wallet.codeReferral)
                .then(result => {
                    console.log(result);
                })
                .catch(err => {
                    console.log(err);
                })
        })
        .catch(err => {
            console.log(err);
        })
})


//Login handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/wallet/login',
        failureFlash: true
    })(req, res, next);
});

//Logout handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/wallet/login');
})


router.get('/forgot', (req, res) => {
    res.render('forgot');
})


router.post('/forgot', (req, res) => {
    const { email } = req.body;
    Wallet.findOne({ email: email })
        .then(wallet => {
            if (wallet) {
                const requestId = functions.resetPasswordGenerate();

                resetRequestController.createResetRequest(requestId, email)
                    .then(resetRequest => {

                        resetRequestController.sendResetRequest(requestId, email)
                            .then(message => {
                                req.flash('success_msg', 'Please check your email, follow the link and change your password');
                                res.redirect('/wallet/forgot');
                            })
                            .catch(err => {
                                req.flash('error_msg', "Something went wrong");
                                res.redirect('/wallet/forgot');
                            })

                    })
                    .catch(err => {
                        req.flash('error_msg', "Something went wrong");
                        res.redirect('/wallet/forgot');
                    })



            } else {
                req.flash('error_msg', "This email doesn't exist");
                res.redirect('/wallet/forgot');
            }
        })
})


router.get('/reset', (req, res) => {
    const requestId = req.query.password;
    res.render('reset', {
        requestId
    })
})



router.post('/reset', (req, res) => {
    const { requestId, password, password2 } = req.body;
    resetRequestController.findResetRequest(requestId)
        .then(resetRequest => {

            //Check password match
            if (password !== password2) {
                req.flash('error_msg', "Passwords do not match.");
                res.redirect(req.get('referer'));
            } else if( password.length < 6){
                req.flash('error_msg', "Password should be at least 6 characters.");
                res.redirect(req.get('referer'));
            } else {
                bcrypt.genSalt(10, (err, salt) =>
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        walletController.updateWalletPassword(resetRequest.email, hash)
                            .then(wallet => {
                                req.flash('success_msg', 'You have successfully changed your password');
                                res.redirect('/wallet/login');
                            })
                            .catch(err => {
                                req.flash('error_msg', "Something went wrong");
                                res.redirect('/wallet/forgot');
                            })

                    })
                )


            }
        })
        .catch(err => {
            console.log(err);
        })


})



paypal.configure({
    'mode': process.env.PAYPALMODE,
    'client_id': process.env.PAYPALID,
    'client_secret': process.env.PAYPALSECRET
});



//Pay handle
router.post('/pay', ensureAuthenticated, (req, res) => {
    configController.configGetPrice()
        .then(price => {

            const id = req.body.walletId;
            const quantity = req.body.quantity;
            const bonus = req.body.bonus;
            const total = quantity * price;
            const roundedTotal = Math.round((total + Number.EPSILON) * 100) / 100;
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                
                
                    "return_url": `https://clovercountry.org/wallet/success/?id=${id}&quantity=${quantity}&total=${roundedTotal}&bonus=${bonus}`,
                    "cancel_url": "https://clovercountry.org/wallet/cancel"


             


                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": `- Clover: ${quantity} CLV`,
                            "price": roundedTotal,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": roundedTotal
                    },
                    "description": "Clover Citizen Membership Subscription."
                }]
            };





            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    for (let i = 0; i < payment.links.length; i++) {
                        if (payment.links[i].rel === 'approval_url') {
                            res.redirect(payment.links[i].href);
                        }
                    }
                }
            });



        })


})


router.get('/cancel', ensureAuthenticated, (req, res) => {
    res.redirect('/exchange');
})



router.get('/success', ensureAuthenticated, (req, res) => {
    const id = req.query.id;
    const clvAmount = req.query.quantity;
    const usdTotal = req.query.total;
    const payerId = req.query.PayerID;
    const bonus = req.query.bonus;
    const paymentId = req.query.paymentId;


    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": usdTotal
            }
        }]
    };


    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            res.redirect('/dashboard');
        } else {
            walletController.findWallet(id)
                .then(wallet => {
                    cloverController.mintPremiumClv(id, clvAmount, wallet, 'PayPal', 'Buy')
                        .then(premiumClv => {
                            cloverController.ReferralClvMaster(wallet.referralSource, clvAmount, wallet.codeReferral)
                                .then(referralClv => {
                                    cloverController.addBonus(id, clvAmount, bonus, wallet, 'None', 'Bonus')
                                                .then(bonus => {
                                                    res.redirect('/dashboard');
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.redirect('/dashboard');
                                                })
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.redirect('/dashboard');
                                })
                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect('/dashboard');
                        })
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/dashboard');
                })
        }
    })
})



router.post('/crypto', ensureAuthenticated, (req, res) => {


    configController.configGetPrice()
        .then(price => {
            const id = req.body.walletId;
            const quantity = req.body.quantity;
            const bonus = req.body.bonus;
            const total = quantity * price;
            const roundedTotal = Math.round((total + Number.EPSILON) * 100) / 100;



            const Charge = coinbase.resources.Charge;
            const chargeData = {
                'name': `${quantity} CLV`,
                'description': `Buy ${quantity} CLV`,
                'local_price': {
                    'amount': roundedTotal,
                    'currency': 'USD'
                },
                'pricing_type': 'fixed_price',
                "redirect_url": `https://clovercountry.org/wallet/successCrypto/?id=${id}&quantity=${quantity}&total=${roundedTotal}&bonus=${bonus}`,
                "cancel_url": "https://clovercountry.org/wallet/cancel"

            }
            Charge.create(chargeData, function (error, response) {
                if (error) {
                    console.log(error);
                } else {
                    res.redirect(response.hosted_url);
                }
            });





        })
        .catch(err => {
            console.log(err);
        })

})



router.get('/successCrypto', ensureAuthenticated, (req, res) => {
    const id = req.query.id;
    const clvAmount = req.query.quantity;
    const bonus = req.query.bonus;
    const usdTotal = req.query.total;

    walletController.findWallet(id)
                .then(wallet => {
                    cloverController.mintPremiumClv(id, clvAmount, wallet, 'Crypto', 'Buy')
                        .then(premiumClv => {
                            cloverController.ReferralClvMaster(wallet.referralSource, clvAmount, wallet.codeReferral)
                                .then(referralClv => {
                                    cloverController.addBonus(id, clvAmount, bonus, wallet, 'None', 'Bonus')
                                                .then(bonus => {
                                                    res.redirect('/dashboard');
                                                })
                                                .catch(err => {
                                                    console.log(err);
                                                    res.redirect('/dashboard');
                                                })
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.redirect('/dashboard');
                                })
                        })
                        .catch(err => {
                            console.log(err);
                            res.redirect('/dashboard');
                        })
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/dashboard');
                })
    
})






module.exports = router;
