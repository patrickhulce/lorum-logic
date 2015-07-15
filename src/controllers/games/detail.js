angular.module('lorum.logic.controllers.games.detail', []).
  controller('GameDetailCtrl', ['$scope', '$stateParams', '$state', 'GamesService',
    function ($scope, $stateParams, $state, Games) {
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
            $state.go('games.all');
          });
      };

      $scope.reload();
      $scope.$on('$ionicView.enter', $scope.reload);
  }]);
