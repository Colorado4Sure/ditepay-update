const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const transporter = nodemailer.createTransport({
    // service: 'gmail', //for email configuration
    host: "mail.ditepayhub.com.ng",
    port: 465,
    secure: true, // upgrade later with STARTTLS
    auth: {
      user: 'noreply@ditepayhub.com.ng',
      pass: '08125896366@'
    }
});

const mailOptions = 'Ditepayhub Team <noreply@ditepayhub.com.ng>';

var mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Ditepayhub',
        link: 'https://ditepayhub.com.ng/'
    }
});


module.exports = {
    config: transporter,
    options: mailOptions,
    footer: mailGenerator
}