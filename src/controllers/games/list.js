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
