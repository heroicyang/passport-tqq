# Passport-TQQ

适用于[Passport](http://passportjs.org/)的[Tencent QQ](http://www.qq.com/)登录认证策略。

## Install

    $ npm install passport-tqq

## Usage

#### Configure Strategy
```
  passport.use(new TqqStrategy({
      clientID: QQ_APP_ID,
      clientSecret: QQ_APP_KEY,
      callbackURL: "http://localhost:3000/auth/qq/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOrCreate({ qqId: profile.id }, function (err, user) {
        return done(err, user);
      });
    }
  ));
```
#### Authenticate Requests
```
  // QQ登录认证时 `state` 为必填参数
  // 系client端的状态值，用于第三方应用防止CSRF攻击，成功授权后回调时会原样带回
  app.get('/auth/qq', function (req, res, next) {
    req.session = req.session || {};
    req.session.authState = crypto.createHash('sha1')
                              .update(-(new Date()) + '')
                              .digest('hex');
    passport
      .authenticate('qq', { 
        state: req.session.authState 
      })(req, res, next);
  });

  app.get('/auth/qq/callback', function (req, res, next) {
    // 通过比较认证返回的`state`状态值与服务器端`session`中的`state`状态值
    // 决定是否继续本次授权
    if(req.session && req.session.authState 
          && req.session.authState === req.query.state) {
      passport
        .authenticate('qq', { 
          failureRedirect: '/login' 
        })(req, res, next);
    } else {
      return next(new Error('Auth State Mismatch'));
    }
  },
  function(req, res) {
    res.redirect('/');
  });
```
#### Extended Permissions

可以配置用户授权时向用户显示的可进行授权的列表。

```
  app.get('/auth/qq',
      passport.authenticate('qq', {
        state: 'random state value',
        scope: ['get_user_info', 'list_album'] 
      }));
```

## Examples

见 [https://github.com/heroicyang/passport-tqq/tree/master/example](https://github.com/heroicyang/passport-tqq/tree/master/example)

## Credits

  - [Heroic Yang](http://github.com/heroicyang)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2011-2013 Heroic Yang <[http://heroicyang.com/](http://heroicyang.com/)>