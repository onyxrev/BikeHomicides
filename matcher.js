var _ = require('underscore');

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

  nouns: [
    'bicycles',
    'cyclists',
    'bikers',
    'bicyclist',
    'bicyclists',
    'on a bike',
    'bicycle',
    'cyclist',
    'biker'
  ],

  verbs: [
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
  ],

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

  aggressiveFragments: function(){
    var self = this;

    var fragments = _.map(this.verbs, function(verb){
      var murdererAction = ["\\b", verb, "\\b\\W+", self.pronounMatcher, "?"].join("");

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

  doesTweetMatch: function(tweetBody){
    var lowercaseBody = tweetBody.toLowerCase();

    return lowercaseBody.match(this.matcher()) && // must match
           !lowercaseBody.match(/rt @/);          // no retweets
  },

  matcher: function(){
    return this._matcher = this._matcher || new RegExp(this.aggressivePhrases().join("|"), "i");
  }
};
