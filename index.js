const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*'
}));

const outboundSMSHandler = require('./lib/outboundSMSHandler');
const callsRegisterHandler = require('./lib/callsRegisterHandler');
const { listCalls, paginateCalls, getPage } = callsRegisterHandler;

const appHelper = require('./lib/appHelper');
const { paramsValid, paramsNotValidResponse, handleCallsRegister } = appHelper;

app.get('/calls_register/list', async (req, res) => {
    const { accountSid, authToken } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if(!paramsValid(accountSid, authToken)) return paramsNotValidResponse(res);
    
    return await listCalls({ 
        accountSid,
        authToken,
        res,
        limit
    });
});

app.get('/calls_register/paginate', async (req, res) => {
    const { accountSid, authToken } = req.query;

    if(!paramsValid(accountSid, authToken)) return paramsNotValidResponse(res);
    
    return await paginateCalls({ 
        accountSid,
        authToken,
        res
    });
});

app.get('/calls_register/get_page', async (req, res) => {
    const { accountSid, authToken, pageNumber, pageToken } = req.query;
    
    if(!paramsValid(accountSid, authToken)) return paramsNotValidResponse(res);

    const pageUrl = `https://api.twilio.com/2010-04-01/Accounts/${ accountSid }/Calls.json?PageSize=50&Page=${ pageNumber }&PageToken=${ pageToken }`;
    
    return await getPage({ 
        accountSid,
        authToken,
        pageUrl,
        res
    });
});

app.get('/outbound_sms', async (req, res) => {
    const { accountSid, authToken } = req.query;

    if(!paramsValid(accountSid, authToken)) return paramsNotValidResponse(res);

    return await outboundSMSHandler.createOutboundConversation({ 
        accountSid,
        authToken,
        res
    });
});

app.use((req, res) => {
    return res.status(404).send('not found');
});

app.listen(process.env.PORT || 3001, () => {
    console.log('App listening');
});