import { Meteor } from 'meteor/meteor'
import collections from '/collections'

Meteor.publish('tags', function () {
  return collections.tags.find({})
})
