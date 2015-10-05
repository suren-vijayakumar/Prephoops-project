var prepHoopsApp = angular.module('prepHoopsApp', ['ngRoute', 'ui.bootstrap', 'appControllers']);

var appControllers = angular.module('appControllers', []);

prepHoopsApp.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/login', {
            templateUrl: '/assets/views/routes/login.html',
            controller: 'LoginController'
        })
        .when('/register', {
            templateUrl: '/assets/views/routes/register.html',
            controller: 'RegisterController'
        })
        .when('/admin', {
            templateUrl: '/assets/views/routes/admin.html',
            controller: 'AdminController'
        })
        .when('/dashboard', {
            templateUrl: '/assets/views/routes/dashboard.html',
            controller: 'DashboardController'
        })
        .when('/site', {
            templateUrl: '/assets/views/routes/site.html',
            controller: 'SiteController'
        })
        .otherwise({
            redirectTo: "/login"
        });
}]);

prepHoopsApp.factory('AuthService',
    ['$q', '$timeout', '$http',
        function ($q, $timeout, $http) {

            // create user variable
            var user = false;

            // return available functions for use in controllers
            return ({
                isLoggedIn: isLoggedIn,
                getUserStatus: getUserStatus,
                login: login,
                logout: logout,
                user: user
            });

            function isLoggedIn() {
                if(user) {
                    return true;
                } else {
                    return false;
                }
            }

            function getUserStatus() {
                return user;
            }

            function login(username, password) {

                // create a new instance of deferred
                var deferred = $q.defer();

                // send a post request to the server
                $http.post('/userauth/login', {username: username, password: password})
                    // handle success
                    .success(function (data, status) {
                        if(status === 200 && data.status){
                            user = true;
                            deferred.resolve();
                        } else {
                            user = false;
                            deferred.reject();
                        }
                    })
                    // handle error
                    .error(function (data) {
                        console.log('error');
                        user = false;
                        deferred.reject();
                    });


                // return promise object
                return deferred.promise;

            }

            function logout() {

                // create a new instance of deferred
                var deferred = $q.defer();

                // send a get request to the server
                $http.get('/userauth/logout')
                    // handle success
                    .success(function (data) {
                        user = false;
                        deferred.resolve();
                    })
                    // handle error
                    .error(function (data) {
                        user = false;
                        deferred.reject();
                    });

                // return promise object
                return deferred.promise;

            }
        }]);

prepHoopsApp.run(['$rootScope', '$location', '$route', 'AuthService', function ($rootScope, $location, $route, AuthService) {
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        if (AuthService.isLoggedIn() === false) {
            $location.path('/login');
        }
    });
}]);

prepHoopsApp.factory('siteFullName', function(){
    var siteFullName = {};

    return {
        get : function(key){
            return siteFullName[key];
        },
        set : function(key, value){
            siteFullName[key]= value;
        }
    };
});


prepHoopsApp.controller('DropdownCtrl', ['$scope', '$rootScope', '$http', '$log', '$location', 'siteFullName', function ($scope, $rootScope, $http, $log, $location, siteFullName) {

    $scope.feeds = [];
    $scope.getFeeds = function(){
        $http.get('/network/getFeeds').
            success(function(data){
                $scope.feeds = data;
            });
    };
    $scope.getFeeds();

    $scope.go = function ( path ) {
        $scope.getFeeds();
        $location.path( path );
        $scope.selectedSite = this.site.siteFullName;
        siteFullName.set('siteFullName', this.site.siteFullName);
    };

    $scope.$watch('selectedSite', function () {

        $rootScope.$broadcast('siteChanged',

            $scope.selectedSite);

    });

    $scope.status = {
        isopen: false
    };

    $scope.toggled = function(open) {
        $log.log('Dropdown is now: ', open);
    };

    $scope.toggleDropdown = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.status.isopen = !$scope.status.isopen;
    };

}]);

prepHoopsApp.controller('logoutController', ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {

            $scope.logout = function () {
                // call logout from service
                AuthService.logout()
                    .then(function () {
                        $location.path('/login');
                    });

            };
        }]);
