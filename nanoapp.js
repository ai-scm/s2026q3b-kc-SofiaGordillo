import express from 'express'
import session from 'express-session'
import * as oidc from 'openid-client'

const app = express()
const PORT = 3000

// Configuración de Keycloak
const KEYCLOAK_ISSUER =
  'http://localhost:8080/realms/keycloak-demo'

const CLIENT_ID = 'dummy-app'

const REDIRECT_URI =
  'http://localhost:3000/callback'

// Sesiones de la aplicación
app.use(
  session({
    secret: 'clave-secreta-para-el-ejercicio',
    resave: false,
    saveUninitialized: false
  })
)

// Descubrimiento de la configuración de Keycloak
const config = await oidc.discovery(
  new URL(KEYCLOAK_ISSUER),
  CLIENT_ID,
  undefined,
  oidc.None(),
  {
    execute: [oidc.allowInsecureRequests]
  }
)
// Página principal
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.send(`
      <h1>Dummy Application</h1>
      <p>No estás autenticado.</p>
      <a href="/login">Iniciar sesión con Keycloak</a>
    `)
  }

  const user = req.session.user

  res.send(`
    <h1>Hola Mundo, ${user.name || user.preferred_username || user.email}</h1>
    <p>Usuario: ${user.preferred_username || 'N/A'}</p>
    <p>Email: ${user.email || 'N/A'}</p>
    <p>Autenticado mediante Keycloak</p>
    <a href="/logout">Cerrar sesión</a>
  `)
})

// Inicio del login
app.get('/login', async (req, res) => {
  const state = oidc.randomState()
  const nonce = oidc.randomNonce()
  const codeVerifier = oidc.randomPKCECodeVerifier()

  const codeChallenge =
    await oidc.calculatePKCECodeChallenge(codeVerifier)

  req.session.oauth = {
    state,
    nonce,
    codeVerifier
  }

  const authorizationUrl = oidc.buildAuthorizationUrl(
    config,
    {
      redirect_uri: REDIRECT_URI,
      scope: 'openid profile email',
      response_type: 'code',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    }
  )

  res.redirect(authorizationUrl.href)
})
// Callback de Keycloak
app.get('/callback', async (req, res) => {
  try {
    const oauth = req.session.oauth

    if (!oauth) {
      return res.status(400).send(
        'No existe una sesión OAuth válida.'
      )
    }

    const currentUrl = new URL(
      `${REDIRECT_URI}?${new URLSearchParams(req.query).toString()}`
    )

    const tokens = await oidc.authorizationCodeGrant(
      config,
      currentUrl,
      {
        expectedState: oauth.state,
        expectedNonce: oauth.nonce,
        pkceCodeVerifier: oauth.codeVerifier
      }
    )

    const claims = tokens.claims()

    req.session.user = claims
    delete req.session.oauth

    res.redirect('/')
  } catch (error) {
    console.error(error)

    res.status(500).send(`
      <h1>Error de autenticación</h1>
      <pre>${error.message}</pre>
    `)
  }
})
// Logout local
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(
    `Dummy Application ejecutándose en http://localhost:${PORT}`
  )
})

