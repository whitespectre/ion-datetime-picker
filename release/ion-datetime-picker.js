;(function() {
"use strict";

angular.module("ion-datetime-picker", ["ionic"])
    .directive("ionDatetimePicker", function() {
        return {
            restrict: "AE",
            require: "ngModel",
            scope: {
                modelDate: "=ngModel",
                title: "=?",
                subTitle: "=?",
                buttonOk: "=?",
                onSuccess: "&",
                buttonCancel: "=?",
                monthStep: "=?",
                hourStep: "=?",
                minuteStep: "=?",
                secondStep: "=?",
                onlyValid: "=?"
            },
            controller: ["$scope", "$ionicPopup", "$ionicPickerI18n", "$timeout", function($scope, $ionicPopup, $ionicPickerI18n, $timeout) {
                $scope.i18n = $ionicPickerI18n;
                $scope.bind = {};

                $scope.rows = [0, 1, 2, 3, 4, 5];
                $scope.cols = [1, 2, 3, 4, 5, 6, 7];
                $scope.weekdays = [0, 1, 2, 3, 4, 5, 6];

                var lastDateSet = {
                    year: $scope.year,
                    month: $scope.month,
                    day: $scope.day,
                    hour: $scope.hour,
                    minute: $scope.minute,
                    second: $scope.second,
                    date: new Date(),
                    getDateWithoutTime: function(){
                        var tempDate = new Date(this.date);
                        tempDate.setHours(0, 0, 0, 0, 0);
                        return tempDate;
                    }
                };

                $scope.showPopup = function() {
                    $ionicPopup.show({
                        templateUrl: "lib/ion-datetime-picker/src/picker-popup.html",
                        title: $scope.title || ("Pick " + ($scope.dateEnabled ? "a date" : "") + ($scope.dateEnabled && $scope.timeEnabled ? " and " : "") + ($scope.timeEnabled ? "a time" : "")),
                        subTitle: $scope.subTitle || "",
                        scope: $scope,
                        cssClass: 'ion-datetime-picker-popup',
                        buttons: [
                            {
                                text: $scope.buttonOk || $scope.i18n.ok,
                                type: "button-positive",
                                onTap: function() {
                                    $scope.commit();
                                }
                            }, {
                                text: $scope.buttonCancel || $scope.i18n.cancel,
                                type: "button-stable",
                                onTap: function() {
                                    $timeout(function() {
                                        $scope.processModel();
                                    }, 200);
                                }
                            }
                        ]
                    });
                };

                $scope.prepare = function() {
                    if ($scope.mondayFirst) {
                        $scope.weekdays.push($scope.weekdays.shift());
                    }
                };

                $scope.processModel = function() {
                    var date = $scope.modelDate instanceof Date ? $scope.modelDate : new Date();
                    $scope.year = $scope.dateEnabled ? date.getFullYear() : 0;
                    $scope.month = $scope.dateEnabled ? date.getMonth() : 0;
                    $scope.day = $scope.dateEnabled ? date.getDate() : 0;
                    $scope.hour = $scope.timeEnabled ? date.getHours() : 0;
                    $scope.minute = $scope.timeEnabled ? date.getMinutes() : 0;
                    $scope.second = $scope.secondsEnabled ? date.getSeconds() : 0;

                    changeViewData();
                };

                function setNextValidDate(date, dayToAdd){
                    dayToAdd = dayToAdd || 0;
                    if (dayToAdd !== 0) {
                        date.setDate(date.getDate() + dayToAdd);
                    }

                    lastDateSet.year = date.getFullYear();
                    lastDateSet.month = date.getMonth();
                    lastDateSet.day = date.getDate();
                    lastDateSet.hour = date.getHours();
                    lastDateSet.minute = date.getMinutes();
                    lastDateSet.second = date.getSeconds();
                    lastDateSet.date = date;

                }

                function setLastValidDate(){
                    var date = new Date($scope.year, $scope.month, $scope.day, $scope.hour, $scope.minute, $scope.second);
                    if ($scope.isEnabled(date.getDate(), true)) {
                        setNextValidDate(date);
                    } else {
                        $scope.year = lastDateSet.year;
                        $scope.month = lastDateSet.month;
                        $scope.day = lastDateSet.day;                        
                    }
                }

                var changeViewData = function() {
                    setLastValidDate();
                    var date = new Date($scope.year, $scope.month, $scope.day, $scope.hour, $scope.minute, $scope.second);

                    if ($scope.dateEnabled) {
                        $scope.year = date.getFullYear();
                        $scope.month = date.getMonth();
                        $scope.day = date.getDate();

                        $scope.bind.year = $scope.year;
                        $scope.bind.month = $scope.month.toString();

                        $scope.firstDay = new Date($scope.year, $scope.month, 1).getDay();
                        if ($scope.mondayFirst) {
                            $scope.firstDay = ($scope.firstDay || 7) - 1;
                        }
                        $scope.daysInMonth = getDaysInMonth($scope.year, $scope.month);
                    }

                    if ($scope.timeEnabled) {
                        $scope.hour = date.getHours();
                        $scope.minute = date.getMinutes();
                        $scope.second = date.getSeconds();
                        $scope.meridiem = $scope.hour < 12 ? $scope.i18n.am : $scope.i18n.pm;

                        $scope.bind.hour = $scope.meridiemEnabled ? ($scope.hour % 12 || 12).toString() : $scope.hour.toString();
                        $scope.bind.minute = ($scope.minute < 10 ? "0" : "") + $scope.minute.toString();
                        $scope.bind.second = ($scope.second < 10 ? "0" : "") + $scope.second.toString();
                        $scope.bind.meridiem = $scope.meridiem;
                    }
                };

                var getDaysInMonth = function(year, month) {
                    return new Date(year, month + 1, 0).getDate();
                };

                $scope.changeBy = function(value, unit) {
                    if (+value) {
                        // DST workaround
                        if ((unit === "hour" || unit === "minute") && value === -1) {
                            var date = new Date($scope.year, $scope.month, $scope.day, $scope.hour - 1, $scope.minute);
                            if (($scope.minute === 0 || unit === "hour") && $scope.hour === date.getHours()) {
                                $scope.hour--;
                            }
                        }
                        $scope[unit] += +value;
                        if (unit === "month" || unit === "year") {
                            $scope.day = Math.min($scope.day, getDaysInMonth($scope.year, $scope.month));
                        }
                        changeViewData();
                    }
                };
                $scope.change = function(unit) {
                    var value = $scope.bind[unit];
                    if (value && unit === "meridiem") {
                        value = value.toUpperCase();
                        if (value === $scope.i18n.am && $scope.meridiem === $scope.i18n.pm) {
                            $scope.hour -= 12;
                        } else if (value === $scope.i18n.pm && $scope.meridiem === $scope.i18n.am) {
                            $scope.hour += 12;
                        }
                        changeViewData();
                    } else if (+value || value === "0") {
                        $scope[unit] = +value;
                        if (unit === "month" || unit === "year") {
                            $scope.day = Math.min($scope.day, getDaysInMonth($scope.year, $scope.month));
                        }
                        changeViewData();
                    }
                };
                $scope.changeDay = function(day) {
                    $scope.day = day;
                    changeViewData();
                };

                function createDate(stringDate){
                    var date = new Date(stringDate);
                    var isInvalidDate = isNaN(date.getTime());
                    if (isInvalidDate) {
                        date = new Date();//today
                    }
                    date.setHours(0, 0, 0, 0, 0);
                    return date;
                }

                $scope.isEnabled = function(day, computeNextValidDate) {
                    if (!$scope.onlyValid) {
                        return true;
                    }

                    var currentDate = new Date($scope.year, $scope.month, day);
                    var isValid = true;

                    if ($scope.onlyValid.after) {

                        var afterDate = createDate($scope.onlyValid.after);

                        if ($scope.onlyValid.inclusive) {
                            isValid = currentDate >= afterDate;
                            if (!isValid && computeNextValidDate) setNextValidDate(afterDate, 0);
                        } else {
                            isValid = currentDate > afterDate;
                            if (!isValid && computeNextValidDate) setNextValidDate(afterDate, 1);
                        }

                    } else
                    if ($scope.onlyValid.before){

                        var beforeDate = createDate($scope.onlyValid.after);

                        if ($scope.onlyValid.inclusive) {
                            isValid = currentDate <= beforeDate;
                            if (!isValid && computeNextValidDate) setNextValidDate(beforeDate, 0);
                        } else {
                            isValid = currentDate < beforeDate;
                            if (!isValid && computeNextValidDate) setNextValidDate(beforeDate, -1);
                        }

                    } else
                    if ($scope.onlyValid.between){

                        var initialDate = createDate($scope.onlyValid.between.initial);
                        var finalDate = createDate($scope.onlyValid.between.final);

                        if ($scope.onlyValid.inclusive) {
                            isValid = currentDate >= initialDate && currentDate <= finalDate;
                            if (!isValid && computeNextValidDate) {
                                if (currentDate < initialDate) setNextValidDate(initialDate, 0);
                                if (currentDate > finalDate) setNextValidDate(finalDate, 0);
                            }
                        } else {
                            isValid = currentDate > initialDate && currentDate < finalDate;
                            if (!isValid && computeNextValidDate) {
                                if (currentDate <= initialDate) setNextValidDate(initialDate, 1);
                                if (currentDate >= finalDate) setNextValidDate(finalDate, -1);
                            }
                        }

                    } else
                    if ($scope.onlyValid.outside){

                        var initialDate = createDate($scope.onlyValid.outside.initial);
                        var finalDate = createDate($scope.onlyValid.outside.final);

                        if ($scope.onlyValid.inclusive) {
                            isValid = currentDate <= initialDate || currentDate >= finalDate;
                            if (!isValid && computeNextValidDate) {
                                var lastValidDate = lastDateSet.getDateWithoutTime();
                                if (lastValidDate <= initialDate) setNextValidDate(finalDate, 0);
                                if (lastValidDate >= finalDate) setNextValidDate(initialDate, 0);
                            }
                        } else {
                            isValid = currentDate < initialDate || currentDate > finalDate;
                            if (!isValid && computeNextValidDate) {
                                var lastValidDate = lastDateSet.getDateWithoutTime();
                                if (lastValidDate < initialDate) setNextValidDate(finalDate, 1);
                                if (lastValidDate > finalDate) setNextValidDate(initialDate, -1);
                            }
                        }

                    }
                    return isValid

                };
                $scope.changed = function() {
                    changeViewData();
                };

                if ($scope.dateEnabled) {
                    $scope.$watch(function() {
                        return new Date().getDate();
                    }, function() {
                        var today = new Date();
                        $scope.today = {
                            day: today.getDate(),
                            month: today.getMonth(),
                            year: today.getFullYear()
                        };
                    });
//                    $scope.goToToday = function() {
//                        $scope.year = $scope.today.year;
//                        $scope.month = $scope.today.month;
//                        $scope.day = $scope.today.day;
//
//                        changeViewData();
//                    };
                }
            }],
            link: function($scope, $element, $attrs, ngModelCtrl) {
                $scope.dateEnabled = "date" in $attrs && $attrs.date !== "false";
                $scope.timeEnabled = "time" in $attrs && $attrs.time !== "false";
                if ($scope.dateEnabled === false && $scope.timeEnabled === false) {
                    $scope.dateEnabled = $scope.timeEnabled = true;
                }

                $scope.mondayFirst = "mondayFirst" in $attrs && $attrs.mondayFirst !== "false";
                $scope.secondsEnabled = $scope.timeEnabled && "seconds" in $attrs && $attrs.seconds !== "false";
                $scope.meridiemEnabled = $scope.timeEnabled && "amPm" in $attrs && $attrs.amPm !== "false";

                $scope.monthStep = +$scope.monthStep || 1;
                $scope.hourStep = +$scope.hourStep || 1;
                $scope.minuteStep = +$scope.minuteStep || 1;
                $scope.secondStep = +$scope.secondStep || 1;

                $scope.prepare();

                ngModelCtrl.$render = function() {
                    $scope.modelDate = ngModelCtrl.$viewValue;
                    $scope.processModel();
                };

                $scope.commit = function() {
                    var result = new Date($scope.year, $scope.month, $scope.day, $scope.hour, $scope.minute, $scope.second);
                    $scope.modelDate = result;
                    ngModelCtrl.$setViewValue($scope.modelDate);
                    $scope.onSuccess && $scope.onSuccess()(result);
                };

                $element.on("click", $scope.showPopup);
            }
        };
    });

angular.module("ion-datetime-picker")
    .factory("$ionicPickerI18n", ["$window", function($window) {
        return  {
            ok: "OK",
            cancel: "Cancel",
            am: 'AM',
            pm: 'PM',
            weekdays: $window.moment ? $window.moment.weekdaysMin() : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            months: $window.moment ? $window.moment.months() : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        };
    }]);
angular.module('ion-datetime-picker').run(['$templateCache', function($templateCache) {
  $templateCache.put('lib/ion-datetime-picker/src/picker-popup.html',
    '<div class="ion-datetime-picker"><div ng-if-start="dateEnabled" class="row month-year"><div class="col col-10 left-arrow"><button type="button" class="button button-small button-positive button-clear icon ion-chevron-left" ng-click="changeBy(-monthStep, \'month\')"></button></div><label class="col col-50 month-input"><div class="item item-input item-select"><select disabled="" ng-model="bind.month" ng-options="index as month for (index, month) in i18n.months" ng-change="change(\'month\')"></select></div></label> <label class="col year-input"><div class="item item-input"><div><input disabled="" type="number" ng-model="bind.year" min="1900" max="2999" ng-change="change(\'year\')" ng-blur="changed()" required=""></div></div></label><div class="col col-10 right-arrow"><button type="button" class="button button-small button-positive button-clear icon ion-chevron-right" ng-click="changeBy(+monthStep, \'month\')"></button></div></div><div class="row calendar weekdays"><div class="col" ng-repeat="weekday in weekdays"><div class="weekday">{{i18n.weekdays[weekday]}}</div></div></div><div ng-if-end="" class="row calendar days" ng-repeat="y in rows"><div class="col" ng-repeat="x in cols"><div ng-show="(cellDay = y * 7 + x - firstDay) > 0 && cellDay <= daysInMonth" ng-click="changeDay(cellDay)" class="day" ng-class="{ \'disabled\': !isEnabled(cellDay), \'selected\': cellDay === day, \'today\': cellDay === today.day && month === today.month && year === today.year }">{{cellDay}}</div></div></div><div ng-if-start="timeEnabled" class="row time-buttons"><div class="col"></div><div class="col-20"><button type="button" class="button button-positive button-clear icon ion-chevron-up" ng-click="changeBy(+hourStep, \'hour\')"></button></div><div class="col"></div><div class="col-20"><button type="button" class="button button-positive button-clear icon ion-chevron-up" ng-click="changeBy(+minuteStep, \'minute\')"></button></div><div ng-if-start="secondsEnabled" class="col"></div><div ng-if-end="" class="col-20"><button type="button" class="button button-positive button-clear icon ion-chevron-up" ng-click="changeBy(+secondStep, \'second\')"></button></div><div ng-if-start="meridiemEnabled" class="col"></div><div ng-if-end="" class="col-20"><button ng-disabled="bind.meridiem === i18n.pm" type="button" class="button button-positive button-clear icon ion-chevron-up" ng-click="changeBy(+12, \'hour\')"></button></div><div class="col"></div></div><div class="row time"><div class="col"></div><label class="col col-20"><div class="item item-input"><div><input disabled="" type="text" ng-model="bind.hour" pattern="0?([01]?[0-9]|2[0-3])" ng-change="change(\'hour\')" ng-blur="changed()" required=""></div></div></label><div class="col colon">:</div><label class="col col-20"><div class="item item-input"><div><input disabled="" type="text" ng-model="bind.minute" pattern="0?[0-5]?[0-9]" ng-change="change(\'minute\')" ng-blur="changed()" required=""></div></div></label><div ng-if-start="secondsEnabled" class="col colon">:</div><label ng-if-end="" class="col col-20"><div class="item item-input"><div><input disabled="" type="text" ng-model="bind.second" pattern="0?[0-5]?[0-9]" ng-change="change(\'second\')" ng-blur="changed()" required=""></div></div></label><div ng-if-start="meridiemEnabled" class="col"></div><label ng-if-end="" class="col col-20"><div class="item item-input"><div><input disabled="" type="text" ng-model="bind.meridiem" ng-change="change(\'meridiem\')" ng-blur="changed()" required=""></div></div></label><div class="col"></div></div><div ng-if-end="" class="row time-buttons"><div class="col"></div><div class="col-20"><button type="button" class="button button-positive button-clear icon ion-chevron-down" ng-click="changeBy(-hourStep, \'hour\')"></button></div><div class="col"></div><div class="col-20"><button type="button" class="button button-positive button-clear icon ion-chevron-down" ng-click="changeBy(-minuteStep, \'minute\')"></button></div><div ng-if-start="secondsEnabled" class="col"></div><div ng-if-end="" class="col-20"><button type="button" class="button button-positive button-clear icon ion-chevron-down" ng-click="changeBy(-secondStep, \'second\')"></button></div><div ng-if-start="meridiemEnabled" class="col"></div><div ng-if-end="" class="col-20"><button type="button" ng-disabled="bind.meridiem === i18n.am" class="button button-positive button-clear icon ion-chevron-down" ng-click="changeBy(-12, \'hour\')"></button></div><div class="col"></div></div></div>');
}]);
}());
