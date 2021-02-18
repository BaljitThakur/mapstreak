const express = require("express");
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const colors = require('colors');
var Partner = require('./models/partnerModel');
const partnerRoute = require('./routes/partnerRoute');
var mongoose = require('mongoose');
const UserRoute=require('./routes/UserRoute');
const MerchantRoute=require('./routes/MerchantRoute');
var Merchant=require('./models/merchantModel')
const passport = require("passport");
const facebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const UserFb = require('./models/UserFb');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");
const UserGoogle=require('./models/UserGoogle')
 const User =require('./models/User')
 const tiffinServices= require('./data/tiffinServices');
 const tiffinRoutes = require('./routes/tiffinRoutes');
 const Tiffin = require('./models/tiffinServiceModel');


dotenv.config();
connectDB();
var app = express()
app.use(express.static('public'));
app.use(express.json());


app.use(partnerRoute);
app.use(UserRoute);
app.use(partnerRoute);
app.use(MerchantRoute);
app.use(tiffinRoutes);
app.set("view engine", "ejs");

app.use(passport.initialize());
app.use(passport.session());
app.use(session({secret:process.env.SECRET_KEY}));



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  UserFb.findById(id, function(err, user) {
    done(err, user);
  });

});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret:process.env.GOOGLE_SECRET,
  callbackURL: "http://localhost:3000/auth/google/Mapstreak",
  profileFields: ['id', 'displayName', 'name', 'gender','picture.type(large)','email'],
  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
  UserGoogle.findOrCreate({ googleId: profile.id, name: profile.name.givenName + ' ' + profile.name.familyName }, function (err, user) {
    return cb(err, user);
  });
}
));

passport.use(new facebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_PASS,
  callbackURL: "http://localhost:3000/facebook/callback",
  profileFields: ['id', 'displayName', 'name', 'gender','picture.type(large)','email']
},
function(token, refreshToken, profile, done) {
   // asynchronous
   process.nextTick(function() {

    // find the user in the database based on their facebook id
    UserFb.findOne({ 'uid' : profile.id }, function(err, user) {

        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err)
            return done(err);

        // if the user is found, then log them in
        if (user) {
            console.log("user found")
            console.log(user)
            return done(null, user); // user found, return that user
        } else {
            // if there is no user found with that facebook id, create them
            var newUser            = new UserFb();

            // set all of the facebook information in our user model
            newUser.uid    = profile.id; // set the users facebook id                   
            newUser.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
            newUser.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
            newUser.pic = profile.photos[0].value
            // save our user to the database
            newUser.save(function(err) {
                if (err)
                    throw err;

                // if successful, return the new user
                return done(null, newUser);
            });
        }

    });

})

}));

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));
app.get('/facebook/callback', passport.authenticate('facebook',{
  successRedirect: '/profile',
  failureRedirect:'/failed'
}))

app.get('/profile',(req,res) => {
  res.redirect('/');
})

app.get('/failed',(req,res) => {
  res.redirect('/login');
})



app.get('/', (req, res) => {
  res.render('home');
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile']
 }));

 app.get('/auth/google/Mapstreak', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
app.get('/aboutus',(req,res) => {
    res.render('aboutus');
});

app.get('/contactus',(req,res) => {
    res.render('contactus');
});

app.get('/submitted', (req,res)=>{
  res.render('submitted');
});


app.get('/privacypolicy',(req,res) => {
 res.render('privacy_policy');
});

app.get('/termsandconditions', (req,res) => {
  res.render('terms_and_condition');
});

app.get('/contactus',(req,res)=>{
  res.render('contactus');
});

app.get('/autocomplete/', function(req, res, next) {

  var regex= new RegExp(req.query["term"],'i');
 
  var TiffinFilter =Tiffin.find({name:regex},{'name':1}).sort({"updated_at":-1}).sort({"created_at":-1}).limit(20);
  TiffinFilter.exec(function(err,data){


var result=[];
if(!err){
   if(data && data.length && data.length>0){
     data.forEach(user=>{
       let obj={
         id:user._id,
         label: user.name
       };
       result.push(obj);
     });

   }
 
   res.jsonp(result);
}

  });

});



PORT =  process.env.PORT || 5000;

app.listen(PORT, ()=> console.log(`Server started at port ${PORT}`));
