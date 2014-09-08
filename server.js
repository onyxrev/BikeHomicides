var _          = require('underscore');
var database   = require('./database');
var twitter    = require('./twitter');
var matchLib   = require('./matcher');
var dictionary = require('./dictionary');

var matcher = matchLib.matcher();

if (process.env.NODE_ENV === "production"){
  process.setgid("www");
  process.setuid("www");
}

console.log("Bike Homicides started. Searching for threats.");

twitter.keywordSearch(dictionary.nouns, function(tweet){
  // if this isn't an interesting tweet just bail
  if (!matchLib.doesTweetMatch(tweet.text)) return;

  console.log("Match '", tweet.text, "'");

  database.storeTweet(tweet);

  // provide for some time for the tweet to propagate
  _.delay(twitter.retweet.bind(twitter), 10000, tweet);
});
