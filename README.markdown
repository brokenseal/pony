# Pony: a pub/sub javascript broker

I created this project after having forked and modified this other project https://github.com/brokenseal/PubSubJS but still didn't like it.

Pony is a class and it allows you to instantiate new brokers if needed. As a library it gives you access to an already instantiated broker called pony (no capital letter).
This library allows you to:
    * publish asynchronous and synchronous messages
    * unsubscribe previously subscribed functions using returning tokens
    * get notified when all the subscribers are done working on the published message, which is something a pub/sub system usually does not allow you to know

Since I wrote it right after having modified mroderick's own library, a lot of things are inspired by it and they both share the same goals.

## Goals
* No dependencies
* No subscriber modification
* No use of DOM

The current version is 1.0 and it's final. No more changes are going to be applied to it.


## API

###Pony.subscribe( message [, *args ] ) -> String | Array

####Arguments
1. message (String): the message to which all the given function will be subscribed to
2. *args: any amount of functions that will be subscribed

This method subscribes all the given functions to this message and returns
a subscription token or a list of subscription tokens, with which it is possible
to unsubscribe all the functions



###Pony.unsubscribe( subscriptionToken ) -> Function | Array
####Arguments
1. subscriptionToken (String | Array): a subscription token or a list of subscription tokens

This method unsubscribes subscribers with the associated subscription token.
If an array of subscription token is provided, all the token will be used to unsubscribe
the subscribers.

The return value can be the unsubscribed function or an array of unsubscribed functions



###Publish.publish ( message [, *args ] ) -> Boolean | Array | Publication object

####Arguments
1. message (String): the message to publish on the current broker
2. *args: any amount of arguments, past the message

This method publishes a particular message with any amount of data given to the function
It then returns a false boolean if no subscriber is found for this message,
it returns an Array of returned values from the subscribers called,
it returns a Publication object if a queue of messages is keps inside the broker
(please refer to the Publication object specification inside the private publish function)
or it returns  true boolean value for successfull calls


###Pony.publishSync( message [, *args ] ) -> Boolean

####Arguments
1. message (String): the message to publish on the current broker
2. *args: any amount of arguments, past the message

This method works pretty much the same way the publish method works, except it's synchronous.
It returns (??? can't remember...)



###Pony.startClearingMessageQueue( ) -> Pony instance
This method starts clearing message queue, based on the clearMessageQueueEvery setting
It returns the class instance.


###Pony.stopClearingMessageQueue( ) -> Pony instance
This method stops the clearing of the message queue.
It returns the class instance.


###Pony.clearMessages( ) -> Pony instance
This method clears the message queue.
It returns the class instance.


##Learn by example

Here is a list of possible applications of the Pony pub/sub library.

### Notify everyone interested that a specific ajax request is completed

    // file app.js
    pony.subscribe('getStuffCompleted', function(data){
        // do some stuff
    });

    // file db.js
    pony.subscribe('getStuffCompleted', function(data){
        // do some other stuff
    });

    // file remote_communications.js
    $.get('/api/get_stuff.json', function(data){

        // do stuff

        pony.publish('getStuffCompleted', data);

        // update ui
    });

This is a very basic example on how Pony allows you to decouple code and let some parts of your code know about some
new data coming in without having to touch the code in that particular ajax call.

Let's now see a similar example using a specific list of messages defined somewhere else

    // file messages.js
    mynamespace.messages = {

        getStuffCompleted: {
            name: '' // the actual message name, make sure it's unique
            ,provides: 'json data' // a short description of the data that this message provides
        }
        ,anchorsUpdateComplete: {
            name: '' // the actual message name, make it unique
            ,provides: 'a list of anchor elements' // a short description of the data that this message provides
        }
    };

    // file dom_manipulation.js
    mynamespace.dom.updateFooter = function(){
        var nodes = document.getElementsByTagName('a');

        // do some UI stuff

        pony.publish(mynamespace.messages.getStuffCompleted.name, nodes);
    };

    // file app.js
    mynamespace.updatedAnchorsCache = {};

    pony.subscribe(mynamespace.messages.getStuffCompleted.name, function(anchorList){
        var anchorListLen = anchorList.length;

        while(anchorListLen--) {
            // let's assume that all anchors have a unique id...
            mynamespace.updatedAnchorsCache[anchorList[anchorListLen].getAttribute('id')] = anchorList[anchorListLen];
        }
    });