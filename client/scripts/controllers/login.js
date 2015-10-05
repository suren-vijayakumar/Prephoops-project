prepHoopsApp.controller('LoginController', ['$scope', '$http', '$location', 'AuthService', function($scope, $http, $location, AuthService){

    $scope.loginForm = {};

    $scope.login = function () {

        // initial values
        $scope.error = false;
        $scope.disabled = true;

        // call login from service
        AuthService.login($scope.loginForm.username, $scope.loginForm.password)
            // handle success
            .then(function () {

                $location.path('/dashboard');
                $scope.disabled = false;
                $scope.loginForm = {};
            })
            // handle error
            .catch(function () {
                $scope.error = true;
                $scope.errorMessage = "Invalid username and/or password";
                $scope.disabled = false;
                $scope.loginForm = {};
            });
    };

    $scope.logout = function () {

    // call logout from service
    AuthService.logout()
        .then(function () {
            $location.path('/login');
        });
    };
}]);

