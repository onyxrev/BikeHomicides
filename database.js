var couchDbHost  = "localhost";
var databaseName = "bike_homicides";
var nano         = require('nano')('http://' + couchDbHost + ':5984');

// create our DB just in case it doesn't exist
nano.db.create(databaseName, function(err, body) {
  if (!err) {
    console.log(databaseName, 'db created');
  }
});

var database = {
  connection: nano.use(databaseName),

  storeTweet:  function(tweet){
    // save the tweet
    this.connection.insert({
      id:           tweet.id,
      twitter_user: tweet.user.screen_name,
      text:         tweet.text,
      created_at:   tweet.created_at
    }, function(err, body) {
      if (err) console.log("Error storing tweet", tweet);
    });
  }
};

module.exports = database;
