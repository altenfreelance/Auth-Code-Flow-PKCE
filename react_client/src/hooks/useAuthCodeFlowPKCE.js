import { useEffect, useState } from "react";

import jwt_decode from "jwt-decode";

const useAuthCodeFlowPKCE = (clientId, audience, authorizeEndpoint, tokenEndpoint) => {
  var axios = require("axios").default;

  const [jwt, setJwt] = useState(null)
  const [idToken, setIdToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [jwtExpiration, setJwtExpiration] = useState(null)

  useEffect(() => {

    function startOauthFlow(clientId, audience, authorizeEndpoint) {
      var codeVerifier = generateRandomString(64);

      generateCodeChallenge(codeVerifier).then(function (codeChallenge) {
        window.sessionStorage.setItem("code_verifier", codeVerifier);

        var redirectUri = window.location.href.split('?')[0];
        var args = new URLSearchParams({
          response_type: "code",
          client_id: clientId,
          code_challenge_method: "S256",
          code_challenge: codeChallenge,
          redirect_uri: redirectUri,
          audience: audience,
          scope: "openid profile offline_access" //To enable refresh token
        });
        window.location = authorizeEndpoint + "/?" + args;
      });
    }

    var args = new URLSearchParams(window.location.search);
    var code = args.get("code");

    if (!code) { startOauthFlow(clientId, audience, authorizeEndpoint) }
  }, [clientId, audience, authorizeEndpoint])

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

            const { access_token, refresh_token, id_token } = response.data

            setJwt(access_token)
            setIdToken(id_token)
            setRefreshToken(refresh_token)
            setJwtExpiration(getJwtExpiration(access_token))


          }).catch(function (error) {
            console.error(error)
            window.location.href = window.location.href.replace(window.location.search, '')
          });
      }
    }
  }, [axios, clientId, tokenEndpoint])




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

  function getJwtExpiration(access_code) {
    const decodedJwt = jwt_decode(access_code)

    const expDate = new Date(0);
    expDate.setUTCSeconds(decodedJwt.exp);
    return expDate
  }

  async function refreshJwt() {

    var refreshOptions = {
      method: 'POST',
      url: tokenEndpoint,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: '*/*' },
      data: `grant_type=refresh_token&client_id=${clientId}&refresh_token=${refreshToken}`
    };

    const tokens = axios.request(refreshOptions)
      .then(function (response) {

        const { access_token, refresh_token } = response.data

        setJwt(access_token)
        setRefreshToken(refresh_token)
        setJwtExpiration(getJwtExpiration(access_token))

        return response.data

      }).catch(function (error) {
        console.error(error);
        alert(error)
      });
    return tokens
  }

  return [jwt, jwtExpiration, refreshJwt, idToken]

}

export default useAuthCodeFlowPKCE