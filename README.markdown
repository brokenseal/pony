# Pony: a pub/sub javascript broker

I creted this project after having forked and modified this other project https://github.com/brokenseal/PubSubJS but still didn't like it.

Pony is a class and it allows you to instantiate new brokers if needed. As a library it gives you access to an already instantiated broker called pony (no capital letter).
This library allows you to:
    * publish asynchronous and synchronous messages
    * unsubscribe previously subscribed functions using returning tokens
    * get notified when all the subscribers are done working on the published message, which is something a pub/sub system usually does not allow you to know

Since I wrote it right after having modified mroderick's own library, a lot of things are inspired by it.

## Goals
* No dependencies
* No subscriber modification
* No use of DOM

## API

_Publish.publish ( message [, *args ] ) -> Boolean | Array | Publication object _
Arguments:
* message (String): the message to publish on the current broker
* *args: any amount of arguments, past the message

This method publishes a particular message with any amount of data given to the function
It then returns a false boolean if no subscriber is found for this message,
it returns an Array of returned values from the subscribers called,
it returns a Publication object if a queue of messages is keps inside the broker
(please refer to the Publication object specification inside the private publish function)
or it returns  true boolean value for successfull calls
