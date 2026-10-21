import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const TOKEN_ISSUER = 'baraja-btn-callback';
const TOKEN_AUDIENCE = 'btn-callback-partner-id';
const PARTNER_ID_SCOPE = 'btn:callback-partner-id:read';
const ACCESS_TOKEN_TTL_SECONDS = 900;

function getOAuthConfig() {
  const clientId = process.env.BTN_CALLBACK_OAUTH_CLIENT_ID;
  const clientSecret = process.env.BTN_CALLBACK_OAUTH_CLIENT_SECRET;
  const tokenSecret = process.env.BTN_CALLBACK_OAUTH_TOKEN_SECRET;

  if (!clientId || !clientSecret || clientSecret.length < 32 ||
    !tokenSecret || tokenSecret.length < 32) {
    return null;
  }
  return { clientId, clientSecret, tokenSecret };
}

function credentialsMatch(expected, received) {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length &&
    crypto.timingSafeEqual(expectedBytes, receivedBytes);
}

export function issueBtnCallbackAccessToken(req, res) {
  const config = getOAuthConfig();
  if (!config) {
    console.error('[BTN callback OAuth] OAuth client credentials are not configured');
    return res.status(503).json({
      error: 'server_error',
      error_description: 'BTN callback OAuth is not configured'
    });
  }

  if (req.body?.grant_type !== 'client_credentials') {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'grant_type must be client_credentials'
    });
  }

  const authorization = req.get('authorization') || '';
  const basicCredentials = authorization.match(/^Basic\s+([A-Za-z0-9+/]+=*)$/i);
  if (!basicCredentials) {
    res.set('WWW-Authenticate', 'Basic realm="BTN callback OAuth", charset="UTF-8"');
    return res.status(401).json({ error: 'invalid_client' });
  }

  const decodedCredentials = Buffer.from(basicCredentials[1], 'base64').toString('utf8');
  const separatorIndex = decodedCredentials.indexOf(':');
  if (separatorIndex < 1) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  const clientId = decodedCredentials.slice(0, separatorIndex);
  const clientSecret = decodedCredentials.slice(separatorIndex + 1);
  if (
    !credentialsMatch(config.clientId, clientId) ||
    !credentialsMatch(config.clientSecret, clientSecret)
  ) {
    res.set('WWW-Authenticate', 'Basic realm="BTN callback OAuth", charset="UTF-8"');
    return res.status(401).json({ error: 'invalid_client' });
  }

  const accessToken = jwt.sign(
    { scope: PARTNER_ID_SCOPE },
    config.tokenSecret,
    {
      algorithm: 'HS256',
      subject: config.clientId,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS
    }
  );

  return res.status(200).json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    scope: PARTNER_ID_SCOPE
  });
}

export function requireBtnCallbackOAuth(req, res, next) {
  const config = getOAuthConfig();
  if (!config) {
    console.error('[BTN callback OAuth] OAuth client credentials are not configured');
    return res.status(503).json({
      success: false,
      message: 'BTN callback OAuth is not configured'
    });
  }

  const authorization = req.get('authorization') || '';
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearerToken) {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ success: false, message: 'Bearer access token is required' });
  }

  try {
    const claims = jwt.verify(bearerToken, config.tokenSecret, {
      algorithms: ['HS256'],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    });

    if (claims.sub !== config.clientId || claims.scope !== PARTNER_ID_SCOPE) {
      return res.status(403).json({ success: false, message: 'Insufficient token scope' });
    }

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      res.set('WWW-Authenticate', 'Bearer error="invalid_token"');
      return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
    }

    console.error('[BTN callback OAuth] Access token validation failed:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to validate access token' });
  }
}
