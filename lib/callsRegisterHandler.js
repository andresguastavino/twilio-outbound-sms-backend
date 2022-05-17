const twilio = require('twilio');
const fetch = require('node-fetch');
const appHelper = require('./appHelper');
const { buildResponse } = appHelper;

let client = undefined, error = '';
const DEBUG_MODE = false;

const callsRegisterHandler = {
    listCalls: async ({ accountSid, authToken, res, limit = 20 }) => {
        if(!client) client = new twilio(accountSid, authToken);

        let calls = await client.calls.list({ limit })
            .catch(err => {
                console.error('Got an error from callsRegisterHandler: ', err);
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

    paginateCalls: async ({ accountSid, authToken, res }) => {
        if(!client) client = new twilio(accountSid, authToken);

        const pageData = await client.calls.page({ pageSize: 50 })
            .catch(err => {
                console.error('Got an error from paginateCalls: ', err);
                error = err.message;
            });

        return buildResponse({ 
            res, 
            error, 
            statusCodeIfOk: 200, 
            message: 'Call register retrieved succesfully',
            data: pageData
        });
    },

    getPage: async ({ accountSid, authToken, pageUrl, res }) => {
        const str = accountSid+':'+authToken;
        const auth = 'Basic '+ btoa(str);

        const pageData = await fetch(pageUrl, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Authorization': auth,                
                }
            })
            .then(res => res.json())
            .catch(err => {
                console.error('Got an error from getPage: ', err);
                error = err.message;
            });
        
        return buildResponse({ 
            res, 
            error, 
            statusCodeIfOk: 200, 
            message: 'Call register retrieved succesfully',
            data: pageData
        });
    }
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