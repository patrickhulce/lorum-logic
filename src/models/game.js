angular.module('lorum.logic.models.game', []).
  factory('GameModel', function () {
    var nextHand = function (handMeta) {
      if (!handMeta) return {
        round: 1,
        gameType: 1
      };
      if (handMeta.gameType === 8) {
        if (handMeta.round === 4) return;
        return {
          round: handMeta.round + 1,
          gameType: 1
        };
      }

      return {
        round: handMeta.round,
        gameType: handMeta.gameType + 1
      };
    };

    var prevHand = function (handMeta) {
      if (!handMeta) return;
      if (handMeta.gameType === 1) {
        if (handMeta.round === 1) return;
        return {
          round: handMeta.round - 1,
          gameType: 8
        };
      }

      return {
        round: handMeta.round,
        gameType: handMeta.gameType - 1
      };
    };

    return {
      fromJson: function (data) {
        var _data = _.extend({}, data);
        return _.extend(data || {}, {
          getActivePlayers: function () {
            if (!this.players) return [];

            return _(this.players).filter(function (player) {
              return player.userGames.isActive;
            }).sortBy(function (player) {
              return player.userGames.position;
            }).value();
          },
          getIndividualScoresMatrix: function () {
            return _(this.hands || []).
              groupBy('round').
              values().
              map(function (round) {
                return _(round).
                  groupBy('gameType').
                  values().
                  map(function (hand) {
                    return _(hand).
                      indexBy('scorerId').
                      mapValues('score').
                      value();
                  }).
                  value();
              }).value();
          },
          getRunningTotalScoresMatrix: function () {
            var activePlayers = this.getActivePlayers();

            var runningTotal = [];
            var totalScores = [];
            this.getIndividualScoresMatrix().forEach(function (round, i) {
              round.forEach(function (score, j) {
                if (!totalScores[i]) totalScores[i] = [];
                activePlayers.forEach(function (player) {
                  runningTotal[player.id] = (runningTotal[player.id] || 0) +
                    score[player.id];
                });
                totalScores[i][j] = _.assign({}, runningTotal);
              });
            });
            return totalScores;
          },
          getLastCompletedHandMetadata: function () {
            if (!this.hands || !this.hands.length) return;

            var lastHand = _.max(this.hands, function (hand) {
              return hand.round * 10 + hand.gameType;
            });

            return {
              round: lastHand.round,
              gameType: lastHand.gameType
            };
          },
          getCurrentHandMetadata: function () {
            return nextHand(this.getLastCompletedHandMetadata());
          },
          findHand: function (round, gameType, playerId) {
            var find = _.where;
            var criteria = {
              round: round,
              gameType: gameType
            };

            if (playerId) {
              criteria.scorerId = playerId;
              find = _.find;
            }

            return find(this.hands || [], criteria);
          },
          findPreviousHand: function (round, gameType, playerId) {
            var prevHandMeta = prevHand({round: round, gameType: gameType});
            return findHand(prevHandMeta.round, prevHandMeta.gameType, playerId);
          },
          serialize: function () {
            return _.extend({}, _data, {
              activePlayers: this.getActivePlayers(),
              lastCompletedHandMeta: this.getLastCompletedHandMetadata(),
              currentHandMeta: this.getCurrentHandMetadata()
            });
          }
        });
      }
    };
  });
