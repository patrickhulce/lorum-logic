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
