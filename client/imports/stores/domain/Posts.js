import { Meteor } from 'meteor/meteor'
import { types } from 'mobx-state-tree'
import Post from '/lib/imports/models/Post'
import { IndexModel, Model } from './Subscription'

const PostIndex = types.compose('PostIndex', IndexModel, {
  one: types.maybe(Post),
  index: types.optional(types.array(Post), [])
}, {
  subscribeFromUnique () {
    return this.subscribe({
    }, {
      limit: 50
    })
  }
})

export default types.compose('Posts', Model, {
  map: types.maybe(types.map(PostIndex)),
  one: types.maybe(Post),
  index: types.optional(types.array(Post), [])
}, {
  subscribeFromChannelId (channelId) {
    return this.subscribe({
      channelId: channelId
    }, {
      limit: 50
    })
  },
  subscribeFromUnique (unique) {
    switch (unique) {
      default:
        return this.subscribe({
        }, {
          limit: 50
        })
    }
  },
  setFetchState (state) {
    this.fetchState = state
  },
  findFromUserId (userId) {
    const selector = {ownerId: userId}
    const options = {
      limit: 50,
      sort: {createdAt: -1}
    }
    return this.find(selector, options)
  },
  insert (next) {
    return new Promise((resolve, reject) => {
      const req = {
        isPublic: next.isPublic,
        content: next.content
      }
      if (next.replyId) {
        req.replyId = next.replyId
      }
      if (next.images) {
        req.images = next.images
      }
      if (next.channelId) {
        req.channelId = next.channelId
      }
      Meteor.call('posts.insert', req, (err, res) => {
        if (err) { reject(err) } else { resolve(res) }
      })
    })
  },
  remove (postId) {
    return new Promise((resolve, reject) => {
      Meteor.call('posts.remove', {
        postId: postId
      }, err => {
        if (err) { reject(err) } else { resolve() }
      })
    })
  },
  updateReaction (postId, name) {
    return new Promise((resolve, reject) => {
      Meteor.call('posts.updateReaction', {
        postId: postId,
        name: name
      }, (err, res) => {
        if (err) { reject(err) } else { resolve(res) }
      })
    })
  }
})