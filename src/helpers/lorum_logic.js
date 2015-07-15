angular.module('lorum.logic.helpers.logic', []).factory('LorumLogic', function () {
  var gt = {
    HEARTS: 1,
    UPPERS: 2,
    EACH: 3,
    LAST: 4,
    RED_KING: 5,
    BABY_BLUE: 6,
    QUARTET: 7,
    SEVENUP: 8
  };

  var names = [
    null,
    'Piros Fogas',
    'Felso Fogas',
    'Utes Fogas',
    'Utolsho',
    'Piros Kiraly',
    'Muck Also',
    'Kvartett',
    'Laracos'
  ];

  var handsCompleted = function (round, gameType) {
    if (!round || !gameType) return 0;
    return (round - 1) * 8 + gameType;
  };

  return {
    GameTypes: gt,
    GameTypeNames: names,
    isValidScore: function (gameType, scores) {
      var allNumbers = scores.length === 4 && _.every(scores, function (score) {
          return typeof score === 'number';
        });
      if (!allNumbers) return false;

      var sum = _.sum(scores);
      var contains = function (v) {
        return _.contains(scores, v);
      };

      switch (gameType) {
        case gt.HEARTS:
        case gt.EACH:
          return sum === 8 || (sum === 30 && contains(0));
        case gt.UPPERS:
          return sum === 10 || (sum === 30 && contains(0));
        case gt.LAST:
        case gt.RED_KING:
        case gt.BABY_BLUE:
          return sum === 10 && contains(10);
        case gt.QUARTET:
        case gt.SEVENUP:
          return contains(0) && !contains(9) && !contains(10) && !_.every(scores, function (x) {
              return x === 0;
            });
      }
    },
    isBomb: function (gameType) {
      return _.contains([gt.LAST, gt.RED_KING, gt.BABY_BLUE], gameType);
    },
    canShootMoon: function (gameType) {
      return _.contains([gt.HEARTS, gt.UPPERS, gt.EACH], gameType);
    },
    handsCompleted: handsCompleted,
    percentComplete: function (round, gameType) {
      return handsCompleted(round, gameType) / 32 * 100;
    }
  };
});
