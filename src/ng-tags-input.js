(function() {
'use strict';

angular.module('tags-input', []).directive('tagsInput', function() {
    function toBool(value, defaultValue) {
        return angular.isDefined(value) ? value === 'true' : defaultValue;
    }

    return {
        restrict: 'A,E',
        scope: { tags: '=ngModel', cssClass: '@ngClass', elSelect: '=' },
        replace: false,
        transclude: true,
        template: '<div>' +
                  '  <div class="tags-input {{ cssClass }}" ng-class="cssFocus">' +
                  '    <span class="measure">{{ newTag }}</span>' +
                  '    <input type="text" placeholder="{{ placeholder }}" size="{{ placeholder.length }}" maxlength="{{ maxLength }}" tabindex="{{ tabindex }}" ng-model="newTag" ng-style="inputStyle">' +
                  '    <ul>' +
                  '      <li ng-repeat="tag in tags" ng-class="getCssClass($index)" ng-click="remove($index)">' +
                  '        <span>{{ tag }}</span>' +
                  '      </li>' +
                  '    </ul>' +
                  '  </div>' +
                  '  <div class="tags-input-bottom-line"></div>' +
                  '  <div class="tags-input-transclude clearfix" ng-transclude></div>' +
                  '</div>',
        controller: ['$scope', '$attrs', function($scope, $attrs) {
            $scope.placeholderText = $attrs.placeholder || 'Add a tag';
            $scope.tabindex= $attrs.tabindex;
            $scope.removeTagSymbol = $attrs.removeTagSymbol || String.fromCharCode(215);
            $scope.replaceSpacesWithDashes = toBool($attrs.replaceSpacesWithDashes, true);
            $scope.minLength = $attrs.minLength || 3;
            $scope.maxLength = Math.max($attrs.maxLength || $scope.placeholderText.length, $scope.minLength);
            $scope.addOnEnter = toBool($attrs.addOnEnter, true);
            $scope.addOnSpace = toBool($attrs.addOnSpace, false);
            $scope.addOnComma = toBool($attrs.addOnComma, true);
            $scope.allowedTagsPattern = new RegExp($attrs.allowedTagsPattern || '^[a-zA-Z0-9\\s]+$');
            $scope.enableEditingLastTag = toBool($attrs.enableEditingLastTag, false);
            $scope.elFocus = false;
            $scope.elHover = false;
            $scope.elSelect = true;
            $scope.oneTagOnly = $attrs.oneTagOnly || false;

            $scope.newTag = '';
            $scope.tags = $scope.tags || [];

            $scope.tryAdd = function() {
                var changed = false;
                var tag = $scope.newTag;

                if (tag.length >= $scope.minLength && $scope.allowedTagsPattern.test(tag)) {

                    if ($scope.replaceSpacesWithDashes) {
                        tag = tag.replace(/\s/g, '-');
                    }

                    if ($scope.tags.indexOf(tag) === -1) {
                        
                        if(!$scope.oneTagOnly) {
                            $scope.tags.push(tag);
                        } else {
                            $scope.tags = [tag];   
                        };
                        
                    }

                    $scope.newTag = '';
                    changed = true;
                }
                return changed;
            };

            $scope.tryRemoveLast = function() {
                var changed = false;
                if ($scope.tags.length > 0) {
                    if ($scope.enableEditingLastTag) {
                        $scope.newTag = $scope.tags.pop();
                    }
                    else {
                        if ($scope.shouldRemoveLastTag) {
                            $scope.tags.pop();

                            $scope.shouldRemoveLastTag = false;
                        }
                        else {
                            $scope.shouldRemoveLastTag = true;
                        }
                    }
                    changed = true;
                }
                return changed;
            };

            $scope.remove = function(index) {
                $scope.tags.splice(index, 1);
            };

            $scope.getCssClass = function(index) {
                var isLastTag = index === $scope.tags.length - 1;
                return $scope.shouldRemoveLastTag && isLastTag ? 'selected' : '';
            };

            $scope.removeSelectedClass = function(index) {
                var isLastTag = index === $scope.tags.length - 1;
                return $scope.shouldRemoveLastTag && isLastTag ? 'selected' : '';
            };

            $scope.$watch(function() { return $scope.newTag.length > 0; }, function() {
                $scope.shouldRemoveLastTag = false;
            });

            $scope.$watch('[elFocus, elHover]', function () {
                if ($scope.elFocus || $scope.elHover) {
                    $scope.cssFocus            = true;
                    $scope.elSelect            = true;
                } else{
                    $scope.cssFocus            = '';
                    $scope.elSelect            = false;
                    $scope.shouldRemoveLastTag = false;
                    $scope.newTag              = '';
                };
            }, true);

            $scope.$watch('tags', function () {
                $scope.placeholder = ($scope.tags.length === 0)? $scope.placeholderText : '';
            }, true);

        }],
        link: function(scope, element) {
            var ENTER = 13, COMMA = 188, SPACE = 32, BACKSPACE = 8;
            var measure         = element.find('.measure'),
                input           = element.find('input'),
                elWidth         = element.width(),
                inputStartWidth = input.width(),
                addTo           = 10; // px

            element.find('.tags-input-transclude')
                .bind('mouseover', function(e) {
                    scope.elHover = true;
                    scope.$apply();
                })
                .bind('mouseout', function(e) {
                    scope.elHover = false;
                    scope.$apply();
                });
            
            element.find('input')
                .bind('keydown', function(e) {
                    if (e.keyCode === ENTER && scope.addOnEnter ||
                        e.keyCode === COMMA && scope.addOnComma ||
                        e.keyCode === SPACE && scope.addOnSpace) {

                        if (scope.tryAdd()) {
                            scope.$apply();
                        }
                        e.preventDefault();
                    }
                    else if (e.keyCode === BACKSPACE && this.value.length === 0) {
                        if (scope.tryRemoveLast()) {
                            scope.$apply();

                            e.preventDefault();
                        }
                    }
                })
                .bind('focusin', function(e) {
                    scope.elFocus = true;
                    scope.$apply();
                })
                .bind('focusout', function(e) {
                    scope.elFocus = false;
                    scope.$apply();
                });

            element.find('div').bind('click', function() {
                element.find('input')[0].focus();
            });

            scope.$watch('newTag', function () {
                var measureWidth = measure.outerWidth();
                if(measureWidth < inputStartWidth) {
                    scope.inputStyle = {width: inputStartWidth}
                } else if(measureWidth + addTo > elWidth) {
                    scope.inputStyle = {width: elWidth}
                } else {
                    scope.inputStyle = {width: measureWidth + addTo}
                };
                
            });
        }
    };
});
}());
