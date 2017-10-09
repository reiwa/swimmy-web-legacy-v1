import { types } from 'mobx-state-tree'
import { createModel } from '/imports/packages/Sub'
import Thread from '/imports/models/Thread'

export default types
.model('Thread', {
  model: createModel(Thread)
})