const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const PAYPAY = require('@paypayopa/paypayopa-sdk-node');
const dotenv = require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
const configs = require('./config.json');


const port = process.env.APP_PORT ? process.env.APP_PORT : 4000;
const API_KEY       = configs.API_KEY;
const API_SECRET    = configs.API_SECRET;
const MERCHANT_ID   = configs.MERCHANT_ID;
const productionMode= configs.productionMode;
// const API_KEY       = process.env.API_KEY;
// const API_SECRET    = process.env.API_SECRET;
// const MERCHANT_ID   = process.env.MERCHANT_ID;
// const productionMode= process.env.productionMode=='true' ? true:false;

function configurePayPay() {
    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });
}
configurePayPay();

const app = express();
app.disable("x-powered-by");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));

console.log(API_KEY,(API_SECRET),MERCHANT_ID,(productionMode));

app.get("/", (req, res) => {
    res.render(__dirname+"index.html")
})

app.get("/getLabQR", (req, res) => {   
    getLabQR(req, res);  
})

async function getLabQR(req, res) {
    // var request = require("request");

    // var options = { method: POST,
    // url: /v2/codes,
    // headers: {    
    //     'Authorization': 'hmac OPA-Auth:a_d0BFWIoJUV_ii0P:munMR2ksHud5OwXu/tXw4uojgPUzUNWQnh7H0fiJvlM=:5f68fd:1690962365:goFh3PqK8qgMqOj5Dv3cOQ==',
    //     'X-ASSUME-MERCHANT': 653517310849630208,
    //     'Content-Type': 'application/json',
    // },
    //   body: {"amount":1000,"codeType":"ORDER_QR","merchantPaymentId":"DEVELOPER-PANEL-DEMO-06be7ef6-1f90-4444-a21b-99a27c52c4ce","orderDescription":""}, 
    //   json: true };
    //    request(options, function (error, response, body) {
    //     if (error) throw new Error(error);
    //     console.log(body);
    // });
}

/**
 * @name   getQR() PayPay決済のコードを作成
 * @param  amount req
 * @param  description req 
 * @param  redirectUrl req
 * @return QRcode_info Response
 * an added 2023.8.10 
 */
async function getQR(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });

    var uuid = uuidv4() // 支払いID（一意になるようにuuidで生成）    
    const merchantPaymentId = BigInt(
        "0x" + uuid.replace(/-/g, "")
    ).toString();
    // const merchantPaymentId = BigInt(hex).toString(); // don't convert this to a number

    const amount        = req.body.amount?req.body.amount:1;  
    const description   = req.body.description?req.body.amount:'';  
    const redirectUrl   = req.body.redirectUrl + "&merchantPaymentId="+ merchantPaymentId?req.body.redirectUrl + "&merchantPaymentId="+ merchantPaymentId:''; //"http://127.0.0.1/web/shopping/sln_card_payment?flag=1",

    let payload = {
        merchantPaymentId: merchantPaymentId,
        amount: {
            amount: amount,
            currency: "JPY"
        },
        codeType: "ORDER_QR",
        orderDescription: description,
        isAuthorization: false,
        redirectUrl: redirectUrl,
        redirectType: "WEB_LINK",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1"
    };
    
    const response = await PAYPAY.QRCodeCreate(payload);
    let body_arr = JSON.parse(response.BODY);    
    const body = response.BODY;
    console.log(body);
    res.send(response.BODY)
}

/**
 * @name  GetCodePaymentDetails() このAPIを利用し決済が完了しているか確認
 * @param  merchantPaymentId req 加盟店から提供された一意の支払い取引ID * 
 * @return return 支払いが完了すると、response.data.statusのステータスが CREATED から COMPLETED に変わります。 支払いの事前認証の場合、response.data.statusのステータスは CREATED から AUTHORIZED に変わります
 * an added 2023.8.10 
 */

async function GetCodePaymentDetails(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });

    const merchantPaymentId        = req.body.merchantPaymentId;  
    
    const response1 = await PAYPAY.GetCodePaymentDetails([merchantPaymentId]);
    const body1 = response1.BODY;
    res.send(body1);
    console.log(body1);
}

/**
 * @name   SetPaymentRefund() 返品する場合
 * @param  amount req
 * @param  merchantPaymentId req
 * @param  reason_des req 
 * @param  paymentId req
 * @return QRcode_info Response
 * an added 2023.8.10 
 */

async function SetPaymentRefund(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });

    const amount            = req.body.amount;  
    const merchantPaymentId = req.body.merchantPaymentId;  
    const paymentId         = req.body.paymentId; 
    const description       = req.body.reason_des;  
           
    let payload = {
        merchantRefundId: merchantPaymentId,
        paymentId: paymentId,
        amount: {
            amount: amount,
            currency: 'JPY',
        },
        reason: description,
    };

    console.log(payload);
    
    // Calling the method to refund a Payment
    PAYPAY.PaymentRefund(payload, (response) => {
        // Printing if the method call was SUCCESS
        console.log(response.BODY);
        res.send(response.BODY);
    });
}

async function PaymentCancel(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });

    const merchantPaymentId        = req.body.merchantPaymentId;  
    
    PAYPAY.PaymentCancel(Array(merchantPaymentId), (response) => {
        console.log(response.BODY);
        // Printing if the method call was SUCCESS
        res.send(response.BODY);
        });
}

async function GetRefundDetails(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });

    const merchantRefundId        = req.body.merchantRefundId;  

    PAYPAY.GetRefundDetails(Array(merchantRefundId), (response) => {
        // Printing if the method call was SUCCESS
        console.log(response.BODY.resultInfo.code);
        res.send(response.BODY);
        }); 
}
    
async function QRCodeDelete(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });

    const codeId        = req.body.codeId;  

    PAYPAY.QRCodeDelete(Array(codeId), (response) => {
        // Printing if the method call was SUCCESS
        console.log(response.BODY.resultInfo.code);
        res.send(response.BODY);
    }); 
}

async function SetPaymentAuthCapture(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });
    
    var uuid = uuidv4() // 支払いID（一意になるようにuuidで生成）    
    // const merchantPaymentId = uuid;
    const merchantPaymentId = BigInt(
        "0x" + uuid.replace(/-/g, "")
    ).toString();
    // const merchantPaymentId = BigInt(hex).toString(); // don't convert this to a number

    var uuid1 = uuidv4() // 支払いID（一意になるようにuuidで生成）    
    // const merchantPaymentId = uuid;
    const merchant_capture_id = BigInt(
        "0x" + uuid1.replace(/-/g, "")
    ).toString();
    
    const amount        = req.body.amount;  
    const description   = "PaymentAuthCapture:"+req.body.description;  
    const redirectUrl   = req.body.redirectUrl + "&merchantPaymentId="+ merchantPaymentId; //"http://127.0.0.1/web/shopping/sln_card_payment?flag=1",
    
    let payload = {
        merchantPaymentId: merchantPaymentId,
        amount: {
            amount: amount,
            currency: 'JPY',
        },
        merchantCaptureId: merchant_capture_id,
        requestedAt: 1587460334340,
        orderDescription: description,
    };
  // Calling the method to Capture a Payment Authorization
  PAYPAY.PaymentAuthCapture(payload, (response) => {
    // Printing if the method call was SUCCESS

    let body_arr = JSON.parse(response.BODY);
    res.send(response.BODY);
    console.log(response.BODY.resultInfo.code);
  });
}

async function SetPaymentAuthRevert(req, res) {

    PAYPAY.Configure({
        clientId: API_KEY,
        clientSecret: API_SECRET,
        merchantId: MERCHANT_ID,
        productionMode: productionMode
    });

    const amount            = req.body.amount;  
    const merchant_revert_id = req.body.merchant_revert_id;  
    const paypay_payment_id  = req.body.paypay_payment_id; 
    const description       = req.body.reason_des;  
    
    let payload = {
        merchantRevertId: merchant_revert_id,
        paymentId: paypay_payment_id,
        reason: description,
      };
      // Calling the method to Revert a Payment Authorization
      PAYPAY.PaymentAuthRevert(payload, (response) => {
       // Printing if the method call was SUCCESS
         console.log(response.BODY);
         res.send(response.BODY);
      });    
}

app.post("/QRCodeDelete", (req, res) => {    
    
    QRCodeDelete(req, res);
    
    // console.log(req);
})

app.get("/PaymentCancel", (req, res) => {    
    
    PaymentCancel(req, res);
    
    // console.log(req);
})

app.post("/GetRefundDetails", (req, res) => {    
    
    GetRefundDetails(req, res);    
    // console.log(req);
})

app.post("/SetPaymentRefund", (req, res) => {    
    
    SetPaymentRefund(req, res);    
    // console.log(req);
})

app.post("/getPaymentDetails", (req, res) => {    
    
    GetCodePaymentDetails(req, res);    
    // console.log(req);
})

app.post("/SetPaymentAuthCapture", (req, res) => {    
    
    SetPaymentAuthCapture(req, res);    

})

app.get("/SetPaymentAuthCapture", (req, res) => {  
    
    SetPaymentAuthCapture(req, res);
})

app.get("/getQR", (req, res) => {    
    
    getQR(req, res);

})

app.post("/getQR", (req, res) => {    
    getQR(req, res);
})

app.post("/auth", (req, res) => {
    let payload = {
        scopes: [
            "direct_debit"
        ],
        nonce: "random_generated_string",
        redirectType: "WEB_LINK",
        redirectUrl: "https://google.com",
        referenceId: uuidv4()
    };
    // Calling the method to create the account linking QR Code
    PAYPAY.AccountLinkQRCodeCreate(payload, (response) => {
        // Printing if the method call was SUCCESS
        console.log(response.BODY.resultInfo.code);
        // Printing the link to the generated QR Code
        res.send(response.BODY)
    });
})

app.post("/payment", (req, res) => {
    const token = req.headers['authorization']
    const userAuthId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    const {amount, id} = req.body
    let payload = {
        merchantPaymentId: uuidv4(),
        amount: {
           amount,
           currency: "JPY"
        },
        userAuthorizationId: userAuthId.userAuthorizationId,
        orderDescription: `Deposit ${id}`
      };
      // Calling the method to create a qr code
      PAYPAY.CreatePayment(payload, (response) => {
      // Printing if the method call was SUCCESS
          res.send(response.BODY)
      });
})

app.get("/getInfo", (req, res) => {   
    
    res.send('clientId: ' + API_KEY + '<br> clientSecret: '+API_SECRET + '<br> merchantId: '+MERCHANT_ID);   
  
})

app.get("/getPaypayInfo", (req, res) => {   
    
    console.log(req.body);
    console.log(res.BODY);
    res.send("OK");
  
})

app.post("/getPaypayInfo", (req, res) => {   
    
    console.log(req.body);
    console.log(res.BODY);
    res.send("OK");
  
})

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
