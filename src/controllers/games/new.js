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
            $state.go('tab.games-detail', {
              gameId: game.id
            });
          });
      };
  }]);
