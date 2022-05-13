const twilio = require('twilio');
const appHelper = require('./appHelper');
const { buildResponse } = appHelper;

let client = undefined, error = '';
const DEBUG_MODE = false;

const callsRegisterHandler = {
    listCalls: async ({ accountSid, authToken, res, limit = 20 }) => {
        client = new twilio(accountSid, authToken);

        let calls = await client.calls.list({ limit })
            .catch(err => {
                console.error('Got an error from fetchOrCreateFlexFlow (fetch): ', err);
                error = err.message;
            });

        calls = await appendRecordings(calls);

        return buildResponse({ 
            res, 
            error, 
            statusCodeIfOk: 200, 
            message: 'Call register retrieved succesfully',
            data: calls
        });
    },
}

const appendRecordings = async (calls) => {
    for(let i = 0; i < calls.length; i++) {
        let call = calls[i];
        call.recordings = await fetchCallRecordings(call.sid);
        calls[i] = call;
    }
    return calls;
}

const fetchCallRecordings = async (callSid) => {
    return await client.recordings
        .list({ callSid, limit: 20 })
        .catch(err => {
            console.error('Got an error from appendRecording: ', err);
            error = err.message;
        });
}

module.exports = callsRegisterHandler;