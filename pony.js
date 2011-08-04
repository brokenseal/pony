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
				instance= this
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
			
			if(this.settings.clearMessageQueueEvery) {
				this.startClearingMessageQueue();
			}
			
			return this;
		}
		
		// private shared attributes
		,messageQueueObjectId= 0
		,subscriptionToken= 0
		
		// private shared methods
		,publish= function(instance, message, data, synchronousPublish, subscribers){
			var
				messageQueue
				,publicationObject
				,returnValues= []
				,subscribersLen
				,throwException= function(exception){
					throw exception;
				}
				,deliverMessage= function(subscriber, data){
					var
						returnValue
					;
					
					try {
						returnValue= subscriber.apply(context, data);
					} catch(e) {
						setTimeout(throwException, 0, e);
						return;
					}
					
					if(synchronousPublish) {
						returnValues.push(returnValue);
					} else if(instance.settings.queueMessages === true && publicationObject) {
						publicationObject.returnValues.push(returnValue);
					}
					
				}
			;
			
			subscribers= subscribers || instance.subscriptionList[ message ];
			subscribersLen= subscribers.length;
			
			// if there are no subscribers available for this particular message,
			// return false
			if(!subscribers || !subscribers.length) {
				return false;
			}
			
			// if the user wants the messages to be queued
			if(instance.settings.queueMessages === true) {
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
					,returnValues: []
				};
				
				// push the current publication object on to the queue
				messageQueue.push(publicationObject);
			}
			
			if(synchronousPublish) {
				while(subscribersLen--) {
					// deliver message right away, synchronously
					deliverMessage(subscribers[subscribersLen], data);
				}
			} else {
				while(subscribersLen--) {
					// deliver message whenever possible, without blocking any
					// other js or the  browser UI ( http://ejohn.org/blog/how-javascript-timers-work/ )
					setTimeout(deliverMessage, 0, subscribers[subscribersLen], data)
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
	;
	
	Pony.prototype= {
		
		/**
		 *  Pony.subscribe( message [, *args ] ) -> String | Array
		 *  - message (String): the message to which all the given function will be subscribed to
		 *  - *args: any amount of functions that will be subscribed
		 *  This method subscribes all the given functions to this message and returns
		 *  a subscription token or a list of subscription tokens, with which it is possible
		 *  to unsubscribe all the functions
		**/
		subscribe: function(message){
			var
				subscribers= Array.prototype.slice.call(arguments).slice(1)
				,subscriptionTokenList= []
				,i
				,subscribersLen
				,pony= this
				,returnSubscriptionToken
			;
			
			if(!this.subscriptionList.hasOwnProperty(message)) {
				this.subscriptionList[ message ]= [];
			}
			
			if(this.settings.queueMessage === true && this.messageQueue[ message ] && this.messageQueue[ message ].length) {
				// deliver previously published messages to new subscribers, asynchronously by default
				while(messageQueueLen--) {
					publish(this, message, this.messageQueue[ message ][ messageQueueLen ], false, subscribers);
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
			
			return publish(this, message, data, false);
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
			
			return publish(this, message, data, true);
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
		 *  Pony.startClearingMessageQueue( ) -> Pony instance
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
		 *  Pony.startClearingMessageQueue( ) -> Pony instance
		 *  It clears the message queue
		**/
		,clearMessageQueue: function(){
			this.messageQueue= {};
			
			return this;
		}
	};
	
	context.Pony= Pony;
	
	// instantiate a new Pony and make it publicly available for commodity
	context.pony= Pony();
})(this);