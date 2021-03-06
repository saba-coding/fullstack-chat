import React from 'react'

import UserContext from 'context/UserContext'
import { commentService, storageService } from 'services'
import Socket from 'socket'

const useComments = ({ sectionId }) => {
  const [comments, setComments] = React.useState([])
  const [typingState, setTypingState] = React.useState({})
  const { user: { name } } = React.useContext(UserContext)
  const soundRef = React.useRef()

  const setupSocket = React.useCallback(async () => {
    await Socket.connect({
      nsp: sectionId,
      query: {
        token: storageService.getJwtToken(),
        name
      }
    })

    Socket.socket.on('message', (newComment) => {
      setComments(state => ([...state, newComment]))
      soundRef.current.play()
    })

    let timer
    Socket.socket.on('typing/start', ({ userName }) => {
      if(timer) clearTimeout(timer)
      timer = setTimeout(() => setTypingState({}), 1000)

      setTypingState({ userName })
    })
  }, [sectionId, name, setTypingState])
  
  React.useEffect(() => {
    setupSocket()
  }, [setupSocket, sectionId, name, setTypingState])

  React.useEffect(() => {
    commentService.getComments()
      .then(({ data }) => setComments(data))
      .catch(err => console.error(err))

  }, [sectionId])

  const sendMessage = (message) => {
    Socket.socket.emit('message', { message })
  }

  const sentTyping = () => {
    Socket.socket.emit('typing')
  }

  return {
    comments,
    sendMessage,
    sentTyping,
    typingState,
    soundRef
  }
}

export default useComments
