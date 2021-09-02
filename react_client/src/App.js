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

  const [jwt, jwtExpiration, refreshJwt, idToken] = useAuthCodeFlowPKCE(clientId, audience, authorizeEndpoint, tokenEndpoint)

  // Sotre decoded jwt when we get it
  useEffect(() => {
    if (jwt) {
      const decodedJwt = jwt_decode(jwt)
      setJwtMsg(JSON.stringify(decodedJwt).replace(/,/g, `,\n    `).replace(/{/g, `{\n    `).replace(/}/g, `\n}`))
    }
  }, [jwt])

  // store decoded idToken when we get it
  useEffect(() => {
    if (idToken) {
      const decodedIdToken = jwt_decode(idToken)
      setIdMsg(JSON.stringify(decodedIdToken).replace(/,/g, `,\n    `).replace(/{/g, `{\n    `).replace(/}/g, `\n}`))
    }
  }, [idToken])

  function isTokenExpired() {
    return jwtExpiration < Date.now()
  }

  async function fetchProtectedData() {

    // Refresh token if needed
    const isExpired = isTokenExpired()
    if (isExpired) {
      console.log("We refreshed your tokens before making api call since the jwt was expired...")
    }
    else {
      console.log("Token is still valid, using it")

    }
    const token = isExpired ? (await refreshJwt()).access_token : jwt

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
            variant={"warning"}
            onClick={() => fetchProtectedData()}>
            Hit Protected End Point
          </Button>
          <p>(This will refresh your tokens if needed also; Check the console log to see if it was refreshed)</p>
          <br />
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
