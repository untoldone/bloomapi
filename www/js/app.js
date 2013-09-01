angular.module('search', []).
  config(function($routeProvider) {
    $routeProvider.
      when('/', {controller: SearchCtrl, templateUrl: 'templates/search.html'}).
      when('/npis/:npi', {controller: ResultCtrl, templateUrl: 'templates/search-result.html'}).
      when('/:term/:page', {controller: ResultsCtrl, templateUrl: 'templates/search-results.html'}).
      when('/:term', {controller: ResultsCtrl, templateUrl: 'templates/search-results.html'}).
      otherwise({redirectTo: '/'});
  });

function discoverAPI(term, page) {
  var root = window.location.protocol + "//" + window.location.host + "/api/search?",
      skip = (page - 1) * 10,
      part,
      match;

  term = term.trim();

  if (/^\d{10}$/.exec(term)) {
    // npi
    part = "limit=10&offset=" + skip + "&key1=npi&op1=eq&value1=" + term;
  } else if (/^(\d{5}|\d{9})$/.exec(term)) {
    // zipcode
    part = "limit=10&offset=" + skip + "&key1=practice_address.zip&op1=eq&value1=" + term;
  } else if (/^([a-zA-Z]+)$/.exec(term)) {
    // lastname
    part = "limit=10&offset=" + skip + "&key1=last_name&op1=eq&value1=" + term.toUpperCase();
  } else if (match = /^([a-zA-Z]+)((\s+[a-zA-Z]+)+)$/.exec(term)) {
    part = "limit=10&offset=" + skip + "&key1=last_name&op1=eq&value1=" + match[2].trim().toUpperCase() +
           "&key2=first_name&op2=eq&value2=" + match[1].trim().toUpperCase();
  } else if (match = /^([\d\w\s]+),\s*(\w+),\s*(\w+)\s*(\d+)$/.exec(term)) {
    var address_line = match[1].trim().toUpperCase(),
        city = match[2].trim().toUpperCase(),
        state = match[3].trim().toUpperCase(),
        zip = match[4].trim().toUpperCase();
    part = "limit=10&offset=" + skip + 
           "&key1=practice_address.address_line&op1=eq&value1=" + address_line +
           "&key2=practice_address.city&op2=eq&value2=" + city +
           "&key3=practice_address.state&op3=eq&value3=" + state +
           "&key4=practice_address.zip&op4=eq&value4=" + zip;
  } else {
    return null;
  }

  return root + part;
}

function SearchCtrl($scope, $location) {
  $scope.submit = function () {
    $location.path($scope.term);
  }
}

function ResultsCtrl($scope, $routeParams, $http, $location) {
  $scope.term = $routeParams.term;
  $scope.currentPage = $routeParams.page || 1;
  $scope.apiuri = discoverAPI($routeParams.term, $scope.currentPage);
 
  if ($scope.apiuri !== null) {
    $scope.error = null;
    $scope.spinner = true;
    $http.get($scope.apiuri).success(function (data) {
      $scope.spinner = false;
      $scope.rowCount = data.meta.rowCount;
      $scope.results = data.result;
    })
    .error(function () {
      $scope.spinner = false;
    });
  } else {
    $scope.error = "Sorry, we didn't understand your query";
  }

  $scope.submit = function () {
    $location.path($scope.term);
  }

  $scope.pages = function () {
    if ($scope.rowCount) {
      var i = 1,
          pageCount = Math.ceil($scope.rowCount / 10),
          result = [],
          cpage = parseInt($scope.currentPage),
          cur;

      if (pageCount < 8) {
        // non-dotted
        for (; i <= pageCount; i++) {
          result.push(i);
        }
      } else if (cpage < 3) {
        // dotted-right
        result = [1,2,3,4, '...', pageCount];
      } else if (pageCount - cpage < 3) {
        // dotted-left
        result = [1, '...', pageCount - 3,  pageCount - 2, pageCount - 1, pageCount];
      } else {
        // dotted-both
        result = [1, '...', cpage - 1, cpage, cpage + 1, '...', pageCount];
      }

      return result;
    } else {
      return [1];
    }
  }
}

function ResultCtrl($scope, $routeParams, $http, $window) {
  var uri = window.location.protocol + "//" + window.location.host + "/api/npis/" + $routeParams.npi;

  $scope.apiuri = uri;

  $http.get(uri).success(function (data) {
    $scope.result = data.result;
  });

  $scope.goBack = function () {
    $window.history.back();
  }
}
