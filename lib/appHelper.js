const appHelper = {
    paramsValid: (accountSid, authToken) => {
        return accountSid && authToken;
    },

    paramsNotValidResponse: (res) => {
        return res.status(400).send({
            statusCode: 400,
            status: 'ERROR',
            type: 'Missing parameters in HTTP request',
            message: 'accountSid or authToken were not specified in query string parameters'
        });
    },

    buildResponse: ({ res, error, statusCodeIfOk, message, data }) => {
        const statusCode = error ? 400 : statusCodeIfOk;

        const returnValue = { 
            status: error ? 'ERROR' : 'OK',
            statusCode
        };

        if(statusCode === statusCodeIfOk) {
            returnValue.message = message;
            returnValue.data = data;
        } else {
            returnValue.error = error;
        }

        return res.status(statusCode).send(returnValue);
    },

    handleCallsRegister: async ({ req, res, paramsValid, paramsNotValidResponse, listCalls }) => {
        const { accountSid, authToken } = req.query;
        const limit = req.params.limit ? parseInt(req.params.limit) : 20;

        if(!paramsValid(accountSid, authToken)) return paramsNotValidResponse(res);

        return await listCalls({ 
            accountSid,
            authToken,
            res,
            limit
        });
    },
}

module.exports = appHelper;