
var Mailgun = require('mailgun-js');
var mailcomposer = require('mailcomposer');

var SimpleMailgunAdapter = mailgunOptions => {
  if (!mailgunOptions || !mailgunOptions.apiKey || !mailgunOptions.domain || !mailgunOptions.fromAddress) {
    throw 'SimpleMailgunAdapter requires an API Key, domain, and fromAddress.';
  }

  mailgunOptions.verificationSubject =
    mailgunOptions.verificationSubject ||
    'Please verify your e-mail for %appname%';
  mailgunOptions.verificationBody =
    mailgunOptions.verificationBody ||
    'Hi,\n\nYou are being asked to confirm the e-mail address %email% ' +
    'with %appname%\n\nClick here to confirm it:\n%link%';
  mailgunOptions.passwordResetSubject =
    mailgunOptions.passwordResetSubject ||
    'Password Reset Request for %appname%';
  mailgunOptions.passwordResetBody =
    mailgunOptions.passwordResetBody ||
    'Hi,\n\nYou requested a password reset for %appname%.\n\nClick here ' +
    'to reset it:\n%link%';


  var mailgun = Mailgun(mailgunOptions);

  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }
  
  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  }
  
  function fillVariables(text, options) {
    text = replaceAll(text, "%username%", options.user.get("username"));
    text = replaceAll(text, "%email%", options.user.get("email"));
    text = replaceAll(text, "%appname%", options.appName);
    text = replaceAll(text, "%link%", options.link);
    return text;
  }

  function getRecipient(user) {
      return user.get("email") || user.get('username')
  }

  var sendVerificationEmail = options => {
    if(mailgunOptions.verificationBodyHTML){
      var mail = mailcomposer({
        from: {name: options.appName, address: mailgunOptions.fromAddress},
        to: getRecipient(options.user),
        subject: fillVariables(mailgunOptions.verificationSubject, options),
        text: fillVariables(mailgunOptions.verificationBody, options),
        html: fillVariables(mailgunOptions.verificationBodyHTML, options)
      });
      return new Promise((resolve, reject) => {
      	mail.build((mailBuildError, message) => {
          if(mailBuildError){
            return reject(mailBuildError);
          }
          var dataToSend = {
            to: getRecipient(options.user),
            message: message.toString('ascii')
          };
          mailgun.messages().sendMime(dataToSend, (err, body) => {
            if (err) {
              return reject(err);
            }
            resolve(body);
          });
        }).catch(err => {
          reject(err);
        });
      });
    }else{
      var data = {
        from: mailgunOptions.fromAddress,
        to: getRecipient(options.user),
        subject: fillVariables(mailgunOptions.verificationSubject, options),
        text: fillVariables(mailgunOptions.verificationBody, options)
      }
      return new Promise((resolve, reject) => {
        mailgun.messages().send(data, (err, body) => {
          if (err) {
            reject(err);return;
          }
          resolve(body);
        });
      });
    }
  }

  var sendPasswordResetEmail = options => {
    if(mailgunOptions.passwordResetBodyHTML){
      var mail = mailcomposer({
        from: {name: options.appName, address: mailgunOptions.fromAddress},
        to: getRecipient(options.user),
        subject: fillVariables(mailgunOptions.passwordResetSubject, options),
        text: fillVariables(mailgunOptions.passwordResetBody, options),
        html: fillVariables(mailgunOptions.passwordResetBodyHTML, options)
      });
      return new Promise((resolve, reject) => {
      	mail.build((mailBuildError, message) => {
          if(mailBuildError){
            return reject(mailBuildError);
          }
          var dataToSend = {
            to: getRecipient(options.user),
            message: message.toString('ascii')
          };
          mailgun.messages().sendMime(dataToSend, (err, body) => {
            if (err) {
              return reject(err);
            }
            resolve(body);
          });
        }).catch(err => {
          reject(err);
        });
      });
    }else{
      var data = {
        from: mailgunOptions.fromAddress,
        to: getRecipient(options.user),
        subject: fillVariables(mailgunOptions.passwordResetSubject, options),
        text: fillVariables(mailgunOptions.passwordResetBody, options)
      }
      return new Promise((resolve, reject) => {
        mailgun.messages().send(data, (err, body) => {
          if (err) {
            reject(err);return;
          }
          resolve(body);
        });
      });
    }
  }

  var sendMail = mail => {
    if(mail.html){
      var mailC = mailcomposer({
        from: mailgunOptions.fromAddress,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html
      });
      return new Promise((resolve, reject) => {
      	mailC.build((mailBuildError, message) => {
          if(mailBuildError){
            return reject(mailBuildError);
          }
          var dataToSend = {
            to: mail.to,
            message: message.toString('ascii')
          };
          mailgun.messages().sendMime(dataToSend, (err, body) => {
            if (err) {
              return reject(err);
            }
            resolve(body);
          });
        }).catch(err => {
          reject(err);
        });
      });
    }else{
      var data = {
        from: mailgunOptions.fromAddress,
        to: mail.to,
        subject: mail.subject,
        text: mail.text
      }
      return new Promise((resolve, reject) => {
        mailgun.messages().send(data, (err, body) => {
          if (err) {
            reject(err);return;
          }
          resolve(body);
        });
      });
    }
  }

  return Object.freeze({
    sendVerificationEmail: sendVerificationEmail,
    sendPasswordResetEmail: sendPasswordResetEmail,
    sendMail: sendMail
  });
}

module.exports = SimpleMailgunAdapter
