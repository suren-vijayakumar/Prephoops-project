prepHoopsApp.controller('RegisterController', ['$scope', '$http', function($scope, $http){

    $scope.userRegistrationForm = {};

    $scope.registerNewUser = function(user){
        return $http.post('userauth/register', user)
            .then(function(){

            });
    };
}]);