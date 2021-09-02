import 'bootstrap/dist/css/bootstrap.min.css';

import { Container, Row, Button } from 'react-bootstrap'

import React, { useEffect, useState } from 'react';
import jwt_decode from "jwt-decode";
import { CopyBlock, dracula } from "react-code-blocks";
import useAuthCodeFlowPKCE from './hooks/useAuthCodeFlowPKCE';


const authorizeEndpoint = process.env.REACT_APP_AUTH_ENDPOINT
const tokenEndpoint = process.env.REACT_APP_TOKEN_ENDPOINT
const clientId = process.env.REACT_APP_CLIENT_ID
const audience = process.env.REACT_APP_AUDIENCE
const apiProtectedEndpoint = process.env.REACT_APP_PROTECTED_ROUTE


function App() {

  const [jwtMsg, setJwtMsg] = useState(null)
  const [idMsg, setIdMsg] = useState(null)
  const [pocJson, setPocJson] = useState(null)
  const [tokenIsExpired, setTokenIsExpired] = useState(null)

  const [jwt, jwtExpiration, refreshJwt, idToken] = useAuthCodeFlowPKCE(clientId, audience, authorizeEndpoint, tokenEndpoint)

  useEffect(() => {
    if (jwt) {
      const decodedJwt = jwt_decode(jwt)

      setJwtMsg(JSON.stringify(decodedJwt).replace(/,/g, `,\n    `).replace(/{/g, `{\n    `).replace(/}/g, `\n}`))
    }
  }, [jwt])

  useEffect(() => {
    if (idToken) {
      const decodedIdToken = jwt_decode(idToken)

      setIdMsg(JSON.stringify(decodedIdToken).replace(/,/g, `,\n    `).replace(/{/g, `{\n    `).replace(/}/g, `\n}`))
    }
  }, [idToken])

  useEffect(() => {
    const interval = setInterval(() => {
      setTokenIsExpired(isTokenExpired())
    }, 1000);
    return () => clearInterval(interval);
  }, [jwtExpiration]);

  function isTokenExpired() {
    return jwtExpiration < Date.now()
  }

  async function fetchProtectedData() {

    const token = isTokenExpired() ? (await refreshJwt()).access_token : jwt
    console.log(token)

    setPocJson(null)
    fetch(apiProtectedEndpoint, {
      method: "GET",
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "applicaiton/json",
        Authorization: `Bearer ${token}`
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


  return (
    <Container>
      {jwtMsg && jwtExpiration &&
        <Row>
          <h1>JWT</h1>
          <CopyBlock
            text={jwtMsg}
            language={"json"}
            showLineNumbers
            theme={dracula}
            codeBlock
          />
          <p>Expiration Date: <b>{getPrettyDate(jwtExpiration)}</b></p>
          {tokenIsExpired !== null && <p>Token is Expired: <b>{tokenIsExpired.toString()}</b></p>}
        </Row>
      }

      {idMsg &&
        <Row>
          <h1>ID Token</h1>
          <CopyBlock
            text={idMsg}
            language={"json"}
            showLineNumbers
            theme={dracula}
            codeBlock
          />
        </Row>
      }

      {jwt &&
        <Row>
          <Button
            variant={isTokenExpired() ? "success" : "warning"}
            onClick={() => fetchProtectedData()}>
            {!isTokenExpired() ? "Hit Protected End Point" : "Hit Protected End Point and Refresh Token"}
          </Button>
          <br />
          <hr />
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
