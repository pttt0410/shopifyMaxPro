
***MaxPro - Team Intern GCALLS 2016***
======================================

# MAXPRO
MaxPro is a shopify app used to connect shops.
Maximize your profit not by competition but by cooporation
## Features
* Easy set up and sign in throught Shopify, not need to have an private account.<br />
  ![alt tag](images/1.png)
  <br /><br />
* Seamless intergration of Maxpro with your store and your partners.<br />
  ![alt tag](images/2.png)
  <br /><br />
* Link your store with your partners to expand market.<br />
  ![alt tag](images/3.png)
  <br /><br />
* Increase your sales upon promoting your products better.<br />
  ![alt tag](images/4.png)
  <br /><br />
* Increased accessibility to customers<br />
  ![alt tag](images/5.png)
  <br /><br />
* Get more passive profit without effort<br />
  ![alt tag](images/6.png)
  <br /><br />

## Geting Started
### Prerequisities
 - A working database connection MongoDB.
    - install mongodb-org
 ```sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6```
``` echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list ```
``` sudo apt-get update```
``` sudo apt-get install -y mongodb-org ```
``` sudo service mongod start```

    + Create a database name MaxPro, you can change it if you want but later on you will have to define it in code. 
 - Nodejs, npm, git.
```curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential npm git
```
### Installation
&nbsp;Git clone or download project as zip and use SublimeText in Ubuntu to build and run

**Project folder**
```shell
MaxPro-master
├── config
│   └── mongo.js
│   └── token.js
├── controller
│   └── server.js
├── entity
│   ├── session.js
│   ├── shop.js
│   ├── socket.js
│   └── transaction.js
├── key
│   ├── cert.pem
│   ├── key.pem
│   └── passphrase.js
├── model
│   └── database.js
├── static
│   ├── assets
│   │ ├── 0.png
│   │ ├── 1.png
│   │ ├── 2.png
│   │ ├── logo.png
│   │ └── main-icon.pngn
│   └── css
│     └── appStyle.css
├── views
│   ├── escape_iframe.ejs
│   ├── firstq.ejs 
│   ├── get_ads.ejs
│   ├── layout.ejs
│   ├── main.ejs
│   ├── maxproscript.ejs
│   ├── menu.ejs
│   └── set_ads.ejs
└── app.js

9 directories, 26 files
```


### Install dependencies

**Step 1 Install `source` which will also include the web app**

    git clone https://github.com/kimvu3010/MaxPro.git

**Step 2 go into the web app directory**

    cd <SavePath>/MaxPro-master

**Step 3 install dependencies**

    npm install

**Step 4 edit `config/mongo.js` by setting database and database_conn to your values**

**Step 5 run the app**

    node app.js

*If you see something like this*

    Server is running on port 3000.

Then everything is okay, change your app setting and install it to your store to use.
If you experience anything different, redo the steps and make sure you did them in order and with no errors.

## Deployment
### Certifications
- Add your keyfile  
    `cd <SavePath>/MaxPro-master/key/key.pem`
    `cd <SavePath>/MaxPro-master/key/cert.pem`
- Add your passphrase 
    `cd <SavePath>/MaxPro-master/key/passphrase.js`
- Add your shopify key
    `cd <SavePath>/MaxPro-master/config/token.js`

    ```module.exports = {
    API_KEY: <Your_API_key>,
    API_SECRET: <Your_API_secret>
};```

### Shopify post script
*Shopify doesn't allow us to post script with http and local address, in my app I use ngrok to test. So you have to change those into your own https address. Search for "ngrok" in file server.js to change.*

## Build with
* Express Framework Nodejs (https://expressjs.com/)
* IOSocket (https://socket.io/)
* shopify-node-api (https://www.npmjs.com/package/shopify-node-api
* shopify-api-node (https://www.npmjs.com/package/shopify-api-node)
* MongoDBConnector (https://www.npmjs.com/package/connect-mongodb-session)
* ...

## Authors
 &nbsp; Kim Vu <vu.kim.3010@gmail.com> - Interns at GCALLS Company<br />
 &nbsp; Minh Thai <tnminh.vn@gmail.com> - Interns at GCALLS Company<br />
 &nbsp; Lien Nguyen <thuylien2301@gmail.com> - Interns at GCALLS Company
# License
&nbsp;This project is licensed under the MIT License

## Feedback

All feedback is welcome. Let me know if you have any suggestions, questions, or criticisms. 
