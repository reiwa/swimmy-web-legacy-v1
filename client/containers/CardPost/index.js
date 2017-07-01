import { FlowRouter } from 'meteor/kadira:flow-router'
import { inject, observer } from 'mobx-react'
import React, { Component } from 'react'
import classNames from 'classnames'
import { withStyles } from 'material-ui/styles'
import IconKeyboardArrowDown from 'material-ui-icons/KeyboardArrowDown'
import IconKeyboardArrowUp from 'material-ui-icons/KeyboardArrowUp'
import Typography from 'material-ui/Typography'
import TextField from 'material-ui/TextField'
import Button from '../../components/Button'
import Image from '../../components/UI-Image'
import Sheet from '../../components/UI-Sheet'
import SheetActions from '../../components/UI-SheetActions'
import SheetContent from '../../components/UI-SheetContent'
import utils from '/lib/utils'
import styleSheet from './index.style'

@withStyles(styleSheet)
@inject('router', 'accounts', 'posts', 'snackbar') @observer
export default class Post extends Component {
  render () {
    const {classes} = this.props
    return (
      <div>
        <Sheet hover onTouchTap={this.onOpenThread}>
          {/* username */}
          {this.props.public &&
          <SheetContent>
            <Typography className={classes.username} component='a' href={'/' + this.props.public.username}>
              @{this.props.public.username}
            </Typography>
          </SheetContent>}
          {/* content */}
          <SheetContent>
            <Typography
              className={classes.content}
              dangerouslySetInnerHTML={{__html: this.props.content}}
              component='a'
              href={'/thread/' + (this.props.reply ? this.props.reply._id : this.props._id)} />
          </SheetContent>
          {/* photo */}
          {this.props.images && this.props.images.slice()[0] &&
          <SheetContent>
            <div
              className={classNames(classes.photoImage, {
                [classes.photoImageOpen]: this.state.selectImage
              })}
              onTouchTap={this.onSelectImage}>
              <Image src={this.props.imagePath + this.props.images.slice()[0].x256} />
            </div>
          </SheetContent>}
          {/* oEmbed */}
          {this.props.extension.web &&
          this.props.extension.web.oEmbed &&
          <SheetContent>
            {this.embed(this.props.extension.web.oEmbed)}
          </SheetContent>}
          {/* web meta */}
          {this.props.extension.web &&
          this.props.extension.web.meta &&
          this.props.extension.web.meta['og:image'] &&
          <SheetContent>
            <a href={this.props.extension.web.url} target='_blank'>
              <Image src={this.props.extension.web.meta['og:image']} />
            </a>
          </SheetContent>}
          {/* web title */}
          {this.props.extension.web &&
          this.props.extension.web.meta &&
          this.props.extension.web.meta.title &&
          <SheetContent>
            <Typography
              type='subheading'
              component='a'
              href={this.props.extension.web.url}
              target='_blank'>
              {this.props.extension.web.meta.title}
            </Typography>
          </SheetContent>}
          {/* date */}
          <SheetContent>
            <Typography type='caption'> - {utils.date.since(this.props.createdAt)}</Typography>
          </SheetContent>
          {/* reply */}
          {this.props.reply &&
          <SheetContent>
            <Sheet dense hover background>
              <SheetContent href={'/thread/' + this.props.reply._id}>
                <Typography
                  className={classes.content}
                  dangerouslySetInnerHTML={{__html: this.props.reply.content}} />
              </SheetContent>
            </Sheet>
          </SheetContent>}
          {/* reaction */}
          {this.props.reactions.slice()[0] &&
          <SheetActions>
            <div className={classes.reactionRoot}>
              {this.props.reactions.map(({name, owners}) =>
                <Button dense background
                  key={name}
                  className={classes.reaction}
                  selected={!!this.props.accounts.isLogged &&
                  owners.includes(this.props.accounts.one._id)}
                  onClick={this.onUpdateReaction.bind(this, this.props._id, name)}>
                  {name + (owners.length > 0 ? ' ' + owners.length : '')}
                </Button>
              )}
            </div>
          </SheetActions>}
          {/* more */}
          {this.props.accounts.isLogged &&
          <Button dense className={classes.more} onClick={this.onOpenReply}>
            {this.state.isReply
              ? <IconKeyboardArrowUp className={classes.icon} />
              : <IconKeyboardArrowDown className={classes.icon} />}
          </Button>}
        </Sheet>
        {/* reaction */}
        {this.state.isReply &&
        <Sheet>
          <SheetActions>
            <TextField
              value={this.state.inputNewReaction}
              label='new reaction'
              InputProps={{placeholder: this.reactionPlaceholder}}
              maxLength='10'
              onChange={this.onInputNewReaction} />
          </SheetActions>
          <SheetActions align='right'>
            {this.props.accounts.isLogged &&
            this.state.isReply &&
            (this.props.ownerId === this.props.accounts.one._id) &&
            <Button onClick={this.onRemovePost.bind(this, this.props._id)}>delete</Button>}
            <Button onClick={this.onSubmitNewReaction}>push</Button>
          </SheetActions>
        </Sheet>}
      </div>
    )
  }

  reactionPlaceholder = [
    'エモい', 'それな', 'いいね', 'わかる', 'わぁ',
    'オトナ', '既読', '高まる', 'おやすん'
  ][Math.floor(Math.random() * 9)]

  state = {
    isReply: this.props.isReply || false,
    selectImage: false,
    isInputReaction: null,
    inputNewReaction: '',
    iframe: false
  }

  process = false

  embed (data) {
    const {classes} = this.props
    if (!this.state.iframe) {
      return (
        <Sheet dense background>
          <SheetActions>
            <Typography type='subheading'>
              {data.title}
            </Typography>
            <Button onClick={this.onOpenIframe}>
              タップして{data.provider_name}を読み込む
            </Button>
          </SheetActions>
        </Sheet>
      )
    }
    switch (data.provider_name) {
      case 'Vine':
      case 'SoundCloud':
        return <div className={classes.oEmbedIframe} dangerouslySetInnerHTML={{__html: data.html}} />
      default:
        return <div className={classes.oEmbed} dangerouslySetInnerHTML={{__html: data.html}} />
    }
  }

  onOpenThread (event) {
    event.persist()
    const nodeName = event.target.nodeName
    if (nodeName === 'INPUT' || nodeName === 'SPAN' || nodeName === 'BUTTON' || nodeName === 'IMG' ||
      nodeName === 'svg' ||
      nodeName === 'path' || nodeName === 'A') return
    FlowRouter.go('/thread/' + this.props._id)
  }

  onOpenThread = ::this.onOpenThread

  onOpenIframe () {
    this.setState({iframe: true})
  }

  onOpenIframe = ::this.onOpenIframe

  // 写真を選択する
  onSelectImage () {
    this.setState({selectImage: !this.state.selectImage})
  }

  onSelectImage = ::this.onSelectImage

  // リプライを開く
  onOpenReply (event) {
    event.preventDefault()
    if (this.state.isReply) {
      this.setState({isReply: false})
    } else {
      this.setState({isReply: true, inputReply: ''})
    }
  }

  onOpenReply = ::this.onOpenReply

  // 新しいリアクションを入力する
  onInputNewReaction (event) {
    event.persist()
    const value = event.target.value
    if (value.length > 20) return
    this.setState({inputNewReaction: value})
  }

  onInputNewReaction = ::this.onInputNewReaction

  // リアクションを更新する
  onUpdateReaction (postId, name) {
    if (!this.props.accounts.isLogged) {
      this.props.snackbar.requireLogin()
      return
    }
    if (this.props.router.page === 'thread') {
      this.props.posts.updateReaction(postId, name)
      .then(post => {
        this.setState({isInputReaction: false, inputNewReaction: ''})
        return this.props.posts.findOneFromId(postId)
      })
      .then(post => {
        this.props.posts.replaceOne(post)
      })
      .catch(err => {
        this.props.snackbar.error(err)
      })
      return
    }
    this.props.posts.updateReaction(postId, name)
    .then(post => {
      this.props.posts.replaceOne(post)
      this.props.posts.replaceIndex(post._id, post)
      this.setState({isReply: false, isInputReaction: false, inputNewReaction: ''})
    })
    .catch(err => {
      this.props.snackbar.error(err)
    })
  }

  // 新しいリアクションを送信する
  onSubmitNewReaction () {
    const postId = this.props._id
    const inputNewReaction = this.state.inputNewReaction
    this.onUpdateReaction(postId, inputNewReaction)
  }

  onSubmitNewReaction = ::this.onSubmitNewReaction

  // 投稿を削除する
  onRemovePost (postId) {
    const confirm = window.confirm('削除してもいいですか？')
    if (!confirm) return
    this.props.posts.remove(postId)
    .then(() => {
      this.props.posts.pullIndex(postId)
    })
    .catch(err => {
      this.props.snackbar.error(err)
    })
  }
}
