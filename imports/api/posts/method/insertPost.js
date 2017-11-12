import { unlink, writeFileSync } from 'fs'
import { join } from 'path'

import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Random } from 'meteor/random'

import Jimp from 'jimp'

import extendWeb from '/imports/api/packages/extendWeb'
import { Posts } from '/imports/collection'
import upload from '/imports/utils/google/upload'

Meteor.methods({
  async insertPost (req) {
    check(req.isPublic, Boolean)
    check(req.content, String)

    if (req.images) {
      check(req.images, Array)
    } else {
      if (req.content === '') return
    }

    if (!req.images && req.content.length < 1) {
      throw new Meteor.Error('ignore', '入力がありません')
    }

    const date = new Date()

    const data = {
      content: req.content,
      reactions: [],
      repliedPostIds: [],
      extension: {},
      createdAt: date,
      updatedAt: date,
      from: 'swimmy'
    }

    data.ownerId = this.userId

    if (req.isPublic) {
      if (!this.userId) throw new Meteor.Error('not-authorized')
      const user = Meteor.users.findOne(this.userId)
      data.owner = {
        username: user.username
      }
    }

    if (req.images) {
      const {projectId} = Meteor.settings.private.googleCloud
      if (projectId) {
        const image = await uploadImage(date, req.images[0])
        data.images = [image]
      } else {
        throw new Meteor.Error('reject', '画像の投稿はできません')
      }
    }

    const web = extendWeb(req.content, date)

    if (web) { data.web = web }

    if (req.replyPostId) {
      check(req.replyPostId, String)
      const replyPost = Posts.findOne(req.replyPostId)
      if (replyPost) {
        data.replyPostId = replyPost._id
      } else {
        data.replyPostId = req.replyPostId
      }
      if (replyPost.channelId) {
        data.channelId = replyPost.channelId
      }
    }

    const postId = Posts.insert(data)

    if (data.replyPostId) {
      Posts.update(data.replyPostId, {
        $push: {repliedPostIds: postId},
        $set: {updatedAt: date}
      })
    }

    return {reason: '投稿が完了しました'}
  }
})

async function uploadImage (date, base64) {
  const buf = Buffer.from(base64, 'base64')

  const ext = '.jpg'
  const name = Random.id()

  const temp = join('/tmp', name + ext)

  writeFileSync(temp, buf)

  const fileName = {
    full: name + ext,
    x128: name + '.x128' + ext,
    x256: name + '.x256' + ext,
    x512: name + '.x512' + ext,
    x1024: name + '.x1024' + ext
  }

  const bucketName = 'swimmy'

  const datePath = [
    date.getFullYear(),
    ('00' + (date.getUTCMonth() + 1)).slice(-2),
    ('00' + date.getUTCDate()).slice(-2)
  ].join('/')

  const filePath = {
    full: join(datePath, fileName.full),
    x256: join(datePath, fileName.x256),
    x512: join(datePath, fileName.x512),
    x1024: join(datePath, fileName.x1024)
  }

  await upload(bucketName, temp, filePath.full)

  // x256
  const x256 = join(process.env.PWD, '/tmp', fileName.x256)
  const x256Ref = await Jimp.read(temp)
  x256Ref
  .resize(512, Jimp.AUTO)
  .exifRotate()
  .write(x256)

  await upload(bucketName, x256, filePath.x256)

  unlink(x256, err => err)

  // x512
  const x512 = join(process.env.PWD, '/tmp', fileName.x512)
  const x512Ref = await Jimp.read(temp)
  x512Ref
  .resize(512, Jimp.AUTO)
  .exifRotate()
  .write(x512)

  await upload(bucketName, x512, filePath.x512)

  unlink(x512, err => err)

  // x1024
  const x1024 = join(process.env.PWD, '/tmp', fileName.x512)
  const x1024Ref = await Jimp.read(temp)
  x1024Ref
  .resize(1024, Jimp.AUTO)
  .exifRotate()
  .write(x512)

  await upload(bucketName, x1024, filePath.x1024)

  unlink(x1024, err => err)

  unlink(temp, err => err)

  return {
    full: fileName.full,
    x256: fileName.x256,
    x512: fileName.x512,
    x1024: fileName.x1024
  }
}
