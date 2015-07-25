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
