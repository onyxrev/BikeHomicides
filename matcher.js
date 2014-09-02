var _ = require('underscore');

var nouns = [
  'bicycles',
  'cyclists',
  'bikers',
  'bicyclist',
  'bicyclists',
  'on a bike',
  'bicycle',
  'cyclist',
  'biker'
];

var verbs = [
  'hit',
  'run over',
  'ran over',
  'kill',
  'killed',
  'murdered',
  'murder',
  'snuff',
  'eliminate',
  'slay',
  'assasinate',
  'exterminate',
  'squash',
  'squashed',
  'roadkill',
  'squish',
  'squished'
];

var articles = [
  "the",
  "an",
  "a"
];

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

  return new RegExp(string, "i");
};

module.exports = {
  auxVerbs: [
    "I",
    "nearly",
    "almost",
    "I'd",
    "We'd",
    "I'll",
    'should',
    "gonna",
    "going to",
    "wanna",
    "want to",
    'will',
    'shoulda',
    "would like to",
    "need to",
    "almost",
    'just about'
  ],

  nouns: nouns,
  verbs: verbs,

  adverbMatcher: [
    "(?:(?:",
    [
      "just",
      "already",
      "just now",
      "lately",
      "recently",
      "once",
      "really",
      "could",
      "would"
    ].join("|"),
    ")\\W+)"
  ].join(""),

  pronounMatcher: [
    "(?:(?:",
    [
      "a",
      "an",
      "this",
      "that",
      "those",
      "them"
    ].join("|"),
    ")\\W+)"
  ].join(""),

  phraseMatchers: [
    regexpPhraseBuilder(["drove", "drives"], "into", articles, nouns.concat("bike"), "lane"),
    regexpPhraseBuilder(["taxicab", "taxi", "car", "bus", "truck", "semi", "motorcycle"], verbs, articles, nouns)
  ],

  aggressiveFragments: function(){
    var self = this;

    var fragments = _.map(this.verbs, function(verb){
      var murdererAction = ["\\b", self.adverbMatcher, "?", verb, "\\b\\W+", self.pronounMatcher, "?"].join("");

      return _.map(self.nouns, function(noun){
        return [murdererAction, "\\b", noun, "\\b"].join("");
      });
    });

    return _.flatten(fragments);
  },

  aggressivePhrases: function(){
    var self = this;
    var aggressiveFragments = this.aggressiveFragments();

    var phrases = _.map(this.auxVerbs, function(auxVerb){
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
