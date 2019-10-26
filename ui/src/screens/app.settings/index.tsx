import './style'

import * as React from 'react'
import UiAvatar from '~/components/UiAvatar'
import { Link } from 'react-router-dom'

import AppHeadingSettings from '~/screens/app/AppHeadingSettings'
import { useAuth } from '~/contexts/Auth'
import { useIsPWA } from '~/hooks/useIsPWA'
import useWindowSize from 'react-use/lib/useWindowSize'

import asset_author from '~/assets/author.jpg'

/**
 * Use this to create a route instead of typing everything down
 */
function AppSettings(props: ReactComponentWrapper) {
  const auth = useAuth()
  const isPWA = useIsPWA()
  const { width } = useWindowSize()

  return (
    <React.Fragment>
      <AppHeadingSettings title="Settings" backUrl="/" />
      
      <div className="settings-page">
        <div className="settings-user-info">
          <div className="avatar">
            <UiAvatar img={auth.data.avatar} size="l" />
          </div>

          <div className="info">
            <h2 className="name">{auth.data.name}</h2>
            <div className="description">
              <h6 className="ui-subheading">
                View Your Profile
              </h6>
            </div>
          </div>

          <div className="caret">
            <i className="fa fa-angle-right"></i>
          </div>
        </div>

        <div className="settings-menu-list">
          <Link to="/settings/profile" className="item">
            <div className="icon">
              <i className="fa fa-cog"></i>
            </div>

            <div className="text">
              Account settings
            </div>

            <div className="caret">
              <i className="fa fa-angle-right"></i>
            </div>
          </Link>

          <Link to="/settings/password" className="item">
            <div className="icon">
              <i className="fa fa-lock"></i>
            </div>

            <div className="text">
              Update password
            </div>

            <div className="caret">
              <i className="fa fa-angle-right"></i>
            </div>
          </Link>

          {width <= 1120 && !isPWA && (
            <Link to="/download" className="item">
              <div className="icon">
                <i className="fa fa-android"></i>
              </div>

              <div className="text">
                Download the app
              </div>

              <div className="caret">
                <i className="fa fa-angle-right"></i>
              </div>
            </Link>
          )}

          <Link to="/logout" className="item">
            <div className="icon">
              <i className="fa fa-long-arrow-left"></i>
            </div>

            <div className="text">
              Logout
            </div>

            <div className="caret">
              <i className="fa fa-angle-right"></i>
            </div>
          </Link>
        </div>

        <div className="settings-credits">
          <div className="avatar">
            <UiAvatar img={asset_author} size="m" />
          </div>

          <h6 className="ui-subheading">Crafted by Kier Borromeo</h6>
        </div>
      </div>
    </React.Fragment>
  )
}

export default AppSettings