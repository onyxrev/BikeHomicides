var _ = require('underscore');

var dictionary = require('./dictionary');

var regexpPhraseBuilder = function(){
  var args = _.toArray(arguments);

  var string = _.map(args, function(arg){
    if (_.isArray(arg)){
      return [
        "(",
        arg.join("|"),
        ")"
      ].join("");
    }

    return arg;
  }).join(" ");

  // optional matchers already take into account whitespace, so remove
  // the extra space
  string = string.replace(/(\\W\+\)\??) /g, "\$1");

  return string;
};

var optionalMatcherBuilder = function(words, optional){
  return [
    "(?:(?:",
    words.join("|"),
    ")\\W+)",
    optional ? "?" : ""
  ].join("")
};

var matchers = {
  adverbMatcher:    optionalMatcherBuilder(dictionary.adverbs,    true),
  pronounMatcher:   optionalMatcherBuilder(dictionary.pronouns,   true),
  swearWordMatcher: optionalMatcherBuilder(dictionary.swearWords, true),
  fuckingMatcher:   optionalMatcherBuilder(dictionary.fucking,    true)
};

var phraseMatcher = (function(){
  var phrases = [
    regexpPhraseBuilder(
      ["drove", "dive", "drives"],     // drove
      "into",                          // into
      dictionary.articles,             // a
      dictionary.nouns.concat("bike"), // bike
      "lane"                           // lane
    ),
    regexpPhraseBuilder(
      dictionary.motorVehicles,        // car
      dictionary.verbs,                // ran over
      dictionary.articles,             // a
      dictionary.nouns                 // biker
    ),
    regexpPhraseBuilder(
      ["door", "doored"],              // doored
      dictionary.articles,             // a
      dictionary.nouns                 // cyclist
    ),
    regexpPhraseBuilder(
      dictionary.nouns,                // cyclist
      dictionary.linkingVerbs,         // got
      ["door", "doored"]               // doored
    ),
    regexpPhraseBuilder(
      dictionary.auxVerbs,             // I'll
      matchers.fuckingMatcher,         // fucking
      "run",                           // run
      matchers.pronounMatcher,         // these
      matchers.swearWordMatcher,       // faggot
      dictionary.nouns,                // cyclists
      "over"                           // over
    )
  ];

  return new RegExp(phrases.join("|"), "i");
})();

var innocuousPhrases = (function(){
  var phrases = [
    regexpPhraseBuilder(
      "bicycle", "kick"
    )
  ];

  return new RegExp(phrases.join("|"), "i");
})();

module.exports = {
  aggressiveFragments: function(){
    var self = this;

    var fragments = _.map(dictionary.verbs, function(verb){
      var murdererAction = ["\\b", matchers.fuckingMatcher, matchers.adverbMatcher, matchers.fuckingMatcher, verb, "\\b\\W+", matchers.pronounMatcher, matchers.swearWordMatcher].join("");

      return _.map(dictionary.nouns, function(noun){
        return [murdererAction, "\\b", noun, "\\b"].join("");
      });
    });

    return _.flatten(fragments);
  },

  aggressivePhrases: function(){
    var self = this;
    var aggressiveFragments = this.aggressiveFragments();

    var phrases = _.map(dictionary.auxVerbs, function(auxVerb){
      return _.map(aggressiveFragments, function(aggressiveFragment){
        return ["\\b", auxVerb, "\\b\\W+", aggressiveFragment].join("");
      });
    });

    return _.flatten(phrases);
  },

  isTweetARetweet: function(tweetBody){
    var lowercaseBody = tweetBody.toLowerCase();

    return lowercaseBody.match(/\b(rt|mt)\b ?@/i); // no retweets
  },

  isTweetAQuote: function(tweetBody){
    var lowercaseBody = tweetBody.toLowerCase();

    return lowercaseBody.match(/["|'|“|”]@.*/);
  },

  isTweetInnocuous: function(tweetBody){
    var lowercaseBody = tweetBody.toLowerCase();

    return lowercaseBody.match(innocuousPhrases);
  },

  doesTweetMatchAPhrase: function(tweetBody){
    var lowercaseBody = tweetBody.toLowerCase();

    return tweetBody.match(phraseMatcher);
  },

  doesTweetMatchKeywords: function(tweetBody){
    var lowercaseBody = tweetBody.toLowerCase();

    return lowercaseBody.match(this.matcher())
  },

  doesTweetMatch: function(tweetBody){
    // we aren't interested in retweeting retweets or quotes
    if (this.isTweetARetweet(tweetBody))  return false;
    if (this.isTweetAQuote(tweetBody))    return false;
    if (this.isTweetInnocuous(tweetBody)) return false;

    if (this.doesTweetMatchAPhrase(tweetBody))  return true;
    if (this.doesTweetMatchKeywords(tweetBody)) return true;

    return false;
  },

  matcher: function(){
    return this._matcher = this._matcher || new RegExp(this.aggressivePhrases().join("|"), "i");
  }
};
