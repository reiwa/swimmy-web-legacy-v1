import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Posts } from '/imports/collection'

Meteor.methods({
  updatePostReaction (postId, req) {
    if (!this.userId) throw new Meteor.Error('not-authorized', 'ログインが必要です')

    check(postId, String)
    check(req.name, String)

    if (req.name === '') return

    const post = Posts.findOne(postId)

    const index = post.reactions.findIndex(item => item.name === req.name)
    const reaction = index !== -1 ? post.reactions[index] : null

    if (!reaction) {
      Posts.update(postId, {
        $push: {
          reactions: {
            name: req.name,
            ownerIds: [this.userId]
          }
        }
      })
    }

    if (reaction && reaction.ownerIds.length <= 1) {
      const hasOwner = reaction.ownerIds.find(item => item === this.userId)
      if (!hasOwner) {
        Posts.update(postId, {
          $push: {
            ['reactions.' + index + '.ownerIds']: this.userId
          }
        })
      }
      if (hasOwner) {
        Posts.update(postId, {
          $pull: {
            reactions: {name: req.name}
          }
        })
      }
    }

    if (reaction && reaction.ownerIds.length > 1) {
      const hasOwner = reaction.ownerIds.find(item => item === this.userId)
      if (!hasOwner) {
        Posts.update(postId, {
          $push: {
            ['reactions.' + index + '.ownerIds']: this.userId
          }
        })
      }
      if (hasOwner) {
        Posts.update(postId, {
          $pull: {
            ['reactions.' + index + '.ownerIds']: this.userId
          }
        })
      }
    }

    const next = Posts.findOne(postId, {
      fields: {
        ownerId: 0
      }
    })
    if (next.replyPostId) {
      const replyPost = Posts.findOne(post.replyPostId, {
        fields: {
          _id: 1,
          content: 1
        }
      })
      if (replyPost) {
        next.replyPost = replyPost
      } else {
        next.replyPost = {
          _id: next.replyPostId,
          content: 'この投稿は既に削除されています'
        }
      }

      return {reason: 'タグを更新しました'}
    }
  }
})
