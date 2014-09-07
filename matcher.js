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

  return new RegExp(string, "i");
};

var optionalMatcherBuilder = function(words, optional){
  return [
    "(?:(?:",
    words.join("|"),
    ")\\W+)",
    optional ? "?" : ""
  ].join("")
};

module.exports = {
  adverbMatcher:    optionalMatcherBuilder(dictionary.adverbs),
  pronounMatcher:   optionalMatcherBuilder(dictionary.pronouns),
  swearWordMatcher: optionalMatcherBuilder(dictionary.swearWords),
  fuckingMatcher:   optionalMatcherBuilder(dictionary.fucking),

  phraseMatchers: [
    regexpPhraseBuilder(
      ["drove", "drives"],             // drove
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
      dictionary.auxVerbs,                                 // I'll
      optionalMatcherBuilder(dictionary.fucking, true),    // fucking
      "run",                                               // run
      optionalMatcherBuilder(dictionary.pronouns, true),   // these
      optionalMatcherBuilder(dictionary.swearWords, true), // faggot
      dictionary.nouns,                                    // cyclists
      "over"                                               // over
    ),
  ],

  aggressiveFragments: function(){
    var self = this;

    var fragments = _.map(dictionary.verbs, function(verb){
      var murdererAction = ["\\b", self.fuckingMatcher, "?", self.adverbMatcher, "?", verb, "\\b\\W+", self.pronounMatcher, "?", self.swearWordMatcher, "?"].join("");

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

  doesTweetMatchAPhrase: function(tweetBody){
    var lowercaseBody = tweetBody.toLowerCase();

    return _.find(this.phraseMatchers, function(phraseMatcher){
      return tweetBody.match(phraseMatcher);
    });
  },

  doesTweetMatchKeywords: function(tweetBody){
    var lowercaseBody = tweetBody.toLowerCase();

    return lowercaseBody.match(this.matcher())
  },

  doesTweetMatch: function(tweetBody){
    // we aren't interested in retweeting retweets or quotes
    if (this.isTweetARetweet(tweetBody)) return false;
    if (this.isTweetAQuote(tweetBody))   return false;

    if (this.doesTweetMatchAPhrase(tweetBody))  return true;
    if (this.doesTweetMatchKeywords(tweetBody)) return true;

    return false;
  },

  matcher: function(){
    return this._matcher = this._matcher || new RegExp(this.aggressivePhrases().join("|"), "i");
  }
};
