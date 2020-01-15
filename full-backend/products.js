const sqlConnection = require("./database");
//const bodyParser = require('body-parser');


/*post a receipt OCR. will get an object like:
{
    "sid": 23,   //shopid
    "products": {
        "pid1": "given price", //productid and the price the user inserted
        "pid2": "given price"
    }
}

 */
function postOCRProducts(currentReceipt){
    let shopid = currentReceipt.sid;
    let query = "SELECT * FROM Prices WHERE Prices.sid = ? AND Prices.pid = ? AND price= ?;";
    Object.keys(currentReceipt.products).forEach(pid => {
        pid = parseInt(pid);
        let price = currentReceipt.products[pid];
        sqlConnection.query(query, [shopid, pid,  price] ,  (err, rows) => {
            if (err) console.log(err);
            else if (!rows.length) {
                //price doesn't match, add new price
                let insertNewProduct = "INSERT INTO Prices (sid,pid,price,upvotes) VALUES(?,?,?,1);";
                let params = [shopid, pid, price];
                sqlConnection.query(insertNewProduct, params, (err) => {
                    if (err) console.log(err);
                });
            } else {
                //found price, add one upvote
                let increaseUpvoate = "UPDATE Prices SET upvotes = upvotes+1 WHERE sid = ? AND pid = ? AND  price = ?;";
                let params = [shopid, pid, price];
                sqlConnection.query(increaseUpvoate, params, (err) => {
                    if (err) console.log(err);
                });
            }
        });
    });
}

module.exports.postOCRProducts = postOCRProducts;