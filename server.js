var _            = require('underscore');
var Twit         = require('twit');
var couchdb_host = "localhost";
var nano         = require('nano')('http://' + couchdb_host + ':5984');
var matchLib     = require('./matcher');
var matcher      = matchLib.matcher();

if (process.env.NODE_ENV === "production"){
  process.setgid("www");
  process.setuid("www");
}

// create our DB just in case it doesn't exist
nano.db.create('bike_homicides', function(err, body) {
  if (!err) {
    console.log('bike_homicides db created');
  }
});

var db = nano.use("bike_homicides");

var T = new Twit({
  consumer_key:        process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
  access_token:        process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

console.log("Bike Homicide started. Searching for threats.");

var stream = T.stream('statuses/filter', { track: matchLib.nouns });

var lowercase_text, data;
stream.on('tweet', function (tweet) {
  lowercase_text = tweet.text.toLowerCase();

  if (
    !lowercase_text.match(matcher) || // must match
    lowercase_text.match(/rt @/)      // no retweets
  ) return;

  // yeah? go! save it!
  data = {
    id:           tweet.id,
    twitter_user: tweet.user.screen_name,
    text:         tweet.text,
    created_at:   tweet.created_at
  };

  db.insert(data, function(err, body) {
    if (err) console.log("Error storing tweet", data);
  });

  // provide for some time for the tweet to propagate
  setTimeout(function(){
    T.post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
      if (err) console.log("Error retweeting", err);
      else console.log("Retweeted", tweet.id, "by user", tweet.user.screen_name);
    })
  }, 10000);
});
