const crypto = require("crypto");
const https = require("https");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    const sheetId = process.env.SHEET_ID;

    // JWT header + claim
    const header = Buffer.from(JSON.stringify({
      alg: "RS256",
      typ: "JWT"
    })).toString("base64url");

    const now = Math.floor(Date.now() / 1000);
    const claim = Buffer.from(JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    })).toString("base64url");

    const signature = crypto
      .createSign("RSA-SHA256")
      .update(`${header}.${claim}`)
      .sign(privateKey, "base64url");

    const jwt = `${header}.${claim}.${signature}`;

    // Get access token
    const token = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    }).then(res => res.json());

    // Append to sheet
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:I:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [[
            new Date().toISOString(),
            body.email,
            body.motivacija,
            body.organizacija,
            body.koncentracija,
            body.tehnike,
            body.samopouzdanje,
            body.ukupno,
            body.paket
          ]]
        })
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};