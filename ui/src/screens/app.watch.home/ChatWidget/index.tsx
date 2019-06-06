import './style'

import * as React from 'react'
import UiAvatar from '~/components/UiAvatar'
import cx from 'classnames'

import { useUnstated } from '~/lib/unstated'
import { AuthContainer } from '~/containers'

import axios from '~/lib/axios'
import last from '~/utils/last'
import { useReducer, useEffect, useMemo, useRef } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { usePusher } from '~/hooks/usePusher'

interface State {
  logs: AppPartyLog[]
  isLoading: boolean
}

type Action =
  | ReducerAction<'request:init'>
  | ReducerAction<'request:error'>
  | ReducerAction<'request:success', { logs: AppPartyLog[] }>
  | ReducerAction<'logs:push', { log: AppPartyLog }>

interface Props {
  party: AppParty
}

interface GroupedLog {
  type: 'activity' | 'message'
  user: AppUser
  logs: AppPartyLog[]
}

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'request:init': {
      return {
        ...state,
        isLoading: true
      }
    }

    case 'request:success': {
      return {
        ...state,
        logs: action.payload.logs,
        isLoading: false
      }
    }

    case 'request:error': {
      return {
        ...state,
        isLoading: false
      }
    }

    case 'logs:push': {
      return {
        ...state,
        logs: [...state.logs, action.payload.log]
      }
    }
  }
}

const init = {
  logs: [],
  isLoading: false
}

function ChatWidget(props: Props) {
  const auth = useUnstated(AuthContainer)

  const [state, dispatch] = useReducer(reducer, init)

  const chatbarRef = useRef<HTMLDivElement>(null)

  useAsyncEffect(
    async () => {
      dispatch({
        type: 'request:init'
      })

      const [err, res] = await axios.get(`/api/parties/${props.party.id}/logs`)

      if (err != null) {
        return dispatch({
          type: 'request:error'
        })
      }

      dispatch({
        type: 'request:success',
        payload: { logs: res.data }
      })

      chatbarRef.current.scrollTop = chatbarRef.current.scrollHeight
    },
    null,
    []
  )

  const grouped = useMemo(() => {
    return groupPartyLogs(state.logs)
  }, [state.logs])

  usePusher(`private-party.${props.party.id}`, 'activity', (event: { log: AppPartyLog }) => {
    dispatch({
      type: 'logs:push',
      payload: { log: event.log }
    })
  })

  return (
    <React.Fragment>
      <div className="watch-screen-chat" ref={chatbarRef}>
        {grouped.map((group, i) => {
          if (group.type === 'activity') {
            return (
              <div className="watch-screen-activity-group" key={i}>
                {group.logs.map(log => (
                  <div className="activity" key={log.id}>
                    <div className="avatar">
                      <UiAvatar img={log.activity.user.avatar} size="sm" />
                    </div>

                    <h6 className="ui-subheading">
                      {log.activity.user.name} {log.activity.text}.
                    </h6>
                  </div>
                ))}
              </div>
            )
          }

          return (
            <div className={cx('watch-screen-chat-group', {
              'is-self': group.user.id === auth.state.data.id
            })}>
              <div className="avatar">
                <UiAvatar img={group.user.avatar} />
              </div>

              <div className="messages">
                {group.logs.map(log => (
                  <div className="message" key={log.id}>
                    <div className="inner">{log.message.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {/* <div className="watch-screen-chat-group is-self">
          <div className="avatar">
            <UiAvatar img={require('~/assets/dummy-avatar.png')} />
          </div>

          <div className="messages">
            <div className="message">
              <div className="inner">kinda</div>
            </div>

            <div className="message">
              <div className="inner">it wasn't that bad if you ask me. it was just weird.</div>
            </div>
          </div>
        </div>

        <div className="watch-screen-chat-group">
          <div className="avatar">
            <UiAvatar img={require('~/assets/dummy-avatar.png')} />
          </div>

          <div className="messages">
            <div className="message">
              <div className="inner">what'd you think</div>
            </div>

            <div className="message">
              <div className="inner">did you like it?</div>
            </div>

            <div className="message">
              <div className="inner">hey</div>
            </div>
          </div>
        </div>

        <div className="watch-screen-chat-group is-self">
          <div className="avatar">
            <UiAvatar img={require('~/assets/dummy-avatar.png')} />
          </div>

          <div className="messages">
            <div className="message">
              <div className="inner">kinda</div>
            </div>

            <div className="message">
              <div className="inner">it wasn't that bad if you ask me. it was just weird.</div>
            </div>
          </div>
        </div>

        <div className="watch-screen-activity-group">
          <div className="activity">
            <div className="avatar">
              <UiAvatar img={require('~/assets/dummy-avatar.png')} size="sm" />
            </div>

            <h6 className="ui-subheading">Kier left the room.</h6>
          </div>

          <div className="activity">
            <div className="avatar">
              <UiAvatar img={require('~/assets/dummy-avatar.png')} size="sm" />
            </div>

            <h6 className="ui-subheading">Kier joined the room.</h6>
          </div>
        </div> */}
      </div>

      <div className="watch-screen-chatbar">
        <input type="text" className="ui-input" placeholder="Write something..." />
      </div>
    </React.Fragment>
  )
}

/**
 * This will group chat based on the criteria:
 * 
 * Suceeding logs
 * Succeeding messages sent by the same user
 */
function groupPartyLogs(logs: AppPartyLog[]): GroupedLog[] {
  if (logs.length === 0) {
    return []
  }

  const first: AppPartyLog = logs[0]

  const groups: GroupedLog[] = [{
    type: first.type,
    user: first[first.type].user,
    logs: [first]
  }]

  // Since we've initialized the group with the first log, we'll start with the second log.
  logs.slice(1).forEach(log => {
    const recent = last(groups)

    // We'll group it together based on the criteria
    if (recent.type === 'activity' || recent.user.id === log.message.user.id) {
      recent.logs.push(log)
    } else {
      // Otherwise, it probably belongs to its own group
      groups.push({
        type: log.type,
        user: log[log.type].user,
        logs: [log]
      })
    }
  })

  return groups
}

export default ChatWidget