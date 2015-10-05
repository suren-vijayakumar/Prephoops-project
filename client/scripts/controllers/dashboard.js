prepHoopsApp.controller('DashboardController', ['$scope', '$http', '$location', '$modal','siteFullName', 'AuthService', function($scope, $http, $location, $modal, siteFullName, AuthService){
    $scope.sites = [];
    $scope.dates = [];
    $scope.feeds = [];
    $scope.totalArticles = [];
    $scope.dailyAvg = [];
    $scope.percentPaid= [];
    $scope.zeroDays= [];
    $scope.Array=[];


// To find max and min values in an array
    $scope.arrayMin= function(arr) {
        var len = arr.length, min = Infinity;
            while (len--) {
                 if (arr[len] < min) {
                min = arr[len];
                 }
    }
        return min;
    };

    $scope.arrayMax = function(arr) {
        var len = arr.length, max = -Infinity;
            while (len--) {
         if (arr[len] > max) {
            max = arr[len];
        }
    }
        return max;
    };

    //var date = new Date();
    //$scope.minDate = date.setDate((new Date()).getDate());



    //Function to get last parse date and load data for 30 days before
    $scope.getLastParseDate = function(){
        $http.get('/parseRSS/getLastDate').
            success(function(data){
                $scope.lastParseDate = new Date(data[0].date);
                var lastParseDate = new Date(data[0].date);
                $scope.thirtyDaysBefore = new Date(lastParseDate.setDate($scope.lastParseDate.getDate() - 30));
                var shortFirstDate = $scope.lastParseDate.toISOString();
                $scope.shortFirstDateString = shortFirstDate.substr(0, shortFirstDate.indexOf('T'));
                var shortSecondDate = $scope.thirtyDaysBefore.toISOString();
                $scope.shortSecondDateString = shortSecondDate.substr(0, shortSecondDate.indexOf('T'));
                $scope.getThirtyDaysOfArticles($scope.shortSecondDateString, $scope.shortFirstDateString);

            });

    };
    $scope.getLastParseDate();

    //Not yet working to get day of the week for specified date
    $scope.getDayOfWeek = function(date){
            $scope.dayOfWeek = date.getDay();

    };

    //Gets short names from feeds for table headers

    $scope.getFeeds = function(){
        $http.get('/network/getFeeds').
            success(function(data){
                $scope.feeds = data;
                siteFullName.set('feedsArray', data);
            });
        $scope.siteName($scope.feeds);
    };

    $scope.siteNameArray=[];
    $scope.siteName = function(array){
            for (var i=0; i<array.length; i++){
                $scope.siteNameArray.push(array[i].siteShortName);
            }
            //console.log($scope.siteNameArray);
    };

    $scope.runParse = function(){
        $http.get('/parseRSS').
            success(function(req, res){
            });
    };

    $scope.logout = function () {

        console.log(AuthService.getUserStatus());

        // call logout from service
        AuthService.logout()
            .then(function () {
                $location.path('/login');
            });
    };

    //Function to make admin button redirect to site page
    $scope.go = function ( path ) {
        $location.path( path );
        siteFullName.set('siteFullName',this.site.siteFullName);

    };

    $scope.getThirtyDaysOfArticles = function(first, last){
        $http.post('/api/articleGet', [first, last]).
            success(function(data){
                $scope.getFeeds();
                $scope.dates = data;
                $scope.getStats(data);

            });

    };

    $scope.getFeeds();

    //Function to call RSS feed dump into database & pull back articles for requested dates
    $scope.getRSS = function (first, last){
        var shortFirstDate = first.toISOString();
        $scope.shortFirstDateString = shortFirstDate.substr(0, shortFirstDate.indexOf('T'));
        var shortSecondDate = last.toISOString();
        $scope.shortSecondDateString = shortSecondDate.substr(0, shortSecondDate.indexOf('T'));
        if(shortFirstDate> shortSecondDate ){
            alert("The start date should be earlier than the end date");
        }
        else if (shortFirstDate<= shortSecondDate){
            $http.post('/api/articleGet', [$scope.shortFirstDateString, $scope.shortSecondDateString]).
                success(function (data) {
                    $scope.getFeeds();
                    $scope.dates = data;
                    $scope.getStats(data);

                });
        }
    };

    //Function to clear fields
    $scope.clearFields = function(){
            $scope.totalSiteArticles=0;
            $scope.totalArticles = [];
            $scope.dailyAvg = [];
            $scope.percentPaid= [];
            $scope.zeroDays= [];
            $scope.articlesPerDay=0
    };

//Function to get stats for the main dashboard
     $scope.getStats= function(data){
         $scope.clearFields();
         $scope.articlesPerDay=0;
         var zeroDaysSite=0;
         $scope.articlesPerDayArray=[];
         for (var n=1; n<=$scope.feeds.length; n++) {// Total number of sites from the feeds
             for (var i = 0; i < data.length; i++) {
                 for (var j = 0; j < data[i].site.length; j++) {
                     if (data[i].site[j].siteID === n){
                             $scope.totalSiteArticles = $scope.totalSiteArticles + data[i].site[j].articles.length;
                         if(data[i].site[j].articles.length===0){
                             zeroDaysSite++;
                         }

                    }
                    $scope.articlesPerDay=$scope.articlesPerDay+data[i].site[j].articles.length;
                 }

                $scope.articlesPerDayArray[i]=$scope.articlesPerDay;
                 $scope.articlesPerDay=0;
             }
             $scope.totalArticles.push($scope.totalSiteArticles);
             $scope.dailyAvg.push(Math.floor(($scope.totalSiteArticles*100/(data.length)))/100);
             $scope.zeroDays.push(zeroDaysSite);
             $scope.totalSiteArticles=0;// reset before loop
             zeroDaysSite=0;//reset before loop
         }
        //console.log($scope.arrayMin($scope.zeroDays), $scope.arrayMax($scope.zeroDays));
     };

    //Code for DatePicker

    $scope.open = function($event, opened) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope[opened] = true;
    };

    $scope.status = {
        opened: false
    };

    $scope.today = function() {
        $scope.last = new Date();
        $scope.first = new Date().setDate($scope.last.getDate()-30);


        //$scope.first = "Please select a from date";
        //$scope.last = "Please select an end date";
    };

    $scope.today();


    $scope.clear = function () {
        $scope.first = null;
        $scope.last = null;
    };

    //creates modal to list articles on specific date

    $scope.animationsEnabled = true;
    $scope.openModal = function(size) {
            $scope.selectedArticles = this.site.articles;
            var modalInstance = $modal.open(
                {
                    animation: $scope.animationsEnabled,
                    templateUrl: '/assets/views/routes/articleUrl.html',
                    controller: 'ArticleInstanceController',
                    size: size,
                    resolve: {
                        selectedArticles: function () {
                            return $scope.selectedArticles;
                        }
                    }
                }
            );
            //console.log($scope.selectedArticles);
        }

}]);

//controller for modal

prepHoopsApp.controller('ArticleInstanceController', ['$scope', '$modalInstance', 'selectedArticles', function($scope, $modalInstance, selectedArticles){
    $scope.modalArticles = selectedArticles;
    $scope.articleUrlArray = [];

    //for(var i = 0; i < $scope.modalArticles.length; i++){
    //    $scope.articleUrlArray.push($scope.modalArticles[i].url);
    //}

    $scope.ok = function () {
        $modalInstance.close();
    };

}]);