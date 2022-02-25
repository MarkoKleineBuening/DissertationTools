var dependencies = ['utils', 'radio'];

define(dependencies, function(utils, radio) {
    var EventBus = function() {
        function createTopicCreator() {
            // oldTODO: non-randomized unique namespace generation.
            var namespace = "" + Math.random();
            return function(topicName) {
                return namespace + ":" + topicName;
            };
        }
        
        function EventBus(topics) {
            utils.defConstant(this, "_transformTopic", createTopicCreator());
            utils.defConstant(this, "topics", _.reduce(topics, function(memo, next) {
                memo[next] = next;
                return memo;
            }, {}));
        };

        EventBus.prototype.publish = function(topic, message) {
            radio(this._transformTopic(topic)).broadcast(message);
        };

        EventBus.prototype.subscribe = function(topic, subscriber) {
            radio(this._transformTopic(topic)).subscribe(subscriber);
        };

        EventBus.prototype.subscribeAll = function(subscriber) {
            for (var topic in this.topics) {
                this.subscribe(topic, subscriber);
            }
        };

        EventBus.prototype.unsubscribe = function(topic, subscriber) {
            radio(this._transformTopic(topic)).unsubscribe(subscriber);
        };

        EventBus.prototype.listen = function(sourceEventBus) {
            _.extend(this.topics, sourceEventBus.topics);
            for (var topic in sourceEventBus.topics) {
                sourceEventBus.subscribe(topic, _.bind(function(message) {
                    this.publish(topic, message);
                }, this));
            }
        };

        return EventBus;
    }();

    return {
        EventBus: EventBus
    };
});
