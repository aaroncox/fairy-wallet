import _ from 'lodash';
import React, { Component } from 'react';
import { Button } from 'semantic-ui-react';
import { styleObjectToStyleString } from './UI/utils';

type Props = {
  style: {},
  publicKey: string,
  onLogin: () => void,
  isSuccess: boolean => boolean
};

class WebViewWrapper extends Component<Props> {
  constructor() {
    super();
    this.state = {
      history: ['https://create-eos-account-for.me'],
      startUrl: 'https://create-eos-account-for.me',
      success: false
    };
    this.webViewContainer = React.createRef();
  }

  componentDidMount() {
    const { style } = this.props;
    this.webViewContainer.current.innerHTML = `<webview style="${styleObjectToStyleString(
      style
    )}"/>`;
    const wv = this.webViewContainer.current.querySelector('webview');
    this.webview = wv;

    const callbackSetup = () => {
      wv.addEventListener('will-navigate', this.willNavigate);
      wv.addEventListener('dom-ready', this.domReady);
      this.domReady();

      wv.removeEventListener('dom-ready', callbackSetup);
    };
    wv.addEventListener('dom-ready', callbackSetup);

    wv.src = this.state.startUrl;
  }

  willNavigate = event => {
    if (event.url !== _.last(this.state.history)) {
      this.setState(prevState => ({
        history: _.concat(prevState.history, event.url)
      }));
    }

    if (event.url.indexOf('/account?account_name=') > 0)
      this.setState({ success: true });

    this.props.isSuccess(this.state.success);
  };

  domReady = () => {
    const { webview } = this;
    const { publicKey } = this.props;

    const prefillScript = `(function() {
      const event = new Event('change');
      const ownerKey = document.getElementsByName("ownerPublicKey")[0];
      if(ownerKey) {
        ownerKey.value = "${publicKey}";
        ownerKey.dispatchEvent(event);
      }
      const activeKey = document.getElementsByName("activePublicKey")[0];
      if(activeKey) {
        activeKey.value = "${publicKey}";
        activeKey.dispatchEvent(event);
      }
      document.querySelectorAll(".menu.left ul > li:last-child")[0].innerHTML = "";
      const button = document.querySelectorAll(".btn-create.inicis")[0];
      button.parentNode.removeChild(button);
    })()`;

    webview.executeJavaScript(prefillScript, true, null);
  };

  goBack = () => {
    const { history } = this.state;
    if (history.length > 1) history.pop();
    this.webview.src = _.last(history);
    this.setState({ history });
  };

  render() {
    const { style } = this.props;
    const { history, success } = this.state;
    const buttonText = !success ? 'Back' : 'Login';

    return (
      <div className="web-view">
        <div className="web-view-navigation">
          <Button
            icon="arrow left"
            disabled={history.length === 1}
            onClick={this.goBack}
          />
          <input disabled type="url" value={_.last(history)} />
        </div>
        <div style={style} ref={this.webViewContainer} />
        <div className="public-key-confirm-modal">
          <Button content={buttonText} onClick={this.props.onLogin} />
        </div>
      </div>
    );
  }
}

export default WebViewWrapper;
