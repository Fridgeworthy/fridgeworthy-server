'use strict';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN  = process.env.MAILGUN_DOMAIN;

const mailgun = require('mailgun-js')({
    apiKey: MAILGUN_API_KEY,
    domain: MAILGUN_DOMAIN
});


module.exports = {
    sendEmail: sendEmail,
};

function sendEmail(params) {
    console.log('sendEmail ' + new Date());
    const promise = new Parse.Promise();

    const emailSubject = params.subject;
    const emailBody    = params.body;
    const fromName     = params.fromName;
    const fromEmail    = params.fromEmail;
    const toEmail      = params.toEmail;
    const toName       = params.toName;

    const fromString = fromName + ' <' + fromEmail + '>';
    const toString   = toName + ' <' + toEmail + '>'

    console.log('emailBody ' + emailBody);
    console.log('emailSubject ' + emailSubject);
    console.log('fromName ' + fromName);
    console.log('fromEmail ' + fromEmail);
    console.log('toEmail ' + toEmail);
    console.log('toName ' + toName);

    let message = {
        from   : fromString,
        to     : toString,
        subject: emailSubject,
        html   : emailBody
    };

    mailgun.messages().send(message, (error, body) => {
        if (error) {
            console.log('got an error in sendEmail: ' + error);
            promise.resolve(error);
        } else {
            console.log('email sent to ' + toEmail + ' ' + new Date());
            promise.resolve('Email sent!');
        }
    });

    return promise;
}