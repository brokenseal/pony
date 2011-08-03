$(function(){
	
	module("Pony Class tests");
	
	test("Ponies must instantiate perfectly", function(){
		var
			firstPony= Pony()
			,secondPony= Pony()
		;
		
		ok(firstPony, "Pony instantiated");
		ok(firstPony instanceof Pony, "Pony instantiated correctly");
		equal(firstPony.prototype, secondPony.prototype, "Two ponies must look the same");
		notEqual(firstPony.clearMessageQueueInterval, secondPony.clearMessageQueueInterval, "Two ponies must not have the same message queue clear interval");
	});
	
	test("Ponies must be set perfectly", function(){
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
	
	module("Pony subscription");
	
	test("Functions must subscribe and unsubscribe", function(){
		var
			ponyExpress= Pony()
			,spy= sinon.spy()
			,messageName= "my-message"
			,subscriptionToken= ponyExpress.subscribe(messageName, spy)
		;
		
		
		ok(ponyExpress.subscriptionList[ messageName ], "Subscription list for this particular message must exist");
		equal(ponyExpress.subscriptionList[ messageName ].length, 1, "Subscription list for this particular message must be one only");
		equal(ponyExpress.subscriptionList[ messageName ][0].valueOf(), spy.valueOf(), "Verify that the supplied callback is the same as the one stored inside the subscription list");
		
		ponyExpress.publishSync(messageName);
		
		ok(spy.calledOnce, "Subscriber must be called once.");
		ok(!spy.calledTwice, "Subscriber must not be called twice.");
	});
});