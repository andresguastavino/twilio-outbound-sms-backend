const twilio = require('twilio');
let client = undefined, error = '';
const DEBUG_MODE = false;

const outboundSMSHandler = {
    createOutboundConversation: async ({ accountSid, authToken, req, res }) => {
        client = new twilio(accountSid, authToken);
    
        const chatServiceSid = 'ISb6853c524a464dfe9321d1c5f08d640d';
        const flexProxyServiceSid = 'KS89ab08759b0bdc8b9b41243e19f8e1bf';
    
        const from = '+18304064144';
        const to = '+19167023884';
    
        const flexFlowSid = await fetchOrCreateFlexFlow(chatServiceSid, from);

        const { channelSid, channelTaskSid } = await createFlexChannel(flexFlowSid, to, from);
    //    await deleteProxySessions(flexProxyServiceSid);

        const proxySessionSid = await createOrFecthProxySession(flexProxyServiceSid, channelSid, to);

        await addAgentToProxySession(flexProxyServiceSid, proxySessionSid, from, to, channelSid);
    
        await updateChannel(chatServiceSid, channelSid, proxySessionSid, channelTaskSid, from, to);


        const statusCode = error ? 400 : 201;

        const returnValue = { 
            status: error ? 'ERROR' : 'OK',
            statusCode
        };

        if(statusCode === 201) {
            returnValue.message = 'Outbound SMS conversation created succesfully';
        } else {
            returnValue.error = error;
        }

        return res.status(statusCode).send(returnValue);
    }
}

const fetchOrCreateFlexFlow = async function(chatServiceSid, contactIdentity) {
    const flexFlowSid = await client.flexApi.v1.flexFlow
            .list({ limit: 1000 })
            .then(flex_flows => {
                const flex_flow = flex_flows.filter(flow => 
                    flow.contactIdentity === flow.contactIdentity 
                        && flow.integrationType === 'task'
                        && flow.channelType === 'sms'
                )[0];

                DEBUG_MODE && console.log('=========================\n'); 
                DEBUG_MODE && console.log('flex_flow: ', flex_flow);
                DEBUG_MODE && console.log('\n=========================\n'); 

                return flex_flow && flex_flow.sid;
            })
            .catch(err => {
                console.error('Got an error from fetchOrCreateFlexFlow (fetch): ', err);
                error = err.message;
            });

    if(flexFlowSid) return flexFlowSid;

    return await client.flexApi.v1.flexFlow
        .create({
            contactIdentity: contactIdentity,
            enabled: false,
            integrationType: 'task',
            'integration.workflowSid': 'WW482e9f91b5498fc6876685310e578d3f',
            'integration.workspaceSid': 'WSb204f1da744c925b39735d3e0d5db35b',
            'integration.channel': 'TCbca13e5b741d9dae92c64ad5df295ae2',
            friendlyName: `Outbound SMS flow for ${ contactIdentity }`,
            chatServiceSid: chatServiceSid,
            channelType: 'sms'
        })
        .then(flex_flow => { 
            DEBUG_MODE && console.log('=========================\n'); 
            DEBUG_MODE && console.log('flex_flow: ',flex_flow); 
            DEBUG_MODE && console.log('\n=========================\n'); 

            return flex_flow.sid 
        })
        .catch(err => {
            console.error('Got an error from fetchOrCreateFlexFlow (creation): ', err);
            error = err.message;
        });
}

const createFlexChannel = async function(flexFlowSid, to, from, name = 'Test') {
    return await client.flexApi.v1.channel
        .create({
            target: to,
            taskAttributes: JSON.stringify({
                to: to,
                direction: 'outbound',
                name: to,
                from: from,
                targetWorker: 'client:salesforce',
                autoAnswer: 'true'
            }),
            identity: `sms_${ to }`,
            chatFriendlyName: `Outbound Chat with ${ name } (${ to })`,
            flexFlowSid: flexFlowSid,
            chatUserFriendlyName: `${ name } (${ to })`
        })
        .then(flex_channel => {
            DEBUG_MODE && console.log('=========================\n'); 
            DEBUG_MODE && console.log('flex_channel: ', flex_channel); 
            DEBUG_MODE && console.log('\n=========================\n'); 

            return { channelSid: flex_channel.sid, channelTaskSid: flex_channel.taskSid };
        })
        .catch(err => {
            console.error('Got an error from createFlexChannel: ', err);
            error = err.message;
        });
}

const createOrFecthProxySession = async function(flexProxyServiceSid, channelSid, to) {
    const proxySessionSid = await client.proxy.services(flexProxyServiceSid)
        .sessions
        .list({ limit: 1000 })
        .then(async proxy_sessions => {
            const proxy_session = proxy_sessions.filter(proxy_session => proxy_session.uniqueName === channelSid)[0];

            DEBUG_MODE && console.log('=========================\n'); 
            DEBUG_MODE && console.log('proxy_session: ', proxy_session);
            DEBUG_MODE && console.log('\n=========================\n'); 

            if(proxy_session && proxy_session.status !== 'open') {
                await client.proxy.services(flexProxyServiceSid)
                    .sessions(proxy_session.sid)
                    .remove();

                return;
            }

            return proxy_session && proxy_session.sid;
        })
        .catch(err => {
            console.error('Got an error from createOrFecthProxySession (fetch): ', err);
            error = err.message;
        });

    if(proxySessionSid) return proxySessionSid;

    return await client.proxy.services(flexProxyServiceSid)
        .sessions
        .create({
            uniqueName:  `${ channelSid }`,
            mode: 'message-only',
            participants: [{ 'Identifier': to }]
        })
        .then(proxy_session => {
            DEBUG_MODE && console.log('=========================\n'); 
            DEBUG_MODE && console.log('proxy_session: ', proxy_session);
            DEBUG_MODE && console.log('\n=========================\n'); 

            return proxy_session.sid;
        })
        .catch(err => {
            console.error('Got an error from createOrFecthProxySession (creation): ', err);
            error = err.message;
        });
}

const addAgentToProxySession = async function(flexProxyServiceSid, proxySessionSid, from, to, channelSid) {
    await client.proxy.services(flexProxyServiceSid)
        .sessions(proxySessionSid)
        .participants
        .create({
            proxyIdentifier: from,
            friendlyName: to,
            identifier: channelSid
        })
        .then(participant => {
            DEBUG_MODE && console.log('=========================\n'); 
            DEBUG_MODE && console.log('participant: ', participant);
            DEBUG_MODE && console.log('\n=========================\n'); 

            return participant.sid;
        })
        .catch(err => {
            console.error('Got an error from addAgentToProxySession: ', err);
            error = err.message;
        });
}

const updateChannel = async function(chatServiceSid, channelSid, proxySessionSid, taskSid, from, to) {
    client.chat.v2.services(chatServiceSid)
        .channels(channelSid)
        .update({
            attributes: JSON.stringify({
                proxySession: proxySessionSid,
                serviceNumber: `sms_${ to }`,
                task_sid: taskSid,
                from: to,
                forwarding: true,
                twilioNumber: from,
                channel_type: 'sms',
                status: 'ACTIVE',
                long_lived: false
            })
        })
        .then(channel => {
            DEBUG_MODE && console.log('=========================\n'); 
            DEBUG_MODE && console.log('channel: ', channel);
            DEBUG_MODE && console.log('\n=========================\n'); 

        })
        .catch(err => {
            console.error('Got an error from updateChannel: ', err);
            error = err.message;
        });
}

const deleteChannels = async function(chatServiceSid) {
    client.chat.services(chatServiceSid)
    .channels
    .list({ limit: 1000 })
    .then(channels => {
        channels.forEach(c => {
            console.log(c);
            // Remove each channel one by one
            client.chat.services(chatServiceSid)
                .channels(c.sid)
                .remove();
 
            console.log(`removed - ${c.sid}`);
        })
    });
}

const deleteProxySessions = async function(flexProxyServiceSid) {
    return await client.proxy.services(flexProxyServiceSid)
        .sessions
        .list({ limit: 1000 })
        .then(async proxy_sessions => {
            DEBUG_MODE && console.log(`Proxy sessions found: ${ proxy_sessions.length }`);

            for(let i = 0; i < proxy_sessions.length; i++) {
                const proxy_session = proxy_sessions[i];

                DEBUG_MODE && console.log('==============================');
                DEBUG_MODE && console.log('Deleting proxy_session: ', proxy_session);

                await client.proxy.services(flexProxyServiceSid)
                    .sessions(proxy_session.sid)
                    .remove()
                    .catch(err => console.error(err));

                DEBUG_MODE && console.log('Deleted');
                DEBUG_MODE && console.log('==============================');
            }
        })
        .catch(err => {
            console.log(err);
            error = err.message;
        });
}

module.exports = outboundSMSHandler;