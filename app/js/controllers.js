'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
   .controller('HomeCtrl', ['$scope', 'syncData', function($scope, syncData) {
      syncData('syncedValue').$bind($scope, 'syncedValue');
   }])

  .controller('ChatCtrl', ['$scope', 'syncData', function($scope, syncData) {
      $scope.newMessage = null;

      // constrain number of messages by limit into syncData
      // add the array into $scope.messages
      $scope.messages = syncData('messages', 10);

      // add new messages to the list
      $scope.addMessage = function() {
         if( $scope.newMessage ) {
            $scope.messages.$add({text: $scope.newMessage});
            $scope.newMessage = null;
         }
      };
   }])
   .controller('AuthCtrl', ['$scope', '$rootScope', 'loginService', '$location', function($scope, $rootScope, loginService, $location) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;
      $scope.regresponse={};
      
      $rootScope.loginClick=function(){
         $scope.regresponse.show=false;
         $scope.createMode = false;
         $scope.email = null;
         $scope.pass = null;
      }

      $scope.login = function(provider, cb) {
         $scope.err = null;
         var options={};
         if(provider=="password"){
            if( !$scope.email ) {
               $scope.err = 'Please enter an email address';
            }
            else if( !$scope.pass ) {
               $scope.err = 'Please enter a password';
            }else {
               options = {
                  email: $scope.email,
                  password: $scope.pass,
                  rememberMe: true
               };
            }
         } else {
            options = {
               rememberMe: true
            };
         }

         if($scope.err==null && angular.isString(provider)){
            loginService.login(provider, options, function(err, user) {
               $scope.err = err? err + '' : null;
               if( !err ) {       
                  cb && cb(user);
               }
            }); 
         }
      };

      $scope.socialCb=function(user){  
         $location.path("/home");
      }

      $scope.submit=function(){
         if($scope.createMode == true) {
            $scope.createAccount();
         }else {
            $scope.login("password", function(){
                     $location.path("/home");
                  });
         }
      };

      $scope.createAccount = function() {
         $scope.err = null;
         if( assertValidLoginAttempt() ) {
            $scope.pass=(Math.floor(Math.random() * Math.pow(16,5)).toString(16));
            loginService.createAccount($scope.email,$scope.pass,function(err, user) {
               if( err ) {
                  $scope.err = err? err + '' : null;
               }else {
                  // must be logged in before I can write to my profile
                  $scope.login("password", function() {
                     loginService.createProfile(user.uid, user.email);     
                     
                     loginService.sendPasswordResetEmail(user.email, function(error,success){
                        var message=" send temporary password. ";
                        var instruction="";
                        if (!error) {
                           message = "Success" + message ;
                           instruction = "Check your email for your password. Don't forget to change it!";   
                        }else{
                           message = "Failed" + message;
                           instruction = "Give a valid email! <a href='#/login'>login</a>";
                        }
                        $scope.regresponse={message:message, instruction:instruction, show:true};
                     });  

                     loginService.logout();  
                     $location.path('/auth');   
                  });   
                  
               }               
            });
         }
      };   

      function assertValidLoginAttempt() {
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }/*
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else if( $scope.pass !== $scope.confirm ) {
            $scope.err = 'Passwords do not match';
         }*/
         return !$scope.err;
      }

   }])

   .controller('AccountCtrl', ['$scope', 'loginService', 'changeEmailService', 'firebaseRef', 'syncData', '$location', 'FBURL', function($scope, loginService, changeEmailService, firebaseRef, syncData, $location, FBURL) {
      $scope.syncAccount = function() {
         $scope.user = {};
         syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user').then(function(unBind) {
            $scope.unBindAccount = unBind;
         });
      };
      // set initial binding
      $scope.syncAccount();

      $scope.logout = function() {
         loginService.logout();
         $location.path("/home")
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
         $scope.emailerr = null;
         $scope.emailmsg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword(buildPwdParms());
      };

      $scope.updateEmail = function() {
        $scope.reset();
        // disable bind to prevent junk data being left in firebase
        $scope.unBindAccount();
        changeEmailService(buildEmailParms());
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function(err) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         };
      }
      function buildEmailParms() {
         return {
            newEmail: $scope.newemail,
            pass: $scope.pass,
            callback: function(err) {
               if( err ) {
                  $scope.emailerr = err;
                  // reinstate binding
                  $scope.syncAccount();
               }
               else {
                  // reinstate binding
                  $scope.syncAccount();
                  $scope.newemail = null;
                  $scope.pass = null;
                  $scope.emailmsg = 'Email updated!';
               }
            }
         };
      }

   }]);