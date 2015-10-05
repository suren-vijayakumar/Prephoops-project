prepHoopsApp.controller('SiteController', ['$scope', '$http', '$location', '$modal','siteFullName', function($scope, $http, $location, $modal,siteFullName){
    $scope.sites = [];
    $scope.dates = [];
    $scope.feeds = [];
    $scope.authorsWithArticles=[];
    $scope.siteName=siteFullName.get('siteFullName');
    $scope.authors=[];
    $scope.uniqueAuthors=[];
    $scope.totalArticles = [];
    $scope.dailyAvg = [];
    $scope.max= [];
    $scope.zeroDays= [];



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

    //function to get only the selected site for all the date range selected
    $scope.getSites= function(data) {
        for(var i=0; i<data.length; i++) {
            for (var j = 0; j < data[i].site.length; j++) {
                if (data[i].site[j].siteName === $scope.siteName) {
                        $scope.sites.push(data[i].site[j]);

                }
            }
        }
        //console.log($scope.sites);
    };

    //$scope.getSites();
//Function to get last parse date and load data for 30 days before
    $scope.getLastParseDate = function(){
        $http.get('/parseRSS/getLastDate').
            success(function(data){
                $scope.clearFields();
                $scope.lastParseDate = new Date(data[0].date);
                var lastParseDate = new Date(data[0].date);
                $scope.thirtyDaysBefore = new Date(lastParseDate.setDate($scope.lastParseDate.getDate() - 7));
                var shortFirstDate = $scope.lastParseDate.toISOString();
                $scope.shortFirstDateString = shortFirstDate.substr(0, shortFirstDate.indexOf('T'));
                var shortSecondDate = $scope.thirtyDaysBefore.toISOString();
                $scope.shortSecondDateString = shortSecondDate.substr(0, shortSecondDate.indexOf('T'));
                $scope.getThirtyDaysOfArticles($scope.shortSecondDateString, $scope.shortFirstDateString);
            });

    };
    $scope.getLastParseDate();// Run the parse

    //Function to get thirty days worth of articles

    $scope.getThirtyDaysOfArticles = function(first, last){
        $http.post('/api/articleGet', [first, last]).
            success(function(data){
                $scope.getFeeds();
                $scope.dates = data;
                $scope.getAllAuthors(data);
                //$scope.getSites(data);

            });

    };

//Function to get new site name from dropdown control
    $scope.$on('siteChanged',
            function (evt, newSite) {

                $scope.siteName = newSite;
                $scope.getLastParseDate();
            });

//Function to get a unique array from  an array with duplicates
    $scope.onlyUnique= function (value, index, self) {
    return self.indexOf(value) === index;
};


    //Not yet working to get day of the week for specified date
    $scope.getDayOfWeek = function(date){
            $scope.dayOfWeek = date.getDay();
            //console.log($scope.dayOfWeek);
    };

    //Gets short names from feeds for table headers

    $scope.getFeeds = function(){
        $http.get('/network/getFeeds').
            success(function(data){
                $scope.feeds = data;
            });
    };

    //Function to get unique authors for a site for requested dates. This module loops through the date range first.
    //Then loops through the sites within the dates. If the site name matches the sitename from the $scope.sitename which is sent from the dasboard site
    //page the module then steps through the articles and pushes all the authors(including duplicates) into an array.

    $scope.getAllAuthors= function(data){
       for(var i=0; i<data.length; i++) {
           for (var j = 0; j < data[i].site.length; j++) {
               if (data[i].site[j].siteName === $scope.siteName) {
                   for (k = 0; k < data[i].site[j].articles.length; k++) {
                       $scope.authors.push(data[i].site[j].articles[k].author);

                            }
                        }
                    }
                }
        $scope.getUniqueAuthors(data);
    };

 //This function loops through the getAuthors array and creates an array of unique author objects with a key value
 // pair of author name and an array of articles for the given date range. Also it initializes arrays for total articles, zero days,
    // daily average and maximum no of articles within a date range.
    $scope.getUniqueAuthors= function(data) {
        $scope.uniqueAuthors = $scope.authors.filter($scope.onlyUnique);
        for (var i = 0; i < data.length; i++) {
            $scope.authorsWithArticles.push({date: data[i].date, authors: []});
            for (var a = 0; a < $scope.uniqueAuthors.length; a++) {
                $scope.authorsWithArticles[i].authors.push({authorName: $scope.uniqueAuthors[a], articles: []});
                $scope.totalArticles[a] = 0;
                $scope.zeroDays[a] = 0;
                $scope.dailyAvg[a] = 0;
                $scope.max[a] = 0;
            }

        }
        $scope.getAuthorArticles(data);
    };


//Function to push articles into the array of author article objects
    $scope.getAuthorArticles = function(data){
        for(var i=0; i<data.length; i++) {
           for (var j = 0; j < data[i].site.length; j++) {
               if (data[i].site[j].siteName === $scope.siteName) {
                   for (var a=0; a<$scope.uniqueAuthors.length; a++){
                       for (var k = 0; k < data[i].site[j].articles.length; k++) {
                           if(data[i].site[j].articles[k].author===$scope.uniqueAuthors[a]) {
                               if (data[i].date === $scope.authorsWithArticles[i].date) {
                                   $scope.authorsWithArticles[i].authors[a].articles.push(data[i].site[j].articles[k]);
                               }
                           }

                       }

                   }

               }

           }

        }
        $scope.getAuthorStats();
    };

    //Function to get author stats for sitepage
    $scope.getAuthorStats = function(){
        for(var i=0; i< $scope.authorsWithArticles.length; i++){
            for(var j=0; j<$scope.authorsWithArticles[i].authors.length; j++){
                if($scope.authorsWithArticles[i].authors[j].articles.length===0){
                    $scope.zeroDays[j]=$scope.zeroDays[j]+1;
                }
                else{
                    $scope.totalArticles[j]= $scope.totalArticles[j] + $scope.authorsWithArticles[i].authors[j].articles.length;
                    $scope.dailyAvg[j]=Math.floor($scope.totalArticles[j]*100/($scope.authorsWithArticles.length))/100;
                    if($scope.authorsWithArticles[i].authors[j].articles.length>$scope.max[j]){
                        $scope.max[j]=$scope.authorsWithArticles[i].authors[j].articles.length;
                    }
                }
            }
        }

    };

    // clear fields function

    $scope.clearFields = function(){
            $scope.sites = [];
            $scope.dates = [];
            $scope.feeds = [];
            $scope.authorsWithArticles=[];
            $scope.siteName=siteFullName.get('siteFullName');
            $scope.authors=[];
            $scope.uniqueAuthors=[];
            $scope.totalArticles = [];
            $scope.dailyAvg = [];
            $scope.max= [];
            $scope.zeroDays= [];
    };

    //Function to call RSS feed dump into database & pull back articles for requested dates

    $scope.getRSS = function (first, last){
      $scope.clearFields();
        var shortFirstDate = first.toISOString();
        $scope.shortFirstDateString = shortFirstDate.substr(0, shortFirstDate.indexOf('T'));
        var shortSecondDate = last.toISOString();
        $scope.shortSecondDateString = shortSecondDate.substr(0, shortSecondDate.indexOf('T'));

        $http.post('/api/articleGet', [$scope.shortFirstDateString, $scope.shortSecondDateString]).
            success(function(data){
                $scope.getFeeds();
                $scope.dates = data;
                $scope.sites = data[0].site;
                $scope.getAllAuthors(data);
                //$scope.getSites(data);


        });
    };
    //var date = new Date();
    //$scope.minDate = date.setDate((new Date()).getDate());

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
        $scope.first = new Date().setDate($scope.last.getDate()-7);

    };

    $scope.today();

    $scope.clear = function () {
        $scope.first = null;
        $scope.last = null;
    };

    //creates modal to list articles on specific date

    $scope.animationsEnabled = true;
    $scope.openModal = function(size){

        $scope.selectedArticles = this.author.articles;
        var modalInstance = $modal.open(
            {
                animation: $scope.animationsEnabled,
                templateUrl: '/assets/views/routes/authorArticleUrl.html',
                controller: 'ArticleInstanceController',
                size: size,
                resolve: {
                    selectedArticles: function(){
                        return $scope.selectedArticles;
                    }
                }
            }
        )
    };
      //$scope.getAuthorArticles = function(data){
    //    for(var i=0; i<data.length; i++) {
    //       for (var j = 0; j < data[i].site.length; j++) {
    //           if (data[i].site[j].siteName === $scope.siteName) {
    //               for (var a=0; a<$scope.uniqueAuthors.length; a++){
    //                   for (var k = 0; k < data[i].site[j].articles.length; k++) {
    //                       if(data[i].site[j].articles[k].author===$scope.uniqueAuthors[a] && data[i].date ===$scope.authorsWithArticles[i].date) {
    //                           $scope.authorsWithArticles[i].authors[a].articles.push(data[i].site[j].articles[k]);
    //                       }
    //                   }
    //
    //               }
    //           }
    //       }
    //    }
    //          console.log($scope.authorsWithArticles);
    //};;


}]);

//controller for modal

prepHoopsApp.controller('ArticleInstanceController', ['$scope', '$modalInstance', 'selectedArticles', function($scope, $modalInstance, selectedArticles){
    $scope.modalArticles = selectedArticles;
    $scope.articleUrlArray = [];

    for(var i = 0; i < $scope.modalArticles.length; i++){
        $scope.articleUrlArray.push($scope.modalArticles[i].url);
    }

    $scope.ok = function () {
        $modalInstance.close();
    };

}]);