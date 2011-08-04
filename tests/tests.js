$(function(){
	
	module("[ -- CLASS TESTS -- ]");
	
	test("Pony instances", 4, function(){
		var
			firstPony= Pony()
			,secondPony= Pony()
		;
		
		ok(firstPony, "Pony instantiated");
		ok(firstPony instanceof Pony, "Pony instantiated correctly");
		equal(firstPony.prototype, secondPony.prototype, "Two ponies must look the same");
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
			,subscriptionToken= ponyExpress.subscribe(messageName, spy)
		;
		
		ok(ponyExpress.subscriptionList[ messageName ], "Subscription list for this particular message must exist");
		equal(ponyExpress.subscriptionList[ messageName ].length, 1, "Subscription list for this particular message must be one only");
		equal(ponyExpress.subscriptionList[ messageName ][0].valueOf(), spy.valueOf(), "Verify that the supplied callback is the same as the one stored inside the subscription list");
	});
	
	test("Callbacks unsubscribtion", 2, function(){
		var
			ponyExpress= Pony()
			,spy= sinon.spy()
			,spy2= sinon.spy()
			,spy3= sinon.spy()
			,messageName= "my-message"
			,subscriptionToken= ponyExpress.subscribe(messageName, spy)
		;
		
		ponyExpress.unsubscribe(subscriptionToken);
		
		ok(!ponyExpress.subscriptionList[ messageName ].length, "Subscription list for this particular message must be empty");
		equal(ponyExpress.subscriptionList[ messageName ].length, 0, "Subscription list for this particular message must not exist");
	});
	
	test("Callbacks multiple unsubscribtion", 2, function(){
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
	
	test("Publish messages synchronously on subscribers", 8, function(){
		var
			ponyExpress= Pony()
			,spy= sinon.spy()
			,spy2= sinon.spy()
			,spy3= sinon.spy()
			,messageName= "my-message"
			,messageName2= "my-message-2"
			,subscriptionToken= ponyExpress.subscribe(messageName, spy)
			,subscriptionToken= ponyExpress.subscribe(messageName2, spy2)
			,subscriptionToken= ponyExpress.subscribe(messageName2, spy3)
		;
		
		// publish the first mess
		ponyExpress.publishSync(messageName);
		
		ok(spy.calledOnce, "Subscriber must be called once.");
		ok(!spy.calledTwice, "Subscriber must not be called twice.");
		
		// let's publish this message three times
		ponyExpress.publishSync(messageName2);
		ponyExpress.publishSync(messageName2);
		ponyExpress.publishSync(messageName2);
		
		ok(!spy2.calledOnce, "Subscriber 2 must not be called once.");
		ok(!spy2.calledTwice, "Subscriber 2 must not be called twice.");
		ok(spy2.calledThrice, "Subscriber 2 must not be called thrice.");
		
		ok(!spy3.calledOnce, "Subscriber 3 must not be called once.");
		ok(!spy3.calledTwice, "Subscriber 3 must not be called twice.");
		ok(spy3.calledThrice, "Subscriber 3 must not be called thrice.");
	});
	
	test("Publish messages synchronously on multiple subscribers", 6, function(){
		var
			ponyExpress= Pony()
			,spy1= sinon.spy()
			,spy2= sinon.spy()
			,spy3= sinon.spy()
			,messageName= "my-message"
			,subscriptionToken= ponyExpress.subscribe(messageName, spy1, spy2, spy3)
		;
		
		ponyExpress.publishSync(messageName);
		
		ok(spy1.calledOnce, "Subscriber 1 must be called once.");
		ok(!spy1.calledTwice, "Subscriber 1 must not be called twice.");
		
		ok(spy2.calledOnce, "Subscriber 2 must be called once.");
		ok(!spy2.calledTwice, "Subscriber 2 must not be called twice.");
		
		ok(spy3.calledOnce, "Subscriber 3 must be called once.");
		ok(!spy3.calledTwice, "Subscriber 3 must not be called twice.");
	});
	
	test("Publish messages asynchronously on subscribers", 2, function(){
		var
			ponyExpress= Pony()
			,spy= sinon.spy()
			,messageName= "my-message"
			,subscriptionToken= ponyExpress.subscribe(messageName, spy)
		;
		
		stop(5000);
		
		ponyExpress.publish(messageName);
		
		setTimeout(function(){
			ok(spy.calledOnce, "Subscriber must be called once.");
			ok(!spy.calledTwice, "Subscriber must not be called twice.");
			
			start();
		}, 0);
	});
});