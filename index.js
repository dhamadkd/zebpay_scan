const express = require('express')
const infura_tx = require('./infura/transaction')
const app = express()
const port = 3030

app.get('/eth/api/v1/transaction/:TXID', async (req, res) => {
    const txid = req.params.TXID
    let response1 = await infura_tx.getTransactionByHash(txid)
    if (response1)
    {
      console.log('value returns');
      console.log(JSON.stringify(response1,null,4));
    }
    else{
      console.log('invalid chain or transactionid');
    }
    res.send(JSON.stringify(response1,null,4));
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})