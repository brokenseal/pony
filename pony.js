/**
 * Pony - a Pub/Sub broker implementation
 *
 * Author: Davide Callegari <info@brokenseal.it> - http://www.brokenseal.it/
 *
 * License: MIT
 *
 **/

;(function(context, undefined){
    var
        Pony= function(settings){
            var
                messageListLen
                ,message
                ;

            // allow instantiation without the new keyword
            if( !( this instanceof Pony ) ) {
                return new Pony(settings);
            }

            // private attribute, accessible only from the settings method
            this.settings= mergeWithDefaultSettings(settings || {});

            if(this.settings.queueMessages === true) {
                this.messageQueue= {};
            }

            this.subscriptionList= {};
            this.subscriptionQueue= {};
            this.subscribersTokenIndex= {};
            this.messageSubscriptionTokenIndex= {};
            this.asyncTimeoutIds = [];

            if(this.settings.clearMessageQueueEvery) {
                this.startClearingMessageQueue();
            }

            if(this.settings.messageList){
                this.messages = {};
                messageListLen = this.settings.messageList.length;

                while(messageListLen--){
                    message = this.settings.messageList[messageListLen];
                    this.messages[message] = message;
                }
            }

            return this;
        }

    // private shared variables
        ,messageQueueObjectId= 0
        ,subscriptionToken= 0

    /**
     *
     * @param object {
         *      instance
         *      message
         *      data
         *      synchronousPublish
         *      subscribers
         * }
     * @param callback
     */
        ,publish= function(kwargs, cb){
            var
                messageQueue
                ,instance= kwargs.instance
                ,message= kwargs.message
                ,data= kwargs.data
                ,synchronousPublish= kwargs.synchronousPublish
                ,subscribers= kwargs.subscribers

                ,publicationObject
                ,returnValues= []
                ,subscribersLen
                ,callbackQueue= []
                ,len
                ,i
                ,deliveredMessageCount= 0
                ,deliverMessage= function(subscriber, data){
                    var
                        returnValue
                        ;

                    try {
                        returnValue= subscriber.apply(instance, data);
                    } catch(e) {
                        setTimeout(function(){
                            throw e;
                        }, 0);
                        return;
                    } finally {
                        deliveredMessageCount+= 1;
                    }

                    if(synchronousPublish) {
                        returnValues.push(returnValue);
                    } else if(instance.settings && instance.settings.queueMessages === true && publicationObject) {
                        publicationObject.returnValues.push(returnValue);

                        if(deliveredMessageCount == subscribers.length && callbackQueue.length !== 0) {
                            for(i= 0, len= callbackQueue.length; i < len; i++) {
                                callbackQueue[i](publicationObject.returnValues);
                            }
                        }
                    }
                }
                ,avoidAddingToMessageQueue = false
                ,timeoutId
                ;

            if(cb !== undefined && Object.prototype.toString.call(cb) == "[object Boolean]" && cb == true){
                avoidAddingToMessageQueue = true;
                cb = null;
            } else if(cb !== undefined && Object.prototype.toString.call(cb) != "[object Function]"){
                cb = null;
            }

            subscribers= subscribers || instance.subscriptionList[ message ];
            subscribersLen= subscribers ? subscribers.length : 0 ;

            // if the user wants the messages to be queued
            if(instance.settings.queueMessages === true && !avoidAddingToMessageQueue) {
                // if the message queue for this particular message does not exist yet
                if(!instance.messageQueue.hasOwnProperty(message)) {
                    // create it
                    instance.messageQueue[ message ]= messageQueue= [];
                } else {
                    // or retrieve it
                    messageQueue= instance.messageQueue[ message ];
                }

                // Publication object specification
                // create a new message queue object
                publicationObject= {
                    // give it a unique id
                    id: messageQueueObjectId++
                    // the data supplied for this particular publication
                    ,data: data
                    // the amount of callbacks are subscribed to this particular message, right now
                    ,subscriptionCount: subscribersLen
                    // an array which is filled with all the return values taken from the
                    ,returnValues: []
                    // a possible callback function which wil be fired after all the current subscribers will be
                    // fired
                    ,complete: function(fn){
                        callbackQueue.push(fn);
                    }
                };

                // push the current publication object on to the queue
                messageQueue.push(publicationObject);
            }

            // if there are no subscribers available for this particular message,
            // return false
            if(!subscribers || !subscribersLen) {
                return false;
            }

            if(synchronousPublish) {
                while(subscribersLen--) {
                    // deliver message right away, synchronously
                    deliverMessage(subscribers[subscribersLen], data);

                    if(cb){
                        cb();
                    }
                }
            } else {
                while(subscribersLen--) {
                    // deliver message whenever possible, without blocking any
                    // other js or the  browser UI ( http://ejohn.org/blog/how-javascript-timers-work/ )
                    timeoutId = setTimeout((function(subscriber, data){
                        return function(){
                            deliverMessage(subscriber, data);

                            if(cb){
                                cb();
                            }
                        };
                    })(subscribers[subscribersLen], data), 0);

                    instance.asyncTimeoutIds.push(timeoutId);
                }
            }

            if(synchronousPublish) {
                return returnValues;
            } else if(instance.settings.queueMessages === true && publicationObject) {
                return publicationObject;
            }

            return true;
        }

        ,unsubscribeTokenFromInstance= function(instance, subscriptionToken ) {
            var
                tokenIndex= instance.subscribersTokenIndex[ subscriptionToken ]
                ,message= instance.messageSubscriptionTokenIndex[ subscriptionToken ]
                ,unsubscribedSubscriber
                ;

            unsubscribedSubscriber= instance.subscriptionList[ message ].splice(tokenIndex, 1)[0]

            if(instance.subscriptionList[ message ] === 0) {
                delete instance.subscriptionList[ message ];
            }

            delete instance.subscribersTokenIndex[ subscriptionToken ];
            delete instance.messageSubscriptionTokenIndex[ subscriptionToken ];

            return unsubscribedSubscriber;
        }
        ,addSubscriberToInstance= function(instance, message, subscriber){
            // double index reference for easier unsubscriptions
            instance.subscribersTokenIndex[ subscriptionToken ]= instance.subscriptionList[ message ].push( subscriber ) - 1;
            instance.messageSubscriptionTokenIndex[ subscriptionToken ]= message;

            return subscriptionToken;
        }
    // default settings
        ,defaultSettings= {
            // keep track of all the messages sent to the broker
            // if set, any subscriber which subscribe after a message has already been sent
            // will be called with this message queue as soon as it subscribes to that
            // particular message
            queueMessages: true

            // if set and queueMessages is set to true, it must be the number of
            // seconds after which the message queue will be cleared upon instantiation
            // very useful to do a garbage collection of useless messages published
            ,clearMessageQueueEvery: 360 // every 5 minutes

            // if set Pony will accept only messages existing inside this message list
            ,messageList: null
        }

    // utility functions
        ,mergeWithDefaultSettings= function(settings){
            var
                key
                ;

            for(key in defaultSettings) {
                if(!(key in settings)) {
                    settings[key]= defaultSettings[key];
                }
            }

            return settings;
        }
        ,checkMessageValidity = function(instance, message){
            if(message === undefined || instance.messages && !(message in instance.messages)){
                throw Error("Message " + message + " not accepted by this Pony instance. List of available messages: " + instance.settings.messageList);
            }
        }
        ;

    Pony.prototype= {

        // force constructor to be the Pony function
        constructor: Pony
        /**
         *  Pony.subscribe( message [, *args ] ) -> String | Array
         *  - message (String): the message to which all the given function will be subscribed to
         *  - *args: any amount of functions that will be subscribed
         *  This method subscribes all the given functions to this message and returns
         *  a subscription token or a list of subscription tokens, with which it is possible
         *  to unsubscribe all the functions
         **/
        ,subscribe: function(message){
            var
                subscribers= Array.prototype.slice.call(arguments).slice(1)
                ,subscriptionTokenList= []
                ,i
                ,subscribersLen
                ,returnSubscriptionToken
                ,messageQueueLen
                ;
            checkMessageValidity(this, message);

            if(!this.subscriptionList.hasOwnProperty(message)) {
                this.subscriptionList[ message ]= [];
            }

            if(this.settings.queueMessages === true && this.messageQueue[ message ] && this.messageQueue[ message ].length) {
                messageQueueLen= this.messageQueue[ message ].length;
                // deliver previously published messages to new subscribers, asynchronously by default
                while(messageQueueLen--) {
                    publish({
                        instance: this
                        ,message: message
                        ,data: this.messageQueue[ message ][ messageQueueLen ].data
                        ,synchronousPublish: false
                        ,subscribers: subscribers
                    }, true);
                }
            }

            if(subscribers.length > 1) {
                for(i= 0, subscribersLen= subscribers.length; i < subscribersLen; i++) {
                    subscriptionTokenList.push(addSubscriberToInstance(this, message, subscribers[i]));
                    subscriptionToken+= 1;
                }

                return subscriptionTokenList;

            } else {
                returnSubscriptionToken= addSubscriberToInstance(this, message, subscribers[0]);
                subscriptionToken+= 1;
                return returnSubscriptionToken;
            }
        }

        /**
         *  Pony.unsubscribe( subscriptionToken ) -> Function | Array
         *  - token (String | Array): a subscription token or a list of subscription tokens
         *  This method unsubscribes subscribers with the associated subscription token.
         *  If an array of subscription token is provided, all the token will be used to unsubscribe
         *  the subscribers.
         *
         *  The return value can be the unsubscribed function or an array of unsubscribed functions
         **/
        ,unsubscribe: function(subscriptionToken){
            var
                subscriptionTokenLen
                ,unsubscribedCallbacks
                ;

            if(!subscriptionToken){
                return;
            }

            if(!subscriptionToken.length) {
                unsubscribedCallbacks= unsubscribeTokenFromInstance(this, subscriptionToken);
            } else {
                subscriptionTokenLen= subscriptionToken.length;
                unsubscribedCallbacks= [];

                while(subscriptionTokenLen--) {
                    unsubscribedCallbacks.push(unsubscribeTokenFromInstance(this, subscriptionToken[ subscriptionTokenLen ]));
                }
            }

            return unsubscribedCallbacks;
        }

        /**
         *  Pony.publish( message [, *args ] ) -> Boolean | Array | Publication object
         *  - message (String): the message to publish on the current broker
         *  - *args: any amount of arguments, past the message
         *  This method publishes a particular message with any amount of data given to the function
         *  It then returns a false boolean if no subscriber is found for this message,
         *  it returns an Array of returned values from the subscribers called,
         *  it returns a Publication object if a queue of messages is keps inside the broker
         *  (please refer to the Publication object specification inside the private publish function)
         *  or it returns  true boolean value for successfull calls
         **/
        ,publish: function(message){
            var
                data= Array.prototype.slice.call(arguments).slice(1)
                ;
            checkMessageValidity(this, message);

            // TODO: callback as argument or as attribute of the passed publicationObject?

            return publish({
                instance: this
                ,message: message
                ,data: data
                ,synchronousPublish: false
            });
        }

        /**
         *  Pony.publishSync( message [, *args ] ) -> Boolean
         *  - message (String): the message to publish on the current broker
         *  - *args: any amount of arguments, past the message
         *  This method publishes a particular message with any amount of data given to the function
         **/
        ,publishSync: function(message){
            var
                data= Array.prototype.slice.call(arguments).slice(1)
                ;
            checkMessageValidity(this, message);

            return publish({
                instance: this
                ,message: message
                ,data: data
                ,synchronousPublish: true
            });
        }

        /**
         *  Pony.startClearingMessageQueue( ) -> Pony instance
         *  It starts clearing message queue, based on the clearMessageQueueEvery setting
         **/
        ,startClearingMessageQueue: function(){
            var
                instance= this
                ;

            // if there is no interval already set
            if(!this.clearMessageQueueInterval && this.settings.clearMessageQueueEvery && this.settings.queueMessages) {
                // setup a new interval for clearing messages
                instance.clearMessageQueueInterval= setInterval(function(){
                    instance.clearMessageQueue();
                }, this.settings.clearMessageQueueEvery * 1000);
            }

            return this;
        }

        /**
         *  Pony.stopClearingMessageQueue( ) -> Pony instance
         *  It stop clearing message queue
         **/
        ,stopClearingMessageQueue: function(){
            if(this.clearMessageQueueInterval) {
                clearInterval(this.clearMessageQueueInterval);
                this.clearMessageQueueInterval= null;
            }

            return this;
        }

        /**
         *  Pony.clearMessages( ) -> Pony instance
         *  It clears the message queue
         **/
        ,clearMessageQueue: function(){
            this.messageQueue= {};

            return this;
        }


        /**
         *  Pony.destroy( ) -> Pony instance
         *  It removes any trace of this Pony instance from the memory
         **/
        ,destroy: function(){
            var name,
                len = this.asyncTimeoutIds.length;

            while(len--){
                clearTimeout(this.asyncTimeoutIds[len]);
            }

            for(name in this){
                if(this.hasOwnProperty(name)){
                    delete this[name];
                }
            }
        }
    };

    context.Pony= Pony;

    // instantiate a new Pony and make it publicly available for commodity
    context.pony= Pony();
})(this);
