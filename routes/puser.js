const express = require("express")
const PUser = require("../model/puser.model")
const Profile = require("../model/profile.model");
const config = require("../config");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const DUser = require("../model/duser.model")

//java web token generated for every idividual user
const router = express.Router();
//routes is used from the index page
// Use the express.Router class to create modular, mountable route handlers.
// A Router instance is a complete middleware and routing system;
//  for this reason, it is often referred to as a “mini-app”.
const fs = require('fs');

const middleware = require("../middleware")



router.route("/").get((req,res)=> res.json("Your UDser Page Got it"));

router.route("/:username").get(middleware.checkToken , (req, res) => {
    User.findOne({ username: req.params.username }, (err, result) => {
      if (err) return res.status(500).json({ msg: err });
      return res.json({
        data: result,
        username: req.params.username,
      });
    });
  });



router.route("/login").post((req, res) => {
  PUser.findOne({ username: req.body.username }, (err, result) => {
      if (err) return res.status(500).json({ msg: err });
      if (result === null) {
        return res.status(403).json("Username incorrect");
      }
      if (result.password === req.body.password) {
        // here we implement the JWT token functionality
        let token = jwt.sign({ username: req.body.username }, config.key, {
          //  expiresIn:"24h" //token expiring duration
        });
        res.json({
          token: token,
          msg: "success",
        });
      } else {
        res.status(403).json("password is incorrect");
      }
    });
  });
  
router.route("/register").post((req, res) => {
    console.log("inside the register");// checking our entry

    //exported from user.model to create a user object that follows the schema
    //this is being saved in the user database of the mongo db 
    const user = new PUser({ 
      name: req.body.name,
      phone:req.body.phone,
      password: req.body.password,
      email: req.body.email,
    }); //object created from the schema 
    user
      .save() // saving to mongoose
      .then(() => {
        console.log("Puser registered");
        res.status(200).json({ msg: "PUser Successfully Registered" });
      })
      .catch((err) => {
        res.status(403).json({ msg: err }); // checeking for the error
      });
  });
  

  router.route("/deletephoto").delete(middleware.checkToken, (req, res) => {
    PUser.findOne(
      { _id: req.decoded.id }
      ,
      (err, result) => {
        if (err) {console.log("deleted"); return res.json(err);}
        else if (result) {
          console.log(result);
          const deleteFile = "uploads/"+result["username"]+".jpg";
          console.log(deleteFile);
          if (fs.existsSync(deleteFile)) {
            fs.unlink(deleteFile, (err) => {
                if (err) {
                    console.log(err);
                  }
                console.log('Image deleted');
                //making the changes in profile
                PUser.findOneAndUpdate(
                  { _id: req.decoded.id },
                  {
                    $set: {
                      img:""
                    },
                  },
                  { new: true },
                  (err, result) => {
                    if (err) console.log("Error Updating");
                    if (result == null)  console.log("Profile data not found");
                    else  console.log("Img updated to Null");
                  }
                );
                 })
          }
          console.log(result);
          return res.status(200).json("Blog deleted");
        }
        else{
        return res.json("Blog not deleted");}
      }
    );
  });

  router.route("/sendrerq/:email/:pemail").get( (req, res) => {
    //finding the profile data of the user from mongodb database
    DUser.findOneAndUpdate( // to find the user and update the password from the collections
    { email: req.params.email },//user name remains the same
    { $addToSet: { requests : [req.params.pemail] },
    // password is set from the postman body
   },{ new: true },
    (err, result) => {
      if (err) return res.json({ msg: err });
      else{
      const msg = {
        msg: "request sent",
        attribute: req.params.attr,
      };
      // return res.status(200).json(msg);
    }
    }
  );
  PUser.findOneAndUpdate( // to find the user and update the password from the collections
  { pemail: req.params.pemail },//user name remains the same
  { $addToSet: { requests : [req.params.email] },
  // password is set from the postman body
 },{ new: true },
  (err, result) => {
    if (err) return res.json({ msg: err });
    else{
    const msg = {
      msg: "request sent",
      attribute: req.params.attr,
    };
     return res.status(200).json(msg);}
  }
);
  });

  module.exports = router