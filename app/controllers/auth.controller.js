const db = require("../models");
const Joi = require('joi');
const keygen = require("keygenerator");
const config = require("../config/auth.config");
const mail = require("../config/mail.config")
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

//Regigister Account
exports.signup = (req, res) => {
  // Save User to Database
  User.create({
    username: req.body.username,
    email: req.body.email,
    fname: req.body.firstname,
    lname: req.body.lastname,
    dob: req.body.dob,
    password: bcrypt.hashSync(req.body.password, 8)
  })
    .then(user => {
      // if (req.body.roles) {
      //   Role.findAll({
      //     where: {
      //       name: {
      //         [Op.or]: req.body.roles
      //       }
      //     }
      //   })
      //   .then(roles => {
      //     user.setRoles(roles).then(() => {
      //       res.send({ message: "User registered successfully!" + user.id });
      //     });
      //   });
      // } else {
        // user role = 1
        User.findOne({
          where: {
            email: req.body.email
          }
        })
        .then(() => {
          let reset_token = keygen.number({
            length: 6
          });
          User.update({
            email_verified: reset_token + `${user.id}`
          }, 
          {
            where: {
              id: user.id
            }
          })
          var emailConfig = {
            body: {
                name: user.fname + " " + user.lname,
                // intro: 'You requested to reset your password on Ditepayhub.',
                action: {
                    instructions: '<small>Thanks for signing up an account with Ditepayhub. To use your account, you\'ll first need to confirm your email with the code below:</small>',
                    button: {
                        color: '#22BC66', // Optional action button color
                        text: reset_token+`${user.id}`
                    }
                },
                outro: '<small>If you have questions about your account, please log in and click <b>Help & Contact</b></small>',
                signature: "Thanks"
            }
        };
    
        var emailBody = mail.footer.generate(emailConfig);
        let mailOption = {
          from: mail.options,
          to: user.email,
          subject: 'Confirm your email',
          html: emailBody
        }
          mail.config.sendMail(mailOption, function(error, info){
            if (error) {
              console.log(error);
            } else {
              user.getRoles().then(roles => {
                res.status(200).send({
                  message: "User registered successfully!"
                });
              });
              // console.log('Email sent: ' + info.response);
            }
          });
        })
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

//Very Account
exports.email_verify = (req, res) => {
  const schema = Joi.object({
    verify_code: Joi.number().integer().min(6).required()
  }).validate(req.body);
  if (schema.error) return res.status(400).send({message: schema.error.details[0].message});
  
  let u_id = req.body.verify_code.slice(6);

  User.findOne({
    where: {
      id: u_id,
      email_verified: req.body.verify_code
    }
  })
    .then(user => {
      if (!user) return res.status(404).send({ message: "Incorrect or expired verification code." });

      let date_ob = new Date(), d = ("0" + date_ob.getDate()).slice(-2), mn = ("0" + (date_ob.getMonth() + 1)).slice(-2), y = date_ob.getFullYear(), h = date_ob.getHours(), m = date_ob.getMinutes(), s = date_ob.getSeconds();
      let date = y + "-" + mn + "-" + d + " " + h + ":" + m + ":" + s
      
      User.update({
        email_verified: 1,
        updatedAt: date
      }, 
      {
        where: {
          id: user.id
        }
      })

      var emailConfig = {
        body: {
            name: user.fname + " " + user.lname,
            intro: '<small style="color: #000000;">Welcome to your new Ditepayhub Account.</small>',
            action: {
                instructions: `<small style="color: #000000;"> Whether you're a start-up or a large organization, we're here to offer you the support you need to help your business grow. <p>
                If you have any questions, please log in to your account and click <b>Contact</b> at the bottom of any Ditepayhub page.</small>`,
                button: {
                    // color: '#22BC66', // Optional action button color
                    // text: reset_token+`${user.id}`
                }
            },
            signature: "Thanks"
        }
    };
    var emailBody = mail.footer.generate(emailConfig);
    let mailOption = {
      from: mail.options,
      to: user.email,
      subject: 'Welcome to your new Ditepayhub Account',
      html: emailBody
    }
      mail.config.sendMail(mailOption, function(error, info){
        if (error) {
          console.log(error);
        } else {
          user.getRoles().then(roles => {
            res.status(200).send({
              message: "Account verified successfully!"
            });
          });
          // console.log('Email sent: ' + info.response);
        }
      });
    }).catch(err => {
      res.status(500).send({ message: err.message });
    });
};

//Resend email Verification Code
exports.resend_email_verify = (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  }).validate(req.body);
  if (schema.error) return res.status(400).send({message: schema.error.details[0].message});

  User.findOne({
    where: {
      email: req.body.email
    }
  })
    .then(user => {
      if (!user) return res.status(404).send({ message: "User Not found." });
      if (user.email_verified === 1) return res.status(401).send({message: "Account already verified, please login to continue"})

      let reset_token = keygen.number({
        length: 6
      });
      User.update({
        email_verified: reset_token + `${user.id}`
      }, 
      {
        where: {
          id: user.id
        }
      })
      var emailConfig = {
        body: {
            name: user.fname + " " + user.lname,
            // intro: 'You requested to reset your password on Ditepayhub.',
            action: {
                instructions: '<small>Thanks for signing up an account with Ditepayhub. To use your account, you\'ll first need to confirm your email with the code below:</small>',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: reset_token+`${user.id}`
                }
            },
            outro: '<small>If you have questions about your account, please log in and click <b>Help & Contact</b></small>',
            signature: "Thanks"
        }
    };

    var emailBody = mail.footer.generate(emailConfig);
    let mailOption = {
      from: mail.options,
      to: user.email,
      subject: 'Confirm your email',
      html: emailBody
    }
      mail.config.sendMail(mailOption, function(error, info){
        if (error) {
          console.log(error);
        } else {
          user.getRoles().then(roles => {
            res.status(200).send({
              message: "Code sent successfully!"
            });
          });
          // console.log('Email sent: ' + info.response);
        }
      });
      
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

//login section starts here
exports.signin = (req, res) => {
  let validate;
  if (!req.body.username) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }).validate(req.body);
    if (schema.error) {return res.status(400).send({message: schema.error.details[0].message})};
    
    validate = {email: req.body.email}
  }else{
    validate = {username: req.body.username}
  }
 
  User.findOne({
    where: validate
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      if (user.email_verified !== 1) {
        return res.status(401).send({ message: "You need to verify your account before you can login." });
      }
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      let date_ob = new Date(), d = ("0" + date_ob.getDate()).slice(-2), mn = ("0" + (date_ob.getMonth() + 1)).slice(-2), y = date_ob.getFullYear(), h = date_ob.getHours(), m = date_ob.getMinutes(), s = date_ob.getSeconds();
      let date = y + "-" + mn + "-" + d + " " + h + ":" + m + ":" + s

      let ftoken = keygen._({
        length: 24,
        forceLowercase: true
       })

      User.update({
        login_token: ftoken,
        last_login: date
        
      }, 
      {
        where: {
          id: user.id
        }
      })
      var token = jwt.sign({ id: ftoken }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];
      user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        res.status(200).send({
          message: "You're now logged in",
          accessToken: token
        });
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

// reset password (send email) starts here
exports.reset = (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  }).validate(req.body);
  if (schema.error) return res.status(400).send({message: schema.error.details[0].message});

  User.findOne({
    where: {
      email: req.body.email
    }
  })
    .then(user => {
      if (!user) return res.status(404).send({ message: "User Not found." });

      let reset_token = keygen.number({
        length: 6
      });
      
      User.update({
        email_reset: reset_token+`${user.id}`
      }, 
      {
        where: {
          id: user.id
        }
      })

      var emailConfig = {
        body: {
            name: user.fname + " " + user.lname,
            intro: 'You requested to reset your password on Ditepayhub.',
            action: {
                instructions: 'To reset your password, enter this verification code when prompted:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: reset_token+`${user.id}`
                }
            },
            outro: '<small>Please delete and ignore this message if you didn\'t request</small>',
            signature: "Thanks"
        }
    };

    var emailBody = mail.footer.generate(emailConfig);
    let mailOption = {
      from: mail.options,
      to: user.email,
      subject: 'Verification code to reset DitePayHub password',
      html: emailBody
    }
      mail.config.sendMail(mailOption, function(error, info){
        if (error) {
          console.log(error);
        } else {
          user.getRoles().then(roles => {
            res.status(200).send({
              message: "Password reset code has been sent to your email address",
              // sample: emailConfig
            });
          });
          // console.log('Email sent: ' + info.response);
        }
      });
      
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

//Reset Password with code
exports.reset_email = (req, res) => {
  const schema = Joi.object({
    reset_code: Joi.number().integer().min(6).required(),
    password: Joi.string().pattern(new RegExp('[a-zA-Z0-9]')).required(),
    repeat_password: Joi.string().required().valid(Joi.ref('password')),
  }).validate(req.body);
  if (schema.error) return res.status(400).send({message: schema.error.details[0].message});
  
  let u_id = req.body.reset_code.slice(6);

  User.findOne({
    where: {
      id: u_id,
      email_reset: req.body.reset_code
    }
  })
    .then(user => {
      if (!user) return res.status(404).send({ message: "Incorrect verification Code." });

      let date_ob = new Date(), d = ("0" + date_ob.getDate()).slice(-2), mn = ("0" + (date_ob.getMonth() + 1)).slice(-2), y = date_ob.getFullYear(), h = date_ob.getHours(), m = date_ob.getMinutes(), s = date_ob.getSeconds();
      let date = y + "-" + mn + "-" + d + " " + h + ":" + m + ":" + s
      
      User.update({
        email_reset: 0,
        password: bcrypt.hashSync(req.body.password, 8),
        updatedAt: date
      }, 
      {
        where: {
          id: user.id
        }
      })

      var emailConfig = {
        body: {
            name: user.fname + " " + user.lname,
            intro: 'You just changed your password on Ditepayhub',
            action: {
                instructions: `If you didn't change your password, please contact us right away 
                <p>Just a reminder:</p> 
                <ul><li>Never share your password or reset code with anyone.</li>
                <li>Create passwords that are hard to guess and don't use personal information.<br>Be sure to include uppercase and lowercase letters, numbers, and symbols.</li>
                <li>Use different passwords for each of your online accounts.</li></ul>`,
                button: {
                    // color: '#22BC66', // Optional action button color
                    // text: reset_token+`${user.id}`
                }
            },
            signature: "Thanks"
        }
    };

    var emailBody = mail.footer.generate(emailConfig);
    let mailOption = {
      from: mail.options,
      to: user.email,
      subject: 'You just changed your password',
      html: emailBody
    }
      mail.config.sendMail(mailOption, function(error, info){
        if (error) {
          console.log(error);
        } else {
          user.getRoles().then(roles => {
            res.status(200).send({
              message: "Password reset successfully, you can now login with your new password"
            });
          });
          // console.log('Email sent: ' + info.response);
        }
      });
    })
    
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

//Change password, Request Old Password
exports.changePass = (req, res) => {
  const schema = Joi.object({
    current_password: Joi.string().required(),
    password: Joi.string().pattern(new RegExp('[a-zA-Z0-9]')).required(),
    repeat_password: Joi.string().required().valid(Joi.ref('password')),
  }).validate(req.body);
  if (schema.error) return res.status(400).send({message: schema.error.details[0].message});

  User.findOne({
    where: {
      login_token: req.login_token
    }
  })
    .then(user => {
      if (!user) return res.status(404).send({ message: "Invalid Login Token." });

      var passwordIsValid = bcrypt.compareSync(
        req.body.current_password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          message: "Invalid Old Password!"
        });
      }

      let date_ob = new Date(), d = ("0" + date_ob.getDate()).slice(-2), mn = ("0" + (date_ob.getMonth() + 1)).slice(-2), y = date_ob.getFullYear(), h = date_ob.getHours(), m = date_ob.getMinutes(), s = date_ob.getSeconds();
      let date = y + "-" + mn + "-" + d + " " + h + ":" + m + ":" + s
      
      User.update({
        email_reset: 0,
        password: bcrypt.hashSync(req.body.password, 8),
        updatedAt: date
      }, 
      {
        where: {
          id: user.id
        }
      })

      var emailConfig = {
        body: {
            name: user.fname + " " + user.lname,
            intro: 'You just changed your password on Ditepayhub',
            action: {
                instructions: `If you didn't change your password, please contact us right away 
                <p>Just a reminder:</p> 
                <ul><li>Never share your password or reset code with anyone.</li>
                <li>Create passwords that are hard to guess and don't use personal information.<br>Be sure to include uppercase and lowercase letters, numbers, and symbols.</li>
                <li>Use different passwords for each of your online accounts.</li></ul>`,
                button: {
                    // color: '#22BC66', // Optional action button color
                    // text: reset_token+`${user.id}`
                }
            },
            signature: "Thanks"
        }
    };

    var emailBody = mail.footer.generate(emailConfig);
    let mailOption = {
      from: mail.options,
      to: user.email,
      subject: 'You just changed your password',
      html: emailBody
    }
      mail.config.sendMail(mailOption, function(error, info){
        if (error) {
          console.log(error);
        } else {
          user.getRoles().then(roles => {
            res.status(200).send({
              message: "Password reset successfully"
            });
          });
          // console.log('Email sent: ' + info.response);
        }
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};