angular.module('lorum.logic.controllers.games.detail', []).
  controller('GameDetailCtrl',
    ['$scope', '$stateParams', '$state', 'LorumConfig', 'GamesService',
    function ($scope, $stateParams, $state, Config, Games) {
      $scope.game = null;
      $scope.gameData = null;
      $scope.ui = {
        isLoading: false
      };

      $scope.reload = function () {
        $scope.ui.isLoading = true;
        Games.fetchById($stateParams.gameId).
          success(function (result) {
            $scope.game = result;
            $scope.ui.isLoading = false;
          }).
          error(function (error) {
            $state.go(Config.getView('games.all'));
          });
      };

      $scope.$watch('game', function (game) {
        if (!game) return;
        $scope.gameData = game.serialize();
      }, true);

      $scope.reload();
      Config.hooks('GameDetailCtrl', $scope);
  }]);
