/*
what is expected to be sent from client:
*array of the chosen shops IDs (all if not filtered)
*array of the chosen products IDs
*maximum number of shops - filter set by user

A basket is represented as an array:
index i in the array is the product in index i in the "products" array
the valie at index i is the shop at the index of that value in the "shops" array 
for example:
shops = [11, 22, 33]
products = [a, b, c, d]
basket = [2, 0, 2, 1]
the basket represents getting products a & c from shop 33 (index 2 in shops)
the product b from shop 11 and the product d from 22

the information is returned as a [basket, basket price] array. 

 */

//Create a matrix where a row is a shop and a col is a product
//the value in cell (i,j) will be the price of product j in shop i
function createPriceMatrix(shops, products){
    //create 2d array for price matrix
    const priceMatrix = new Array(products.length);
    for (let i=0; i<products.length; i++){
        priceMatrix[i] = new Array(shops.length)
    }
    //insert prices
    let isAvailable = 0;
    for (let row=0; row<products.length; row++){
        for (let col=0; col<shops.length; col++){
            //check if product "col" is available in shop "row"
            isAvailable = "SELECT COUNT(*) FROM PRICES WHERE products.id=arr1[i] AND shops.id=arr2[j]";
            if(isAvailable>=1){
                priceMatrix[row][col] = "SELECT Price FROM Prices WHERE products.id=arr1[i] AND shops.id=arr2[j]";
            } else{
                priceMatrix[row][col] = -1;
            }
        }
    }
    return priceMatrix;
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
function isLastBasket(currentBasket, totalNumberOfShops){
    if(currentBasket[0]===-1){
        return true
    }
    return false;
}

//get the next basket, no validity checks
//if the "currentBasket" param is the last basket, the returned basket will be filled with -1;
function getNextBasket(currentBasket, totalNumberOfShops){
    let index = 0;
    currentBasket[index]++;
    while(currentBasket[index]===totalNumberOfShops){
        //check for last basket
        if(index===(currentBasket.length-1)){
            currentBasket = new Array(currentBasket.length).fill(-1);
            return [currentBasket,-1];
        }
        currentBasket[index] = 0;
        index++;
    }
    index = Math.max(0, (index-1)); //to make sure we only check changed products
    return [currentBasket, index];
}

//checks if a basket didn't pass the max number of shops filter
function validNumShopsInBasket(currentBasket, maxNumOfShops){
    let shopsSet = new Set(currentBasket);
    return (shopsSet.prototype.size<=maxNumOfShops);
}

//get the next *valid* basket, meaning all products are available in the selected shop and answers to user filters
//if there are no more baskets - basket filled with -1 will return
function getNextValidBasket(currentBasket, totalNumberOfShops, priceMatrix,  maxNumOfShops){
    let changeIndex;    //the index up to whom the next basket was different from the previous one
    let basketPrice;
    let productPrice;
    let isValid;
    do{
        [currentBasket, changeIndex] = getNextBasket(currentBasket,totalNumberOfShops);
        isValid = true;
        basketPrice=0;
        //validity check 1: make sure all items are available at the chosen shop
        for(let i=0; i<changeIndex; i++){  //only check upto changeIndex cause after that the basket didn't change
            productPrice = priceMatrix[currentBasket[i]][i];
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
        productPrice = priceMatrix[currentBasket[i]][i];
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
    let bestBasket;
    let bestBasketPrice = -1;
    let totalNumberOfShops = shops.length;
    currentPrice = handleFirstBasket(currentBasket,  priceMatrix);
    while (!(isLastBasket(currentBasket, totalNumberOfShops))){
        if(currentPrice<bestBasketPrice || bestBasketPrice===-1){
            bestBasketPrice = currentPrice;
            bestBasket = currentBasket;
        }
        [currentBasket, currentPrice] = getNextValidBasket(currentBasket, totalNumberOfShops, priceMatrix, maxNumOfShops);
    }
    return [bestBasket, bestBasketPrice];
}

//main function to find basket. expect to get:
//list of available shops IDs, list of requested products IDs and the Max number of shops filter
//which the user passed (if it didn't, the value should be -1)
//the return will  be an array [chosen basket, chosen basket price]
function findBestBasket(shops, products, maxNumOfShops){
    let priceMatrix = createPriceMatrix(shops, products);
    let bestBasket, bestBasketPrice;
    [bestBasket, bestBasketPrice] = getBasket(priceMatrix, shops, products, maxNumOfShops);
    return [bestBasket, bestBasketPrice]
}
