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
