angular.module('lorum.logic.controllers.settings', []).
  controller('SettingsCtrl', ['$scope', 'LorumConfig',
    function ($scope, Config) {
      $scope.games = [];
      $scope.isLoading = false;

      Config.hooks('SettingsCtrl', $scope);
  }]);
