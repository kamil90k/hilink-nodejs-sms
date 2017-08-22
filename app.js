let xml      = require('./libs/xml-wrapped-parser');
const base64 = require('js-base64').Base64;
const config = require("./config/config");
const sha256 = require('sha256');
const got    = require("got");

let g_reqTokens = [],
    g_sessionId = "",
    g_smsRetry  = 0;

const URL_SESSION_TOKENS = "192.168.8.1/api/webserver/SesTokInfo",
	  URL_LOGIN			 = "192.168.8.1/api/user/login";
      URL_SMS            = "192.168.8.1/api/sms/send-sms";

let ERR_HANDLER = function(err){
	console.log(err);
}

function authenticate() {
    return new Promise((resolve, reject)=>{
        function login(obj){
            let reqVerToken = obj.response.TokInfo[0],
                sessionId	= obj.response.SesInfo[0],
                encPassword	= base64.encode(sha256(config.login + base64.encode(config.password) + reqVerToken)); //config.password <=> sha256("PASSWORD") 

            let requestBody = {
                Username	 : config.login,
                Password	 : encPassword,
                password_type: 4//g_password_type - global variable from oryginal Huawei code
            };

            let params = {
                body: xml.obj2String(requestBody),
                headers: {
                    cookie: sessionId,
                    __RequestVerificationToken: reqVerToken
                }
            }

            got.post(URL_LOGIN, params).then(response => {
                if(!response.headers["__requestverificationtoken"] ||
                    response.headers["set-cookie"] == null) throw new Error("LOGIN: no __requestverificationtoken OR set-cookie header");

                g_reqTokens = response.headers["__requestverificationtoken"].split("#");
                g_reqTokens.pop();//last token is empty, remove it
                g_sessionId = response.headers["set-cookie"][0];

                console.log("LOGIN");
                xml.string2Obj(response.body).then(console.log);
                resolve();

            }).catch(err=>{
                ERR_HANDLER(err);
                reject(err);
            })
        }

        got(URL_SESSION_TOKENS).then(function(response){
            xml.string2Obj(response.body)
                .then(login);

        }).catch(err=>{
            ERR_HANDLER(err);
            reject(err);
        });
    });

}

function sms(message, recipient) {

    if(g_reqTokens.length == 0 || g_sessionId == ""){
        g_smsRetry += 1;
        return authenticate().then(()=>{
            sms(message, recipient);
        }).catch(ERR_HANDLER);
    }else if(g_smsRetry >3){
        console.log("SMS fails, retries: " + smsRetry);
        return false;
    }

    g_smsRetry = 0;

    let requestBody = {
            Index:-1,
            Phones: {
                Phone:recipient//might be array
            },
            Sca:"",
            Content:message,
            Length:message.length,
            Reserved:1,//g_text_mode - global variable from oryginal Huawei code
            Date: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')// yyyy-MM-dd hh:mm:ss
        };

    let params = {
        body: xml.obj2String(requestBody),
        headers: {
            cookie: g_sessionId,
            __RequestVerificationToken: g_reqTokens.pop()
        }
    }

    return got.post(URL_SMS, params).then(response=>{
        console.log("SMS");
        xml.string2Obj(response.body).then(console.log);

    }).catch(ERR_HANDLER);
}

//MAGIC HERE
authenticate().then(()=>{
	sms("sms 1", "600700800");
	sms("sms 2", "600700800");
	sms("sms 3", "600700800");
})
