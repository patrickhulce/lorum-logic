angular.module('lorum.logic.controllers.games.edit', []).
  controller('GameEditCtrl', ['$scope', '$state', 'LorumConfig', 'GamesService', 'UsersService',
    function ($scope, $state, Config, Games, Users) {
      var isNew = !$state.params.gameId;
      $scope.isNew = isNew;
      $scope.name = '';
      $scope.playerIds = [];
      $scope.isRanked = true;
      $scope._game = {};
      $scope.ui = {isLoading: !isNew};

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
        var promise = isNew ?
          Games.create($scope.name, $scope.playerIds, !$scope.isRanked) :
          Games.update($scope._game.id, $scope.name, $scope.playerIds);

        promise.success(function (game) {
          $state.go(Config.getView('games.detail'), {
            gameId: $scope._game.id || game.id
          });
        });
      };

      if (!isNew) {
        Games.fetchById($state.params.gameId).
          success(function (result) {
            $scope.name = result.name;
            $scope.playerIds = _(result.players).
              filter('userGames.isActive').
              sortBy('userGames.position').
              pluck('id').value();
            $scope._game = result;
            $scope.ui.isLoading = false;
          }).
          error(function (error) {
            $state.go(Config.getView('games.all'));
          });
      }

      Config.hooks('GameEditCtrl', $scope);
  }]);
