prepHoopsApp.controller('AdminController', ['$scope', '$http', '$modal', function($scope, $http, $modal){

    // Object to hold fields from adminForm
    $scope.adminForm = {};
    // Object to hold fields from editForm
    $scope.editForm = {};
    // Array to hold sites returned from DB
    $scope.sites = [];
    $scope.sitesSelector = [];

    // Var to hold value of last siteID in the DB
    var lastSiteID;

    loadSites();

    $scope.assignSiteID = function(){
        return $http.get('network/lastid')
            .then(function(data){
                lastSiteID = data.data.siteID;
                if(!lastSiteID) lastSiteID = 0;
                $scope.adminForm.siteID = lastSiteID + 1;
                addNewSite($scope.adminForm)
            });
    };

    // Detect edit site selector change
    $scope.changedValue = function(item){
        if(item) {
            $scope.editForm.editShortName = item.siteShortName;
            $scope.editForm.editFullName = item.siteFullName;
            $scope.editForm.editRssURL = item.rssURL;
            $scope.editForm.editSiteID = item.siteID;
            $scope.editForm.editID = item._id;
        }
    };

    $scope.editSite = function(site) {
        var id = site.editID;
        $http.put('network/editsite/' + id, site)
            .then(function (err, res) {
                if (err.status != 200) {
                    console.log("Error on Edit is: ", err);
                } else {
                    $scope.editForm = {};
                    loadSites();
                }
            });
    };

    function addNewSite(site){
        $http.post('network/addsite', site)
                .then(function(){
                    $scope.adminForm = {};
                    loadSites();
                });
    }

    function loadSites(){
        $http.get('network')
            .then(function(res){
                $scope.sites = res.data;
                $scope.sitesSelector = $scope.sites;
            });
    }

    $scope.removeSite = function(size) {
        var site = this.site.siteShortName;
        var id = this.site._id;
        $scope.animationsEnabled = true;
        $scope.idToDelete = this.site._id;
        var modalInstance = $modal.open(
            {
                animation: $scope.animationsEnabled,
                templateUrl: '/assets/views/routes/adminDelete.html',
                controller: 'SiteDeleteInstanceController',
                size: size,
                resolve: {
                    idToDelete: function() {
                        return $scope.idToDelete;
                    }
                }
            }
        );
    };
}]);

// Controller for the Delete Site Modal
prepHoopsApp.controller('SiteDeleteInstanceController', ['$scope', '$http', '$modalInstance', '$location', 'idToDelete', function($scope, $http, $modalInstance, $location, idToDelete){
    $scope.confirmRemove = function () {
        // insert delete stuff here
        console.log("You clicked the OK Button!");
        $http.delete('network/deletesite/' + idToDelete)
            .then(function(res, err){
                if (err) {
                    console.log("Error on Delete is: ", err);
                } else {
                    $location.path('/dashboard');
                }
            });
        $modalInstance.close();
    };

    $scope.cancel = function () {
        // return to admin screen
        $modalInstance.close();
    };
}]);
