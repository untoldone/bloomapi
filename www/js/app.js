angular.module('search', []).
  config(function($routeProvider) {
    $routeProvider.
      when('/', {controller: SearchCtrl, templateUrl: 'templates/search.html'}).
      when('/npi/:npi', {controller: ResultCtrl, templateUrl: 'templates/search-result.html'}).
      when('/:term', {controller: ResultsCtrl, templateUrl: 'templates/search-results.html'}).
      otherwise({redirectTo: '/'});
  });

function discoverAPI(term, page) {
  var root = window.location.protocol + "//" + window.location.host + "/api/search?",
      skip = page * 10,
      part
  if (/^\d{10}$/.exec(term)) {
    // npi
    part = "limit=10&offset=" + skip + "&key1=npi&op1=eq&value1=" + term;
  } else if (/^\d{5}$/.exec(term)) {
    // zipcode
    part = "limit=10&offset=" + skip + "&key1=practice_address.zip&op1=eq&value1=" + term;
  }

  return root + part;
}

function SearchCtrl() {

}

function ResultsCtrl($scope, $routeParams, $http) {
  $scope.apiuri = discoverAPI($routeParams.term, 0);
  $http.get($scope.apiuri).success(function (data) {
    $scope.results = data.result;
  });
}

function ResultCtrl($scope, $routeParams, $http) {
  $scope.apiuri = discoverAPI($routeParams.npi, 0);
  $http.get($scope.apiuri).success(function (data) {
    $scope.result = data.result[0];
  });
}
