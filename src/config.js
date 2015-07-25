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
