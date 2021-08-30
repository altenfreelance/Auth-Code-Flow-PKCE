import 'bootstrap/dist/css/bootstrap.min.css';

import {Container, Row, Button} from 'react-bootstrap'

import React, {useEffect, useState} from 'react';
import jwt_decode from "jwt-decode";
import { CopyBlock, dracula } from "react-code-blocks";

const authorizeEndpoint = process.env.REACT_APP_AUTH_ENDPOINT
const tokenEndpoint =  process.env.REACT_APP_TOKEN_ENDPOINT
const clientId =  process.env.REACT_APP_CLIENT_ID
const audience =  process.env.REACT_APP_AUDIENCE


function App() {

  const [code, setCode] = useState(null)
  const [msg, setMsg] = useState(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    if (window.location.search) {
      var args = new URLSearchParams(window.location.search);
      var code = args.get("code");

      if (code) {
          var xhr = new XMLHttpRequest();

          xhr.onload = function() {
              var response = xhr.response;

              if (xhr.status === 200) {
                  setAuthenticated(true)
                  const jwt_decoded= jwt_decode(response.access_token)
                  console.log(jwt_decoded)
                  setMsg(JSON.stringify(jwt_decoded))

              }
              else {
                  setMsg("Error: " + response.error_description + " (" + response.error + ")")
                }
          };
          xhr.responseType = 'json';
          xhr.open("POST", tokenEndpoint, true);
          xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
          xhr.send(new URLSearchParams({
              client_id: clientId,
              code_verifier: window.sessionStorage.getItem("code_verifier"),
              grant_type: "authorization_code",
              redirect_uri: window.location.href.replace(window.location.search, ''),
              code: code
          }));
      }
  }
  },[code])

  function generateRandomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

async function generateCodeChallenge(codeVerifier) {
  var digest = await crypto.subtle.digest("SHA-256",
      new TextEncoder().encode(codeVerifier));

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

  function startOauthFlow() {
    var codeVerifier = generateRandomString(64);

    generateCodeChallenge(codeVerifier).then(function(codeChallenge) {
      setCode(codeChallenge)
        window.sessionStorage.setItem("code_verifier", codeVerifier);

        var redirectUri = window.location.href.split('?')[0];
        var args = new URLSearchParams({
            response_type: "code",
            client_id: clientId,
            code_challenge_method: "S256",
            code_challenge: codeChallenge,
            redirect_uri: redirectUri,
            audience: audience
        });
        window.location = authorizeEndpoint + "/?" + args;
    });
  }

  return (
    <Container>
      <Row>
        <Button onClick={() => startOauthFlow()}>Start OAuth2 PKCE Flow</Button>
      </Row>
      {authenticated && msg &&
        <Row>
          <CopyBlock
                text={msg}
                language={"json"}
                showLineNumbers
                theme={dracula}
                codeBlock
                wrapLines
            />
        </Row>
      }

    </Container>
  );
}

export default App;
