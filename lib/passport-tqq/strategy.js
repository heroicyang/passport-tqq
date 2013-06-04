/**
 * Module dependencies.
 */
var util = require('util')
  , querystring = require('querystring')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , InternalOAuthError = require('passport-oauth').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The Tencent QQ authentication strategy authenticates requests by delegating to
 * Tencent QQ using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Tencent QQ application's App ID
 *   - `clientSecret`  your Tencent QQ application's App Key
 *   - `callbackURL`   URL to which Tencent QQ will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new TqqStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/qq/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://graph.qq.com/oauth2.0/authorize';
  options.tokenURL = options.tokenURL || 'https://graph.qq.com/oauth2.0/token';
  options.scopeSeparator = options.scopeSeparator || ',';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'qq';

  var _oauth2_get = this._oauth2.get.bind(this._oauth2);
  this._oauth2.get = function (url, access_token, callback) {
    var extraQueryStr = querystring.stringify({
      oauth_consumer_key: this._clientId
    });
    url += (url.indexOf('?') === -1 ? '?' : '&') + extraQueryStr;
    _oauth2_get(url, access_token, callback);
  };
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Return extra QQ-specific parameters to be included in the authorization request.
 *
 * Options:
 *  - `state`  Client-side state value. For third-party applications to prevent CSRF attacks.
 *
 * @param {Object} options
 * @return {Object}
 * @api protected
 */
Strategy.prototype.authorizationParams = function (options) {
  if(!options.state) {
      throw new Error('Authentication Parameter `state` Required');
  } else {
      return options;
  }
};

/**
 * Retrieve user profile from QQ.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `tqq`
 *   - `id`               the user's OpenID
 *   - `nickname`         the user's QZone nickname
 *   - `gender`           the user's gender
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  var oauth2 = this._oauth2
    , openIDURL = 'https://graph.qq.com/oauth2.0/me'
    , profileURL = 'https://graph.qq.com/user/get_user_info'
    , openID;

  oauth2.get(openIDURL, accessToken, function (err, result, res) {
    if (err) { 
      return done(new InternalOAuthError('failed to fetch user profile', err)); 
    }

    try {
      openID = JSON.parse(result.match(/\{.*\}/)[0]).openid;
      profileURL +=  '?openid=' + openID;
    } catch (e) {
      return done(e);
    }
    
    oauth2.get(profileURL, accessToken, function (err, result, res) {
      try {
        var json = JSON.parse(result)
          , profile = { provider: 'qq' };

        profile.id = openID;
        profile.nickname = json.nickname;
        profile.gender = json.gender;
        profile._raw = result;
        profile._json = json;

        done(null, profile);
      } catch (e) {
        done(e);
      }
    });
  });
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;