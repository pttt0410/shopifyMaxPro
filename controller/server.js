module.exports = function(app, db, ioSocket) {
    var session = require('express-session');
    var MongoDBStore = require('connect-mongodb-session')(session);
    var shopify = require('shopify-node-api');
    var assert = require('assert');
    const Shopify = require('shopify-api-node');

    // var OAuth = require('oauth').OAuth2;
    // var url = require('url');
    var ejs = require('ejs');
    var ObjectId = require('mongodb').ObjectId;
    var bodyParser = require('body-parser');
    var Promise = require('bluebird');
    var store = new MongoDBStore({
        uri: 'mongodb://localhost:27017/MaxPro',
        collection: 'session'
    });

    // Catch errors
    store.on('error', function(error) {
        assert.ifError(error);
        assert.ok(false);
    });
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(require('express-session')({
        secret: 'KIM3010',
        // cookie: {
        //     maxAge: 10000 * 60
        // },
        store: store,
        resave: true,
        saveUninitialized: true
    }));
    var token = require('../config/token');
    var API_KEY = token.API_KEY;
    var API_SECRET = token.API_SECRET;
    var Databases = require('../model/database');
    var Database = new Databases(db);

    var config = {
        verbose: false,
        shop: '',
        shopify_api_key: API_KEY, // Your API key
        shopify_shared_secret: API_SECRET, // Your Shared Secret
        shopify_scope: 'read_products,read_script_tags,write_script_tags',
        redirect_uri: 'http://localhost:3000/auth',
        nonce: 'KIM3010',
        // rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
        // backoff: 35, // limit X of 40 API calls => default is 35 of 40 API calls
        // backoff_delay: 1000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
    };

    app.get('/install', function(req, res) {
        req.session.config = {
            verbose: false,
            shop: '', // MYSHOP.myshopify.com
            shopify_api_key: API_KEY, // Your API key
            shopify_shared_secret: API_SECRET, // Your Shared Secret
            access_token: '', //permanent token
        };
        config.shop = req.query.shop;
        req.session.config.shop = req.query.shop;
        var shopNode = new shopify(config);
        var auth_url = shopNode.buildAuthURL();
        res.redirect(auth_url);
    });


    app.get('/auth', function(req, res) {
        var shopNode = new shopify(config); // You need to pass in your config here
        var query_params = req.query;
        shopNode.exchange_temporary_token(query_params, function(err, data) {
            if (err) res.send(err)
            else {
                console.log(data);
                req.session.config.access_token = data.access_token;
                shopNode = new shopify(req.session.config);
                shopNode.get('/admin/shop.json', function(err, data) {
                    if (err) res.send(err);
                    else {

                        req.session.name = data.shop.name;
                        console.log(req.session.config);
                        shopNode.get('/admin/webhooks/count.json?address=https://a8a18b41.ngrok.io/uninstall/', function(err, count) {
                            if (err) {
                                console.log('WEBHOOK: ' + error);
                            } else {
                                console.log(count);
                                if (count.count < 1) {
                                    var webhook_post = {
                                        'webhook': {
                                            "topic": "app\/uninstalled",
                                            "address": "https://a8a18b41.ngrok.io/uninstall/",
                                            "format": "json"
                                        }
                                    }
                                    shopNode.post('/admin/webhooks.json', webhook_post, function(error, result) {
                                        if (error)
                                            console.log(error);
                                        else {
                                            console.log(result);
                                            addScript(req.session.config, function() {
                                                res.redirect('/');
                                            });
                                        }
                                    });
                                } else {
                                    res.redirect('/');
                                }
                            }

                        });

                    }
                });
            }
        });
    });

    app.post('/uninstall', function(req, res) {
        var name = req.body.name;
        console.log(name);
        console.log(req.headers);
        Database.deleteAll('transaction', { $or: [{ 'name': name }, { 'partner': name }] }, {})
            .then((result) => Database.deleteAll("shop", { 'name': name }, {}))
            .then((result) => Database.deleteAll("socket", { 'name': name }, {}))
            .then((result) => {
                console.log(name + ' deleted from database.')
                res.sendStatus(200);
            })
            .catch((error) => {
                console.log(name + ' can not deleted from database.')
                res.sendStatus(404);
            })


    });

    app.get('/', function(req, res) {
        var shopNode = new shopify(req.session.config);
        Database.findwithfield("shop", { "name": req.session.name }, {})
            .then(
                (result) => {
                    if (result.length === 0)
                        res.redirect('/firstq');
                    else
                        res.redirect('/home');
                },
                (error) => res.send(error));


    });

    app.get('/firstq', function(req, res) {
        res.render('firstq', { name: req.session.name });
    });


    var addScript = function(config, callback) {
        var post_data = {
            "script_tag": {
                "event": "onload",
                "src": "https:\/\/a8a18b41.ngrok.io\/maxproscript.js",
                "display_scope": "online_store"
            }
        }
        var shopNode = new shopify(config);
        shopNode.get('/admin/script_tags.json?src=' + post_data.script_tag.src, function(error, data) {
            if (error) console.log("SRIPT TAG: " + error)
            else {
                if (data.script_tags.length == 0) {
                    shopNode.post('/admin/script_tags.json', post_data, function(error, data) {
                        if (error) {
                            console.log("POST SCRIPT ERROR");
                            console.log(error);
                        } else {
                            console.log('POSTED SCRIPT TAG');
                            console.log(data);
                            callback();
                        };
                    });
                } else callback();
            }
        })

    };

    app.post('/firstq', function(req, res) {
        var shopNode = new shopify(req.session.config);
        shopNode.get('/admin/shop.json', function(err, data) {
            if (err) res.send(err);
            else {
                Database.insert("shop", { name: data.shop.name, industry: req.body.industry, domain: data.shop.domain })
                    .then(
                        (result) => {
                            console.log("firstq: Added shop info to database");
                            res.redirect("/");
                        },
                        (error) => {
                            console.log("firstq: Can not add to database.");
                            res.send("ERROR!!!");
                        });
            };
        });
    });

    app.get('/escapeIframe', function(req, res) {
        res.render('escape_iframe', { CURRENT_LOGGED_IN_SHOP: req.session.config.shop, YOUR_APP_API_KEY: req.session.config.shopify_api_key });
    });

    app.get("/home", function(req, res) {
        Database.findwithfield("transaction", { 'name': req.session.name }, { 'name': 0 })
            .then(
                (table1) => {
                    Database.findwithfield("transaction", { 'partner': req.session.name }, { 'partner': 0 })
                        .then(
                            (table2) => {
                                res.render("main", { name: req.session.name, table1: table1, table2: table2 });
                            },
                            (error) => console.log("ERROR")
                        );
                },
                (error) => console.log("ERROR")
            );
    });

    app.delete('/home', function(req, res) {
        Promise.map(req.body.del_list, (element) => (Database.delete("transaction", { '_id': new ObjectId(element) }, {})))
            .then(
                (result) => {
                    res.json({ success: 1 });
                    console.log(result);
                    Database.findwithfield('socket', { $or: [{ 'name': result[0].value.name }, { 'name': result[0].value.partner }] }, {})
                        .then(
                            (to_send) => {
                                // console.log('sending io socket message to: ' + to_send);
                                if (to_send.length > 0) {
                                    to_send.forEach(function(element, index) {
                                        // console.log(element);
                                        ioSocket.sockets.connected[element.sid].emit("update", 'Request from ' + result[0].value.name + ' to ' + result[0].value.partner + ' is deleted');
                                    });
                                } else console.log("Can not find partner socket");
                            },
                            (err) => {
                                console.log('error when send to socket');
                            }
                        );


                },
                (error) => res.json({ error: 1 })
            );
    });

    app.get('/set_ads', function(req, res) {
        var shopNode = new shopify(req.session.config);
        shopNode.get('/admin/products.json?fields=title,image,id,variants', function(err, data) {
            if (err) res.send(err);
            else {
                Database.findwithfield("shop", { 'name': { $ne: req.session.name } }, { '_id': 0 })
                    .then(
                        (result) => res.render('set_ads', { name: req.session.name, productList: data.products, shopList: result }),
                        (error) => res.send(error));
            };
        });
    });

    app.post('/set_ads', function(req, res) {
        var shopNode = new shopify(req.session.config);
        var pdList = [];
        ids = req.body.productList.toString();
        shopNode.get('/admin/products.json?ids=' + ids, function(error, data) {
            if (error) console.log(error);
            else {
                data.products.forEach(function(element, index) {
                    pdList.push({
                        'id': element.id,
                        'title': element.title,
                        'img': element.image.src,
                        'url': 'https://' + req.session.config.shop + '/products/' + element.handle,
                        'price': element.variants[0].price
                    });
                });
                Database.findwithfield('transaction', { 'name': req.session.name, 'products': pdList }, {})
                    .then(
                        (result) => {
                            if (result.length === 0) {
                                var list = [];
                                req.body.partnerList.forEach(function(element, index) {
                                    list.push({
                                        'name': req.session.name,
                                        'partner': element,
                                        'status': 'pending',
                                        'pending': new Date(),
                                        'success': '',
                                        'products': pdList
                                    });
                                });
                                Database.insertMany("transaction", list)
                                    .then(
                                        (result) => {
                                            res.send("Success");
                                            Promise.map(req.body.partnerList, (element) => {
                                                return Database.findwithfield('socket', { 'name': element }, {})
                                                    .then(
                                                        (result) => {
                                                            console.log('sending io socket message to: ' + result);
                                                            if (result.length > 0) {
                                                                ioSocket.sockets.connected[result[0].sid].emit("update", req.session.name + ' sent you a request');
                                                            } else console.log("Can not find partner socket");

                                                        },
                                                        (error) => {
                                                            console.log('error when send to socket');
                                                        }
                                                    );
                                            });

                                        },
                                        (error) => res.status(404).send('Can not add your transaction to database'));
                            } else res.status(404).send("Set ads => ERROR: This transaction have already had in database");
                        },
                        (error) => res.send(error));

            };
        });
    });

    app.get('/get_ads', function(req, res) {
        var shopNode = new shopify(req.session.config);
        // shopNode.get('/admin/webhooks.json',function(error,data){
        //     if(error) console.log(error);
        //     else console.log(data);
        // });
        Database.findwithfield("transaction", { "partner": req.session.name, "status": "pending" }, { "partner": 0 })
            .then(
                (result) => {
                    res.render('get_ads', { name: req.session.name, pendingList: result });
                },
                (error) => {
                    console.log("Can not get transaction in db");
                    res.send(error);
                });
    });

    app.get('/get_ads/:id', function(req, res) {

        var shopNode = new shopify(req.session.config);
        Database.findwithfield('transaction', { '_id': new ObjectId(req.params.id) }, { 'products': 1 })
            .then(
                (result) => res.send(result[0].products),
                (error) => res.json({ error: 1 }));
    });

    app.post('/get_ads', function(req, res) {
        // console.log(req.body.response);
        // console.log(req.body.id);
        Database.update("transaction", { '_id': new ObjectId(req.body.id) }, { "status": req.body.response, 'success': Date() })
            .then(
                (result) => {
                    // console.log(result);
                    res.json({ success: 1 });
                },
                (error) => {
                    console.log('post get ads ERROR');
                    res.json({ error: 1 });
                })
    });

    function shuffle(a) {
        for (let i = a.length; i; i--) {
            let j = Math.floor(Math.random() * i);
            [a[i - 1], a[j]] = [a[j], a[i - 1]];
        }
        return a;
    }
    var build_adsList = function(tranc_info, callback) {
        var adsList = [];
        tranc_info.forEach(function(element, index) {
            adsList = adsList.concat(element.products);
        });
        for (i = 0; i < adsList.length; i++) {
            for (j = i + 1; j < adsList.length; j++)
                if (adsList[i].id == adsList[j].id)
                    adsList.splice(j, 1);
        }
        callback(shuffle(adsList).slice(0, 4));
    };

    app.get('/maxproscript.js', function(req, res) {
        console.log('req.query: ');
        // var shopNode = new shopify(req.session.config);
        console.log(req.query);
        Database.findwithfield('shop', { 'domain': req.query.shop }, {})
            .then(
                (result) => {
                    // console.log(result);
                    Database.findwithfield('transaction', { 'partner': result[0].name, 'status': 'allowed' }, {})
                        .then((tranc_info) => {
                                if (tranc_info.length > 0) {
                                    build_adsList(tranc_info, function(adsList) {
                                        // console.log(adsList);
                                        const filename = __dirname + '/../views/maxproscript.ejs';
                                        ejs.renderFile(filename, { adList: adsList }, function(err, str) {
                                            if (err) {
                                                res.send(err);
                                            } else {
                                                res.setHeader('content-type', 'text/javascript');
                                                res.send(str);
                                            }
                                        });
                                    });
                                }
                            },
                            (error) => console.log(error))
                },
                (error) => res.send(error));
    });

    app.get('/logout', function(req, res) {
        Database.deleteAll('session', { 'session': { 'config': { 'name': req.session.config.name } } })
            .then(
                (result) => res.json({ success: 1 }),
                (error) => res.json({ error: 1 })
            )
    });
}
