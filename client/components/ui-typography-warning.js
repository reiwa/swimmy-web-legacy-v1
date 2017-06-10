import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createStyleSheet } from 'material-ui/styles'
import Typography from 'material-ui/Typography'
import customPropTypes from 'material-ui/utils/customPropTypes'
import { yellow } from 'material-ui/styles/colors'
import classNames from 'classnames'

export const styleSheet = createStyleSheet('UITypographyWarning', theme => {
  return {
    container: {
      color: yellow[900]
    }
  }
})

export default class TypographyError extends Component {
  render () {
    const {className} = this.props
    const {styleManager} = this.context
    const classes = styleManager.render(styleSheet)
    return (
      <Typography
        {...this.props}
        className={classNames(className || '', classes.container)} />
    )
  }

  static contextTypes = {
    muiFormControl: PropTypes.object,
    styleManager: customPropTypes.muiRequired
  }
}
