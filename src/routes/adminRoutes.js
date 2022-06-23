const express = require("express");
const { default: mongoose } = require("mongoose");
const sgMail = require('@sendgrid/mail');
const { Users, UserBasicInfo, userBasicInfoSchema, PasswordChangeList} = require("../models/adminUsersModels");
const bcrypt = require("bcrypt");
const router = express.Router();

router.get('/adminlogincheck', async(req, res)=>{
     const result = await Users.findOne({username: req.query.username, password: req.query.password});
     if (!result) res.status(500).json({success: false});
     else res.send(result);
});

router.get('/logincheck', async(req, res)=>{
     const user = await UserBasicInfo.findOne({userName: req.query.username});
     if (!user) {
          res.status(500).json({success: false});
     }
     else {
          const validcheck = await bcrypt.compare(req.query.password, user.password);
          if (validcheck) {
               const obj = user.toObject();
               delete obj['password'];
               delete obj['created_on'];
               res.send(obj);
          } else res.status(500).json({success: false});          
     }
});

router.post('/userbasicreg', async(req, res) => {
     const id = require('mongodb').ObjectId;
     const info = {...req.body, _id: new id()}
     new UserBasicInfo(info).save((err, output)=>{
          if (err) res.status(500).json({success: false, message: err.message});
          else res.send({success: true});
     });
});
router.post('/userbasicupdate', async(req, res)=>{
     const _id = req.body.id;
     const record = JSON.parse(req.body.data);
     record.no_email_check = true;
     await UserBasicInfo.findByIdAndUpdate(_id, {...record});
     res.send({success: true});
});
router.get('/userinfo', async(req, res)=>{
     const result = await UserBasicInfo.find();
     res.send(result);
});
router.get('/removeuser', async(req, res)=>{
     await UserBasicInfo.findByIdAndRemove(req.query.id);
     res.send({success: true});
});
router.post('/verifyemail', async(req, res)=> {
     try {
          const result = await UserBasicInfo.findOne({username: req.body.username});
          if (!result) res.json({success: false});
          else {
               const results = await new PasswordChangeList({email: req.body.username}).save();
               const ID = results._id;
               const URL = `${decodeURIComponent(req.body.changeURL)}/${ID}`;
               const msg = {
                    to: req.body.username,
                    from: 'msumansavio.mycodes@gmail.com',
                    subject: 'GWhoami - Forgot Password',
                    text: 'password reset URL',
                    html: `Hi ${result.name},<br/><br/>We have received a request to reset your password. To reset your password please click on the following link in the browser-<br/><br/><a href="${URL}">${URL}</a><br/><br/>Thanks,<br/>GWhoami Admin`
               }
               sgMail.setApiKey(process.env['EMAIL_API']);
               await sgMail.send(msg);
               res.json({success: true});
          }
     } catch (err) {
          res.status(500).json({success: false, message: err.message});
     }
     
});

router.get('/checkusername', async(req, res)=>{
     try {
          const result = await PasswordChangeList.findById(req.query.id);
          if (!result) res.json({success: false});
          else {
               const user = await UserBasicInfo.findOne({username: result._doc.email});
               if (!user) res.json({success: false});
               else res.send({success: true,userid: user._doc._id, ...result._doc});
          }
     } catch (err) {
          res.status(500).json({success: false, message: err.message});
     }
});

router.get('/changepassword', async(req, res)=>{
     try {
          const result = await UserBasicInfo.findByIdAndUpdate(req.query.userid, {password: req.query.password});
          await PasswordChangeList.findByIdAndRemove(req.query.id);
          res.json({success: true});
     } catch(err) {
          res.status(500).json({success: false, message: err.message});
     }
});



module.exports = router;