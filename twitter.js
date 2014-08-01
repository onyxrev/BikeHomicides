var Twit = require('twit');

module.exports = {
  connection: new Twit({
    consumer_key:        process.env.TWITTER_CONSUMER_KEY,
    consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
    access_token:        process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  }),

  keywordSearch: function(keywords, callback){
    this.connection.
      stream('statuses/filter', { track: keywords }).
      on('tweet', function (tweet) {
        callback(tweet);
      });
  },

  retweet: function(tweet){
    // retweet the tweet
    this.connection.
      post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
        if (err) console.log("Error retweeting", err);
        else console.log("Retweeted", tweet.id, "by user", tweet.user.screen_name);
      })
  }
};
