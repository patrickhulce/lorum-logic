angular.module('lorum.logic.config', []).provider('LorumConfig', function () {
  this.views = {};
  this.hooks = [];

  this.addView = function (viewName, url) {
    this.views[viewName] = url;
  };

  this.addHook = function (ctrlName, hookFunc) {
    this.hooks.push({controller: ctrlName, hook: hookFunc});
  };

  this.$get = function () {
    var views = this.views;
    var hooks = this.hooks;
    return {
      getView: function (viewName) {
        return views[viewName] || viewName;
      },
      hook: function (ctrlName, $scope) {
        hooks.filter(function (hookDef) {
          return ctrlName === hookDef.controller;
        }).forEach(function (hookDef) {
          hookDef.hook($scope);
        });
      }
    };
  };
});

angular.module('lorum.logic.controllers.games.detail', []).
  controller('GameDetailCtrl',
    ['$scope', '$stateParams', '$state', 'LorumConfig', 'GamesService',
    function ($scope, $stateParams, $state, Config, Games) {
      $scope.game = null;
      $scope.ui = {
        isLoading: false
      };

      $scope.reload = function () {
        $scope.ui.isLoading = true;
        Games.fetchById($stateParams.gameId).
          success(function (result) {
            $scope.game = result;
            $scope.gameData = result.serialize();
            $scope.ui.isLoading = false;
          }).
          error(function (error) {
            $state.go(Config.getView('games.all'));
          });
      };

      $scope.reload();
      Config.hooks('GameDetailCtrl', $scope);
  }]);

angular.module('lorum.logic.controllers.games.list', []).
  controller('GameListCtrl', ['$scope', 'GamesService',
    function ($scope, Games) {
      $scope.games = [];
      $scope.isLoading = false;

      $scope.reload = function () {
        $scope.isLoading = true;
        Games.fetchAll().success(function (result) {
          $scope.isLoading = false;
          $scope.games = result;
        });
      };

      $scope.reload();
      Config.hooks('GameListCtrl', $scope);
  }]);

angular.module('lorum.logic.controllers.games.new', []).
  controller('GameNewCtrl', ['$scope', '$state', 'GamesService', 'UsersService',
    function ($scope, $state, Games, Users) {
      $scope.name = '';
      $scope.playerIds = [];
      $scope.isRanked = true;

      $scope.availableUsers = [];
      Users.fetchAll().success(function (results) {
        $scope.availableUsers = results;
      });

      $scope.$watch('playerIds', function () {
        var playerNames = $scope.playerIds.map(function (id) {
          return _.find($scope.availableUsers, {id: id}).firstName;
        });
        if (playerNames.length === 0) playerNames = ['?'];
        $scope.name = 'Game with ' + playerNames.join(', ');
      }, true);

      $scope.isSaveable = function () {
        return _.uniq($scope.playerIds).length === 4 &&
          $scope.playerIds.reduce(function (x, y) {
            return x && y;
          });
      };

      $scope.save = function () {
        Games.create($scope.name, $scope.playerIds, !$scope.isRanked).
          success(function (game) {
            $state.go(Config.getView('games.detail'), {
              gameId: game.id
            });
          });
      };
      Config.hooks('GameNewCtrl', $scope);
  }]);

angular.module('lorum.logic.controllers.games.scores', []).
  controller('GameScoresCtrl', ['$scope', 'GamesService', 'LorumLogic',
    function ($scope, Games, LorumLogic) {
      var scoresObj = function (players, score) {
        if (!score) score = 0;
        return _(players).
          indexBy('id').
          mapValues(function () {
            return score;
          }).value();
      };

      $scope.gameNames = LorumLogic.GameTypeNames;

      $scope.individualScores = [];
      $scope.totalScores = [];

      var ui = {
        activeRound: 1,
        activeGameType: 1,
        isMoonShotUIActive: false
      };

      var forms = {
        nextScores: scoresObj([]),
        selectedUser: -1
      };

      $scope.uiState = ui;
      $scope.uiFormData = forms;

      $scope.isFinished = function () {
        return !($scope.game && $scope.game.getCurrentHandMetadata());
      };

      $scope.isUpdate = function () {
        var currentHand = $scope.game && $scope.game.getCurrentHandMetadata();
        if (!currentHand) return true;
        return ui.activeRound !== currentHand.round ||
          ui.activeGameType !== currentHand.gameType;
      };

      $scope.isValidScore = function () {
        var scores = _.values(forms.nextScores);
        return LorumLogic.isValidScore(ui.activeGameType, scores);
      };

      $scope.canBomb = function () {
        return LorumLogic.isBomb(ui.activeGameType);
      };

      $scope.canShootMoon = function () {
        return LorumLogic.canShootMoon(ui.activeGameType);
      };

      $scope.setScore = function (playerId, score) {
        forms.nextScores[playerId] = score;
      };

      $scope.scoreFor = function (playerId, handMeta) {
        if (!handMeta) handMeta = $scope.game && $scope.game.getLastCompletedHandMetadata();
        if (!handMeta) return '-';
        return $scope.totalScores[handMeta.round - 1][handMeta.gameType - 1][playerId];
      };

      $scope.selectUser = function (playerId) {
        var target = $scope.canShootMoon() ? 10 : 0;
        var scores = scoresObj($scope.game.getActivePlayers(), target);
        scores[playerId] = 10 - target;

        forms.selectedUser = playerId;
        forms.nextScores = scores;
      };

      $scope.selectHand = function (round, gameType) {
        ui.activeRound = round;
        ui.activeGameType = gameType;
        ui.isMoonShotUIActive = false;

        var scores = $scope.individualScores[round - 1][gameType - 1];
        forms.nextScores = scores;
        forms.selectedUser = -1;

        if (LorumLogic.isBomb(gameType)) {
          forms.selectedUser = _.findKey(scores, function (x) {
            return x === 10;
          });
        } else if (_.sum(scores) === 30) {
          ui.isMoonShotUIActive = true;
          forms.selectedUser = _.findKey(scores, function (x) {
            return x === 0;
          });
        }

        if ($scope.setView) {
          $scope.setView('record');
        }
      };

      $scope.submitScore = function () {
        var func = $scope.isUpdate() ?
          Games.updateScore :
          Games.recordScore;
        $scope.ui.isLoading = true;
        func({
          round: ui.activeRound,
          gameType: ui.activeGameType,
          gameId: $scope.game.id,
          scores: forms.nextScores
        }).success(function () {
          $scope.reload();
        });
      };

      $scope.resetUIState = function () {
        var currentHand = $scope.game.getCurrentHandMetadata() || {};

        ui.activeGameType = currentHand.gameType;
        ui.activeRound = currentHand.round;
        ui.isMoonShotUIActive = false;

        forms.selectedUser = -1;
        forms.nextScores = scoresObj($scope.game.getActivePlayers());
      };

      $scope.$watch('game', function (game) {
        if (!game || !game.hands) return;

        $scope.resetUIState();
        $scope.individualScores = game.getIndividualScoresMatrix();
        $scope.totalScores = game.getRunningTotalScoresMatrix();

        $scope.ui.isLoading = false;
      }, true);

      Config.hooks('GameScoresCtrl', $scope);
    }]);

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

angular.module('lorum.logic', [
  'lorum.logic.config',
  'lorum.logic.controllers.games.detail',
  'lorum.logic.controllers.games.list',
  'lorum.logic.controllers.games.new',
  'lorum.logic.controllers.games.scores',
  'lorum.logic.helpers.logic',
  'lorum.logic.models.game',
  'lorum.logic.services.games',
  'lorum.logic.services.users'
]);

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

angular.module('lorum.logic.services.games', []).provider('GamesService', function () {
  this.baseUrl = '';
  this.setUrl = function (url) {
    this.baseUrl = url.trim().replace(/\/$/, '');
  };

  this.$get = ['$http', 'GameModel', function ($http, GamesModel) {
    var baseUrl = this.baseUrl;
    return {
      /**
       * Fetches all games.
       * @returns {HttpPromise} Array of all games.
       */
      fetchAll: function () {
        return $http.get(baseUrl + '/games').success(function (r) {
          return r.map(GamesModel.fromJson);
        });
      },
      /**
       * Fetches a single game by id.
       * @returns {HttpPromise} The game with the matching id.
       */
      fetchById: function (id) {
        return $http.get(baseUrl + '/games/' + id).success(function (r) {
          return GamesModel.fromJson(r);
        });
      },
      /**
       * Creates a new game.
       * @param name The name of the game to create
       * @param playerIds An array of the user IDs of the players.
       * @returns {HttpPromise} The newly created game.
       */
      create: function (name, playerIds, doNotTrack) {
        return $http.post(baseUrl + '/games', {
          name: name,
          playerIds: playerIds,
          doNotTrack: doNotTrack
        }).success(function (r) {
          return GamesModel.fromJson(r);
        });
      },
      /**
       * Updates a game's metadata.
       * @param id The ID of the game.
       * @param name The name of the game to create
       * @param playerIds An array of the user IDs of the players.
       * @returns {HttpPromise} Empty promise that succeeds if successful.
       */
      update: function (id, name, playerIds) {
        return $http.put(baseUrl + '/games/' + id, {
          name: name,
          playerIds: playerIds
        });
      },
      /**
       * Records a new score for a game.
       * @param score The score object of the following format:
       *
       * {
       *   round
       *   gameType
       *   gameId
       *   scores: {
       *     player1_id: score,
       *     player2_id: score
       *   }
       * }
       *
       * @returns {HttpPromise} Empty promise that succeeds if successful.
       */
      recordScore: function (score) {
        return $http.post(baseUrl + '/games/' + score.gameId + '/hands', score);
      },
      /**
       * Updates a score for a game.
       * @param game
       * @param score The score object has the same format as record score.
       * @returns {HttpPromise} Empty promise that succeeds if successful.
       */
      updateScore: function (score) {
        return $http.put(baseUrl + '/games/' + score.gameId + '/hands', score);
      }
    };
  }];
});

angular.module('lorum.logic.services.users', []).provider('UsersService', function () {
  this.baseUrl = '';
  this.setUrl = function (url) {
    this.baseUrl = url.trim().replace(/\/$/, '');
  };

  this.$get = ['$http', function ($http) {
    var baseUrl = this.baseUrl;
    return {
      fetchAll: function () {
        return $http.get(baseUrl + '/users').success(function (r) {
          return r.data;
        });
      }
    };
  }];
});
