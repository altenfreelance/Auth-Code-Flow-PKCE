import 'bootstrap/dist/css/bootstrap.min.css';

import { Container, Row, Button } from 'react-bootstrap'

import React, { useEffect, useState } from 'react';
import jwt_decode from "jwt-decode";
import { CopyBlock, dracula } from "react-code-blocks";
var axios = require("axios").default;


const authorizeEndpoint = process.env.REACT_APP_AUTH_ENDPOINT
const tokenEndpoint = process.env.REACT_APP_TOKEN_ENDPOINT
const clientId = process.env.REACT_APP_CLIENT_ID
const audience = process.env.REACT_APP_AUDIENCE
const apiProtectedEndpoint = process.env.REACT_APP_PROTECTED_ROUTE


function App() {

  const [jwtMsg, setJwtMsg] = useState(null)
  const [refreshMsg, setRefreshMsg] = useState(null)
  const [jwt, setJwt] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [jwtExpirationDate, setJwtExpirationDate] = useState(null)
  const [pocJson, setPocJson] = useState(null)

  const [tokenIsExpired, setTokenIsExpired] = useState(null)

  useEffect(()=>{
    var args = new URLSearchParams(window.location.search);
      var code = args.get("code");

    if (!code){

      startOauthFlow()
    }
  
  },[])

  useEffect(() => {
    if (window.location.search) {
      var args = new URLSearchParams(window.location.search);
      var code = args.get("code");

      if (code) {
       
        var accessTokenOptions = {
          method: 'POST',
          url: tokenEndpoint,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: '*/*' },
          data: `client_id=${clientId}&code_verifier=${window.sessionStorage.getItem("code_verifier")}&grant_type=authorization_code&redirect_uri=${window.location.href.replace(window.location.search, '')}&code=${code}`
        };
    
        axios.request(accessTokenOptions)
          .then(function (response) {
    
            const { access_token, refresh_token } = response.data

            setTheTokens(access_token, refresh_token)
          
          }).catch(function (error) {
            console.log(error)

            window.location.href = window.location.href.replace(window.location.search, '')
          });
      }
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTokenIsExpired(jwtExpirationDate < now)
    }, 1000);
    return () => clearInterval(interval);
  }, [jwtExpirationDate]);

  function setTheTokens(access_token, refresh_token){
    setJwt(access_token)
    setRefreshToken(refresh_token)

    const decodedJwt = jwt_decode(access_token)

    const expDate = new Date(0);
    expDate.setUTCSeconds(decodedJwt.exp);
    setJwtExpirationDate(expDate)

    // put attrs on new lines
    setJwtMsg(JSON.stringify(decodedJwt).replace(/,/g, `,\n    `).replace(/{/g, `{\n    `).replace(/}/g, `\n}`))
    setRefreshMsg(refresh_token)
  }

  function refreshJwtAxios() {

    var refreshOptions = {
      method: 'POST',
      url: tokenEndpoint,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: '*/*' },
      data: `grant_type=refresh_token&client_id=${clientId}&refresh_token=${refreshToken}`
    };

    axios.request(refreshOptions)
      .then(function (response) {
        console.log(response, "response")

        const { access_token, refresh_token } = response.data

        setTheTokens(access_token, refresh_token)

      }).catch(function (error) {
        console.error(error);
        alert(error)
      });
  }


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

  function hitProtectedEndpoint() {
    setPocJson(null)

    fetch(apiProtectedEndpoint, {
      method: "GET",
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "applicaiton/json",
        Authorization: `Bearer ${jwt}`
      }
    })
      .then(res => res.json())
      .then(res => setPocJson(JSON.stringify(res)))
      .catch(err => {
        console.log(err)
        alert("Something went wrong")
      })
  }

  function getPrettyDate(date) {
    return date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes()
  }

  function startOauthFlow() {
    var codeVerifier = generateRandomString(64);

    generateCodeChallenge(codeVerifier).then(function (codeChallenge) {
      // setCode(codeChallenge)
      window.sessionStorage.setItem("code_verifier", codeVerifier);

      var redirectUri = window.location.href.split('?')[0];
      var args = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
        audience: audience,
        scope: "offline_access" //To enable refresh token
      });
      window.location = authorizeEndpoint + "/?" + args;
    });
  }

  return (
    <Container>
      {jwtMsg && jwtExpirationDate &&
        <Row>
          <h1>JWT</h1>
          <CopyBlock
            text={jwtMsg}
            language={"json"}
            showLineNumbers
            theme={dracula}
            codeBlock
          />
          <p>Expiration Date: <b>{getPrettyDate(jwtExpirationDate)}</b></p>
          {tokenIsExpired !== null && <p>Token is Expired: <b>{tokenIsExpired.toString()}</b></p>}
          {tokenIsExpired && <Button variant="success" onClick={() => { refreshJwtAxios() }}>Refresh token</Button>
          }
        </Row>
      }
      {jwt &&
        <Row>
          <Button variant="warning" onClick={() => hitProtectedEndpoint()}>Hit Protected End Point</Button>
          <br />
          <hr />
        </Row>
      }
      {refreshMsg &&
        <Row>
          <br />
          <hr />
          <h1>Refresh Token</h1>
          <CopyBlock
            text={refreshMsg}
            // language={"txt"}
            showLineNumbers
            theme={dracula}
            codeBlock
          />
        </Row>
      }
      {pocJson &&
        <Row>
          <br />
          <hr />
          <h1>Protected Endpoint Response</h1>
          <CopyBlock
            text={pocJson}
            language={"json"}
            showLineNumbers
            theme={dracula}
            codeBlock
          />
        </Row>
      }


    </Container>
  );
}

export default App;
