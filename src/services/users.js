angular.module('lorum.logic.services.users', []).provider('UsersService', function () {
  this.baseUrl = '';
  this.setUrl = function (url) {
    this.baseUrl = url.trim().replace(/\/$/, '');
  };

  this.$get = ['$http', function ($http) {
    var baseUrl = this.baseUrl;
    return {
      fetchAll: function () {
        return $http.get(baseUrl + '/users').success(function (r) {
          return r.data;
        });
      }
    };
  }];
});
