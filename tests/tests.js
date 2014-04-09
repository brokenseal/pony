$(function(){
    var
        asyncTestTimeout= 1000
    ;
	
	module("[ -- CLASS TESTS -- ]");
	
	test("Pony instances", 5, function(){
		var
			firstPony= Pony()
			,secondPony= Pony()
		;
		
        ok(firstPony instanceof Pony, "Pony instantiated correctly");
        ok(secondPony instanceof Pony, "Second pony instantiated correctly");
        equal(firstPony.constructor.valueOf(), secondPony.constructor.valueOf(), "Two ponies must have the same constructor");
        equal(firstPony.prototype, secondPony.prototype, "Two ponies must have the same prototype");
		notEqual(firstPony.clearMessageQueueInterval, secondPony.clearMessageQueueInterval, "Two ponies must not have the same message queue clear interval");
	});
	
	test("Pony settings", 4, function(){
		var
			firstPony= Pony({
				queueMessages: false
				,clearMessageQueueEvery: 10
			})
			,secondPony= Pony({
				queueMessages: true
				,clearMessageQueueEvery: 10
			})
		;
		
		ok(!firstPony.messageQueue, "Ponies with the queueMessages setting set to false must not have a messageQueue attribute");
		ok(!firstPony.clearMessageQueueInterval, "Ponies with the queueMessages setting set to false and a clearMessageQueueEvery setting set anyway, must not have a clearMessageQueueInterval attribute");
		ok(secondPony.messageQueue, "Ponies with the queueMessages setting set to true must have a messageQueue attribute");
		ok(secondPony.clearMessageQueueInterval, "Ponies with the queueMessages setting set to true must have a clearMessageQueueInterval attribute");
	});
	
	module("[ -- SUBSCRIBE -- ]");
	
    test("Callbacks subscribtion", 3, function(){
        var
            ponyExpress= Pony()
            ,spy= sinon.spy()
            ,messageName= "my-message"
        ;

        ponyExpress.subscribe(messageName, spy);
		
        ok(ponyExpress.subscriptionList[ messageName ], "Subscription list for this particular message must exist");
        equal(ponyExpress.subscriptionList[ messageName ].length, 1, "Subscription list for this particular message must be one only");
        equal(ponyExpress.subscriptionList[ messageName ][0].valueOf(), spy.valueOf(), "Verify that the supplied callback is the same as the one stored inside the subscription list");
    });

    test("Callbacks later subscribtion", 7, function(){
        var
            ponyExpress= Pony()
            ,spy= sinon.spy()
            ,laterSpy= sinon.spy()
            ,messageName= "my-message"
        ;

        stop(asyncTestTimeout);
        
        ponyExpress.subscribe(messageName, spy);
        ponyExpress.publish(messageName);
        ponyExpress.subscribe(messageName, laterSpy);

        setTimeout(function(){
            ok(spy.calledOnce, "Subscriber must be called once");
            ok(!spy.calledTwice, "Subscriber must not be called twice");
            ok(!spy.calledThrice, "Subscriber must not be called thrice");

            ok(laterSpy.called, "Later subscriber must be called");
            ok(laterSpy.calledOnce, "Later subscriber must be called once");
            ok(!laterSpy.calledTwice, "Later subscriber must not be called twice");
            ok(!laterSpy.calledThrice, "Later subscriber must not be called thrice");
            
            start();
        }, 0);
    });

	test("Callbacks unsubscribtion", 2, function(){
		var
			ponyExpress= Pony()
			,spy= sinon.spy()
			,messageName= "my-message"
			,subscriptionToken= ponyExpress.subscribe(messageName, spy)
		;
		
		ponyExpress.unsubscribe(subscriptionToken);
		
		ok(!ponyExpress.subscriptionList[ messageName ].length, "Subscription list for this particular message must be empty");
		equal(ponyExpress.subscriptionList[ messageName ].length, 0, "Subscription list for this particular message must not exist");
	});
	
	test("Callbacks multiple unsubscription", 2, function(){
		var
			ponyExpress= Pony()
			,spy1= sinon.spy()
			,spy2= sinon.spy()
			,spy3= sinon.spy()
			,messageName= "my-message"
			,subscriptionTokenList= ponyExpress.subscribe(messageName, spy1, spy2, spy3)
		;
		
		ponyExpress.unsubscribe(subscriptionTokenList);
		
		ok(!ponyExpress.subscriptionList[ messageName ].length, "Subscription list for this particular message must be empty");
		equal(ponyExpress.subscriptionList[ messageName ].length, 0, "Subscription list for this particular message must not exist");
	});
	
	module("[ -- PUBLISH -- ]");
	
	test("Publish messages synchronously on subscribers", 9, function(){
		var
			ponyExpress= Pony()
			,spy= sinon.spy()
			,spy2= sinon.spy()
			,spy3= sinon.spy()
			,messageName= "my-message"
            ,messageName2= "my-message-2"
            ,messageName3= "my-message-3"
		;

        ponyExpress.subscribe(messageName, spy);
        ponyExpress.subscribe(messageName2, spy2);
        ponyExpress.subscribe(messageName3, spy3);

		// publish the first mess
		ponyExpress.publishSync(messageName);
		
		ok(spy.calledOnce, "Subscriber must be called once.");
        ok(!spy.calledTwice, "Subscriber must not be called twice.");
        ok(!spy.calledThrice, "Subscriber must not be called thrice.");

		// let's publish this message two times
		ponyExpress.publishSync(messageName2);
		ponyExpress.publishSync(messageName2);

		ok(!spy2.calledOnce, "Subscriber 2 must not be called once.");
		ok(spy2.calledTwice, "Subscriber 2 must be called twice.");
		ok(!spy2.calledThrice, "Subscriber 2 must not be called thrice.");

		// let's publish this message three times
        ponyExpress.publishSync(messageName3);
        ponyExpress.publishSync(messageName3);
        ponyExpress.publishSync(messageName3);

		ok(!spy3.calledOnce, "Subscriber 3 must not be called once.");
		ok(!spy3.calledTwice, "Subscriber 3 must not be called twice.");
		ok(spy3.calledThrice, "Subscriber 3 must be called thrice.");
	});
	
	test("Publish messages synchronously on multiple subscribers", 6, function(){
		var
			ponyExpress= Pony()
			,spy1= sinon.spy()
			,spy2= sinon.spy()
			,spy3= sinon.spy()
			,messageName= "my-message"
		;

        ponyExpress.subscribe(messageName, spy1, spy2, spy3);
		ponyExpress.publishSync(messageName);
		
		ok(spy1.calledOnce, "Subscriber 1 must be called once.");
		ok(!spy1.calledTwice, "Subscriber 1 must not be called twice.");
		
		ok(spy2.calledOnce, "Subscriber 2 must be called once.");
		ok(!spy2.calledTwice, "Subscriber 2 must not be called twice.");
		
		ok(spy3.calledOnce, "Subscriber 3 must be called once.");
		ok(!spy3.calledTwice, "Subscriber 3 must not be called twice.");
	});
	
	test("Publish messages asynchronously on subscribers", 3, function(){
		var
			ponyExpress= Pony()
			,spy= sinon.spy()
			,messageName= "my-message"
		;

        ponyExpress.subscribe(messageName, spy);

		stop(asyncTestTimeout);
		
		ponyExpress.publish(messageName);
		
		setTimeout(function(){
			ok(spy.calledOnce, "Subscriber must be called once.");
            ok(!spy.calledTwice, "Subscriber must not be called twice.");
            ok(!spy.calledThrice, "Subscriber must not be called thrice.");

			start();
		}, 0);
	});

    test("Publish messages asynchronously on multiple subscribers", 6, function(){
        var
            ponyExpress= Pony()
            ,spy1= sinon.spy()
            ,spy2= sinon.spy()
            ,spy3= sinon.spy()
            ,messageName= "my-message"
            ,subscriptionToken= ponyExpress.subscribe(messageName, spy1, spy2, spy3)
        ;

        stop(asyncTestTimeout);
        
        ponyExpress.publish(messageName);

        setTimeout(function(){
            ok(spy1.calledOnce, "Subscriber 1 must be called once.");
            ok(!spy1.calledTwice, "Subscriber 1 must not be called twice.");

            ok(spy2.calledOnce, "Subscriber 2 must be called once.");
            ok(!spy2.calledTwice, "Subscriber 2 must not be called twice.");

            ok(spy3.calledOnce, "Subscriber 3 must be called once.");
            ok(!spy3.calledTwice, "Subscriber 3 must not be called twice.");

            start();
        }, 0);
    });
    
    test("Test passed values on asynchronous/multiple messages", 3, function(){
        var
            ponyExpress= Pony()
            ,spy1= sinon.spy()
            ,spy2= sinon.spy()
            ,spy3= sinon.spy()
            ,messageName= "my-message"
            ,messageName2= "my-message-2"
            ,firstArgument= 1
            ,secondArgument= 2
        ;

        ponyExpress.subscribe(messageName, spy1);
        ponyExpress.subscribe(messageName2, spy2, spy3);

        stop(asyncTestTimeout);

        ponyExpress.publish(messageName, firstArgument);
        ponyExpress.publish(messageName2, secondArgument);

        setTimeout(function(){
            ok(spy1.calledWith(firstArgument), "Subscriber 1 must be called with first argument (1).");
            ok(spy2.calledWith(secondArgument), "Subscriber 2 must be called with second argument (2).");
            ok(spy3.calledWith(secondArgument), "Subscriber 3 must be called with second argument (2).");

            start();
        });
    });
    
    test("Test return values on synchronous/multiple messages", 2, function(){
        var
            ponyExpress= Pony()
            ,additionalArgument1= 10
            ,additionalArgument2= 20
            ,additionalArgument3= 30
            ,spy1= function(arg){
                return arg + additionalArgument1;
            }
            ,spy3= function(arg){
                return arg + additionalArgument2;
            }
            ,spy2= function(arg){
                return arg + additionalArgument3;
            }
            ,messageName= "my-message"
            ,messageName2= "my-message-2"
            ,firstArgument= 1
            ,secondArgument= 2
            ,returnValueFirstPublication
            ,returnValueSecondPublication
            ,expectedReturnValueFirstPublication= [ (firstArgument + additionalArgument1) ]
            ,expectedReturnValueSecondPublication= [ (secondArgument + additionalArgument2), (secondArgument + additionalArgument3) ]
        ;
        
        ponyExpress.subscribe(messageName, spy1);
        ponyExpress.subscribe(messageName2, spy2, spy3);

        returnValueFirstPublication= ponyExpress.publishSync(messageName, firstArgument);
        returnValueSecondPublication= ponyExpress.publishSync(messageName2, secondArgument);

        deepEqual(returnValueFirstPublication, expectedReturnValueFirstPublication, "Test return value on first publication.");
        deepEqual(returnValueSecondPublication, expectedReturnValueSecondPublication, "Test return value on second publication.");
    });

    test("Test return values on asynchronous/multiple messages", 2, function(){
        var
            ponyExpress= Pony()
            ,additionalArgument1= 10
            ,additionalArgument2= 20
            ,additionalArgument3= 30
            ,spy1= function(arg){
                return arg + additionalArgument1;
            }
            ,spy3= function(arg){
                return arg + additionalArgument2;
            }
            ,spy2= function(arg){
                return arg + additionalArgument3;
            }
            ,messageName= "my-message"
            ,messageName2= "my-message-2"
            ,firstArgument= 1
            ,secondArgument= 2
            ,expectedFirstPublicationObjectReturnValues= [ (firstArgument + additionalArgument1) ]
            ,expectedSecondPublicationObjectReturnValues= [ (secondArgument + additionalArgument2), (secondArgument + additionalArgument3) ]
        ;

        stop(asyncTestTimeout);

        ponyExpress.subscribe(messageName, spy1);
        ponyExpress.subscribe(messageName2, spy2, spy3);

        ponyExpress.publish(messageName, firstArgument).complete(function(returnValues){
            deepEqual(returnValues, expectedFirstPublicationObjectReturnValues, "Test return value on first publication.");

            // I needed this nested callback calls for the 'start' method provided by QUnit to actually work properly
            ponyExpress.publish(messageName2, secondArgument).complete(function(returnValues){
                deepEqual(returnValues, expectedSecondPublicationObjectReturnValues, "Test return value on second publication.");
                
                start();
            });
        });
    });

    module("[ -- REGRESSION TESTS -- ]");

    test("Destroy method needs to dispose of active async calls", 1, function(){
        var
            ponyExpress= Pony()
            ,messageName= 'test'
            ,spy = sinon.spy()
        ;

        stop(asyncTestTimeout);

        ponyExpress.subscribe(messageName, spy);
        ponyExpress.publish(messageName);

        ponyExpress.destroy();

        setTimeout(function(){
            ok(!spy.called, "Correctly disposed of async calls");
            start();
        }, 0);
    });
});
