const express = require('express')
const infura_tx = require('./infura/transaction')
const app = express()
const port = 3030 //API will be served on this port

//API get transaction information endpoint on
//Api should server transaction info on path 
//$HOST:$PORT/eth/api/v1/transaction/$TXID
app.get('/eth/api/v1/transaction/:TXID', async (req, res) => {
    const txid = req.params.TXID
    try{
      let response = await infura_tx.getTransactionInfo(txid)
      if (response)
      {
        console.log(JSON.stringify(response,null,4));
        res.send(JSON.stringify(response,null,4));
      }
      else
      {
        console.log(JSON.stringify({"Error": "Could not fetch transaction information"}));
        res.send(JSON.stringify({"Error": "Could not fetch transaction information"}));
      }
    }
    catch(err){
      console.log(JSON.stringify({"Error": err.toString()}));
      res.send(JSON.stringify({"Error": err.toString()}));
    }

})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})