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
}

module.exports = appHelper;