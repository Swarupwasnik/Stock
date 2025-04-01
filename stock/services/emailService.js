import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendAlertEmail = (userEmail, symbol, price) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Stock Price Alert',
    text: `Alert! ${symbol} has reached your target price of ${price}`
  };

  transporter.sendMail(mailOptions);
};

export { sendAlertEmail };
