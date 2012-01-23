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

_Publish.publish_
Parameters:
    * object {
         * instance
         * message
         * data
         * synchronousPublish
         * subscribers
    }
    * callback
