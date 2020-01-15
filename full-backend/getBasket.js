/*
A basket is represented as an array:
index i in the array is the product in index i in the "products" array
the valid at index i is the shop at the index of that value in the "shops" array
for example:
shops = [11, 22, 33]
products = [a, b, c, d]
basket = [2, 0, 2, 1]
the basket represents getting products a & c from shop 33 (index 2 in shops)
the product b from shop 11 and the product d from 22

the information is returned as a [basket, basket price] array.

input json:
{
  "maxSplit": 3,
  "shops": [2, 3, 5],
  "products": {
    "pid1": "amount",
    "pid2": "amount"
  }
}
 */

const sqlConnection = require("./database");

//Create a matrix where a row is a shop and a col is a product
//the value in cell (i,j) will be the price of product j in shop i
function createPriceMatrix(shops, products, cb){
    let getPriceQuery = "SELECT price FROM prices WHERE pid = ? AND sid = ? AND upvotes = (SELECT max(upvotes) FROM prices WHERE pid = ? AND sid = ?);";
    //create Price Matrix
    const priceMatrix = new Array(products.length);
    for (let i=0; i<products.length; i++){
        priceMatrix[i] = new Array(shops.length)
    }
    //insert prices
    for (let row=0; row<products.length; row++){
        for (let col=0; col<shops.length; col++){
            sqlConnection.query(getPriceQuery, [products[row], shops[col], products[row], shops[col]], (err, rows) =>{
                if (err) {
                    console.log(err);
                } else if(!rows.length) {
                    //price not found
                    priceMatrix[row][col] = -1;
                } else {
                    priceMatrix[row][col] = (JSON.parse(JSON.stringify(rows)))[0]["price"];
                }
                if(col===(shops.length-1) && row===(products.length-1)){
                    cb(priceMatrix);
                }
            });
        }
    }
}

//sum the prices of products in the basket
function getBasketPrice(basket, priceMatrix){
    let price = 0;
    for (let i=0;  i<basket.length; i++){
        price+= priceMatrix[basket[i]][i];
    }
    return price;
}

//last basket will be filled with -1s
function isLastBasket(currentBasket){
    return currentBasket[0] === -1;
}

//get the next basket, no validity checks
//if the "currentBasket" param is the last basket, the returned basket will be filled with -1;
function getNextBasket(currentBasket, totalNumberOfShops){
    let index = 0;
    currentBasket[index]++;
    while(currentBasket[index]===(totalNumberOfShops)){
        if(index===(currentBasket.length)){
            currentBasket = new Array(currentBasket.length).fill(-1);
            return currentBasket;
        }
        currentBasket[index] = 0;
        index++;
        if(index===(currentBasket.length)){
            currentBasket = new Array(currentBasket.length).fill(-1);
            return currentBasket;
        }

        currentBasket[index]++;
    }
    //index = Math.max(0, (index)); //to make sure we only check changed products
    return currentBasket;
}

//checks if a basket didn't pass the max number of shops filter
function validNumShopsInBasket(currentBasket, maxNumOfShops){
    let shopsSet = new Set(currentBasket);
    return (shopsSet.size<=maxNumOfShops);
}

//get the next *valid* basket, meaning all products are available in the selected shop and answers to user filters
//if there are no more baskets - basket filled with -1 will return
function getNextValidBasket(currentBasket, totalNumberOfShops, priceMatrix,  maxNumOfShops){
    let basketPrice;
    let productPrice;
    let isValid;
    do{
        currentBasket = getNextBasket(currentBasket,totalNumberOfShops);
        if(currentBasket[0] === -1){
            basketPrice = -1;
            break;
        }
        isValid = true;
        basketPrice=0;
        //validity check 1: make sure all items are available at the chosen shop
        for(let i=0; i<currentBasket.length; i++){  //only check upto changeIndex cause after that the basket didn't change
            productPrice = priceMatrix[i][currentBasket[i]];
            if(productPrice===-1){ //missing product, basket invalid
                isValid = false;
            }
            basketPrice+=productPrice;  //compute basket price
        }
        //is valid after first check and maximum number of shops is limited
        if(isValid && maxNumOfShops>0){
            //validity  check 2: make sure basket answer to max shop number filter
            isValid = validNumShopsInBasket(currentBasket, maxNumOfShops);
        }
    }while(isValid===false);
    return [currentBasket, basketPrice];
}

//validity check and price for first basket
function handleFirstBasket(currentBasket, priceMatrix){
    let productPrice;
    let basketPrice=0;
    for(let i=0; i<currentBasket.length; i++){
        productPrice = priceMatrix[i][currentBasket[i]];
        if(productPrice===-1){
            //first basket is invalid
            return -1;
        }
        basketPrice+=productPrice;  //compute basket price
    }
    return basketPrice;
}

//Does all the work. goes over all baskets,  compares prices and make validity checks
function getBasket(priceMatrix, shops, products, maxNumOfShops){
    let currentBasket = new Array(products.length).fill(0);
    let currentPrice;
    let bestBasket = new Array(products.length).fill(0);
    let bestBasketPrice = 10000000000;
    let totalNumberOfShops = shops.length;
    currentPrice = handleFirstBasket(currentBasket, priceMatrix);
    while (!(isLastBasket(currentBasket))){
        if(currentPrice<bestBasketPrice){
            bestBasketPrice = currentPrice;
            bestBasket = [...currentBasket];
        }
        [currentBasket, currentPrice] = getNextValidBasket(currentBasket, totalNumberOfShops, priceMatrix, maxNumOfShops);
        /*console.log("current basket is: " + currentBasket);
        console.log("current basket price is: " + currentPrice);
        console.log("best basket is: " + bestBasket); */
    }
    //console.log(bestBasket);
    //console.log(bestBasketPrice);
    return [bestBasket, bestBasketPrice];
}

//main function to find basket. expect to get:
//list of available shops IDs, list of requested products IDs and the Max number of shops filter
//which the user passed (if it didn't, the value should be 0)
//the return will  be an array [chosen basket, chosen basket price]
function findBestBasket(shops, products, maxNumOfShops,  priceMatrix, cb){
    let bestBasket, bestBasketPrice;
    [bestBasket, bestBasketPrice] = getBasket(priceMatrix, shops, products, maxNumOfShops);
    cb(bestBasket, bestBasketPrice);
}

module.exports.findBestBasket = findBestBasket;
module.exports.createPriceMatrix = createPriceMatrix;