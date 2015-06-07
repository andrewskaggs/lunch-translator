'use strict';

var controllers = angular.module('lunchControllers');

controllers.controller('showMeController', [ '$scope', '$http', '$q',
  function($scope, $http, $q) {

    $scope.settings = {
      translate: true,
      skipWeekends: true
    };
    $scope.emptyLunch = {
      menu: 'No Menu Found',
      image: null
    }
    $scope.lunch = $scope.emptyLunch;
    $scope.error = null;

    $scope.initializeDate = function() {
      $scope.m = moment();
      var day = $scope.m.day();
      if ($scope.settings.skipWeekends && (day == 0 || day == 6)) {
        $scope.nextDay();
      } else {
        $scope.update($scope.m.format('YYYY-MM-DD'));
      }
    }

    $scope.update = function(date) {
      $scope.error = null;
      $scope.lunch = $scope.emptyLunch;

      $scope.getLunch(date)
        .then(function(lunch) {
          $scope.lunch = lunch;
          if (lunch) {
            $scope.getImage(lunch.menu).then($scope.setImage, $scope.errorHandler);
            if ($scope.settings.translate) {
              $scope.getTranslation(lunch.menu).then($scope.setTranslation, $scope.errorHandler)
            } else {
              $scope.lunch.translation = lunch.menu;
            }
          }
        }, $scope.errorHandler)
    };

    $scope.getLunch = function(date) {
      return $q(function(resolve, reject) {
        $http.get('lunches/date/' + date)
          .success( function(data, status, headers, config) {
            if (data && data.length > 0) {
              resolve(data[0]);
            } else {
              resolve(null);
            }
          })
          .error( function(data, status, headers, config) {
            if (data) {
              console.log(JSON.stringify(data));
            }
            reject('Error loading menus');
          });
      });
    }

    $scope.getImage = function(menu) {
      return $q(function(resolve, reject) {
        var firstMenuItem = $scope.lunch.menu.split(';')[0];
        $http.jsonp('http://ajax.googleapis.com/ajax/services/search/images', {
          method: 'GET',
          params: {v: '1.0', q: firstMenuItem, callback: 'JSON_CALLBACK', safe: 'off', rsz: '5' }
        }).success(function(data, status, headers, config) {
          if (data.responseData.results.length > 0) {
            var imageNumber = Math.floor((Math.random() * 5) );
            if (data.responseData.results.length < imageNumber) {
              imageNumber = 0;
            }
            resolve(data.responseData.results[imageNumber].unescapedUrl);
          } else {
            reject('Error loading image');
          }
        }).error( function(data, status, headers, config) {
          reject('Error loading image');
        });
      });
    }

    $scope.setImage = function(imageUrl) {
      $scope.lunch.image = imageUrl;
    }

    $scope.getTranslation = function(menu) {
      return $q(function(resolve, reject) {
        if ($scope.settings.translate) {
          $http.post('translate', {lunch: menu}).
            success(function(data, status, headers, config) {
              if (data && data.result) {
                resolve(data.result);
              } else {
                console.log(JSON.stringify(data));
                reject('Error Loading Translation');
              }
                resolve(data.result);
            }).
            error(function(data, status, headers, config) {
              console.log(status)
              reject('Error Loading Translation');
            });
        } else {
          resolve(menu);
        }
      });
    }

    $scope.setTranslation = function(translation) {
      $scope.lunch.translation = translation;
    }

    $scope.errorHandler = function(errorMessage) {
      $scope.error = errorMessage;
    }

    $scope.nextDay = function() {
      var daysToAdd = 1;
      if ($scope.settings.skipWeekends && $scope.m.day() === 5) {
        daysToAdd = 3;
      }
      if ($scope.settings.skipWeekends && $scope.m.day() === 6) {
        daysToAdd = 2;
      }
      $scope.m.add(daysToAdd, 'days');
      $scope.update($scope.m.format('YYYY-MM-DD'))
    };

    $scope.previousDay = function() {
      var daysToAdd = -1;
      if ($scope.settings.skipWeekends && $scope.m.day() === 0) {
        daysToAdd = -2;
      }
      if ($scope.settings.skipWeekends && $scope.m.day() === 1) {
        daysToAdd = -3;
      }
      $scope.m.add(daysToAdd, 'days');
      $scope.update($scope.m.format('YYYY-MM-DD'))
    };

    $scope.$watch(
      function(scope) {
        return scope.settings.translate;
      },
      function() {
        $scope.update($scope.m.format('YYYY-MM-DD'))
      }
    );

    $scope.initializeDate();
  }
]);
