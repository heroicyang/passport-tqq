var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , crypto = require('crypto')
  , TqqStrategy = require('../lib/passport-tqq/').Strategy;

var QQ_APP_ID = 'blabla...'
var QQ_APP_KEY = 'blabla...';

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new TqqStrategy({
    clientID: QQ_APP_ID,
    clientSecret: QQ_APP_KEY,
    callbackURL: 'http://127.0.0.1:3000/auth/qq/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

var app = express();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

// GET /auth/qq
// QQ登录认证时 `state` 为必填参数
// 系client端的状态值，用于第三方应用防止CSRF攻击，成功授权后回调时会原样带回
app.get('/auth/qq', function (req, res, next) {
  req.session = req.session || {};
  req.session.authState = crypto.createHash('sha1')
                            .update(-(new Date()) + '')
                            .digest('hex');
  passport.authenticate('qq', {
    state: req.session.authState 
  })(req, res, next);
});

// GET /auth/qq/callback
// 通过比较认证返回的`state`状态值与服务器端`session`中的`state`状态值
// 决定是否继续本次授权
app.get('/auth/qq/callback', function (req, res, next) {
 if(req.session && req.session.authState 
        && req.session.authState === req.query.state) {
    passport
      .authenticate('qq', { 
        failureRedirect: '/'
      })(req, res, next);
  } else {
    return next(new Error('Auth State Mismatch'));
  }
},
function(req, res) {
    res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

require('http').createServer(app).listen(3000);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}
