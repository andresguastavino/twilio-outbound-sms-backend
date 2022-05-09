const express = require('express');

const app = express();

const outboundSMSHandler = require('./lib/outboundSMSHandler');

app.get('/outbound_sms', async (req, res) => {
    const { accountSid, authToken } = req.query;

    if(!accountSid || !authToken) {
        return res.status(400).send({
            statusCode: 400,
            status: 'ERROR',
            type: 'Missing parameters in HTTP request',
            message: 'accountSid or authToken were not specified in query string parameters'
        });
    }

    return await outboundSMSHandler.createOutboundConversation({ 
        accountSid,
        authToken,
        req,
        res
    });
});

app.use((req, res) => {
    return res.status(404).send('not found');
});

app.listen(process.env.PORT || 3001, () => {
    console.log('App listening');
});