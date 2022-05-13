const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*'
}));

const outboundSMSHandler = require('./lib/outboundSMSHandler');
const callsRegisterHandler = require('./lib/callsRegisterHandler');
const { listCalls } = callsRegisterHandler;

const appHelper = require('./lib/appHelper');
const { paramsValid, paramsNotValidResponse, handleCallsRegister } = appHelper;

app.get('/calls_register', async (req, res) => await handleCallsRegister({ req, res, paramsValid, paramsNotValidResponse, listCalls }));
app.get('/calls_register/:limit', async (req, res) => await handleCallsRegister({ req, res, paramsValid, paramsNotValidResponse, listCalls }));

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