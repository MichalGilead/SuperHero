const express = require('express');
const sqlConnection = require("./database");
const OCR = require("./products");
const getBasket = require("./getBasket");
const server = express();
const port = 3000;
const FOLDER_PATH = 'C:\\Users\\tomer\\WebstormProjects\\superhero3\\receipt_uploads\\';

//npm install --save body-parser
const bodyParser = require('body-parser');
server.use( bodyParser.json() );       // to support JSON-encoded bodies


server.listen(port, () => console.log("Server listening to port 3000"));

//sign in (query for name\password, return result)
server.get("/signin", (req,res) => {
    let sql = "SELECT * FROM User WHERE User.username = ? AND User.password = ?;";
    let get = [req.query.username, req.query.password];
    sqlConnection.query(sql, get,  (err, rows) => {
        if(err){
            console.log(err);
        }
        res.send(rows);
    });
});


//register new user, returns status 400 if already exists or 200 if registering correctly
server.post("/register", (req, res) => {
    let checkIfExists = "SELECT * FROM User WHERE User.email = ?;";
    let post = req.body.email;
    sqlConnection.query(checkIfExists, post, (err, rows) => {
        if (err) {
            console.log(err)
        } else if (rows.length) {
            res.sendStatus(400);
        } else { //register user
            let sql = "INSERT INTO User (username,password,email,credits) VALUES(?,?,?,2);";
            let params = [req.body.username, req.body.password, req.body.email];
            sqlConnection.query(sql, params, (err, rows) => {
                if (err) {
                    console.log(err);
                }
                res.sendStatus(200);
            });
        }
    });
});

//save products information from a receipt to DB
server.post("/OCR" , (req,res) => {
    OCR.postOCRProducts(req.body);
    res.sendStatus(200);
});

//get the cheapest basket!
server.post("/getBasket", (req, res) => {
    let products = Object.keys(req.body.products);
    let pid, sid, index;
    products = products.map(v => parseInt(v)); //parse to ints
    let shops = req.body.shops;
    getBasket.createPriceMatrix(shops, products, (priceMatrix) => {
        getBasket.findBestBasket(shops, products, req.body.maxSplits, priceMatrix, (bestBasket, bestBasketPrice) => {
            //make the basket into a json
            let resultObject = {};
            //for each sid, create an array  in the object
            for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
                resultObject[shops[shopIndex]] = [];
            }

            for (let basketIndex = 0; basketIndex < bestBasket.length; basketIndex++) {
                pid = products[basketIndex]; //get product pid
                index = shops[bestBasket[basketIndex]].toString();
                resultObject[index].push(pid); //insert pid to the relevant shop
            }
            resultObject["price"] = bestBasketPrice;
            //Now to add prices if product's amount is >1.
            for (let i = 0; i < products.length; i++) {
                pid = products[i];
                sid = bestBasket[i];
                if (req.body.products.hasOwnProperty(pid)) {
                    if (req.body.products[pid] > 1) {
                        resultObject["price"] += ((req.body.products[pid] - 1) * priceMatrix[i][sid]);
                    }
                }
            }
            res.send(resultObject);
        });

    });
});

//insert new receipt to the DB
server.post("/uploadReceipt", (req, res) => {
    let sql = "INSERT INTO Receipt (sid,sum,filled) VALUES(?,?,FALSE);";
    let params = [req.body.sid, req.body.sum];
    sqlConnection.query(sql, params, (err, rows) => {
        if (err) {
            console.log(err);
        }
        let maxId = 0;
        let sql1 = "SELECT MAX(id) FROM Receipt;";
        sqlConnection.query(sql1, (err1, ans) => {
            if(err1){
                console.log(err1);
            }
            maxId = (JSON.parse(JSON.stringify(ans)))[0]["MAX(id)"];
            let newPath = FOLDER_PATH+maxId+'.jpg';
            let sql2 = "UPDATE Receipt SET img = ? WHERE id = ?;";
            let params2 = [newPath, maxId];
            sqlConnection.query(sql2, params2, (err2, rows2) => {
                if (err2) {
                    console.log(err2);
                }
                res.sendStatus(200);
            });
        });
    });
});

//get a random unfilled receipt from db, pass to client
server.get("/OCR", (req,res) => {
    let sql = "SELECT * FROM Receipt WHERE Receipt.filled <> TRUE ORDER BY RAND() LIMIT 1;";
    sqlConnection.query(sql,  (err, rows) => {
        if(err){
            console.log(err);
        }
        res.send(rows);
    });
});
