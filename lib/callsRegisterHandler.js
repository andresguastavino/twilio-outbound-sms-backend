const twilio = require('twilio');
const appHelper = require('./appHelper');
const { buildResponse } = appHelper;

let client = undefined, error = '';
const DEBUG_MODE = false;

const callsRegisterHandler = {
    listCalls: async ({ accountSid, authToken, res, limit = 20 }) => {
        client = new twilio(accountSid, authToken);

        const calls = await client.calls.list({ limit })
            .catch(err => {
                console.error('Got an error from fetchOrCreateFlexFlow (fetch): ', err);
                error = err.message;
            });

        return buildResponse({ 
            res, 
            error, 
            statusCodeIfOk: 200, 
            message: 'Call register retrieved succesfully',
            data: calls
        });
    },
}

module.exports = callsRegisterHandler;