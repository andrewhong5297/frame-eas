import dotenv from 'dotenv';
dotenv.config();

import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
import express from 'express';
import { eas_mint, eas_check } from './helpers/eas.js';
import { get_user_wallet } from './helpers/neynar.js';
import { create_image } from './helpers/build/poll.js';

const app = express();
app.use(express.json()); 
const base_url = process.env.IS_HEROKU ? 'https://frame-eas-a34243560586.herokuapp.com' : 'https://67a1-2603-7000-8807-4100-682c-7192-d33e-af81.ngrok-free.app' // 'http://localhost:5001';

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/user', async (req, res) => {
  const fid = req.query.fid;
  console.log(fid)
  const attest_wallet = await get_user_wallet(fid);
  res.send(attest_wallet);
});

app.get('/image', async (req, res) => {
  const showResults = req.query.show_results;
  console.log(`show result: " + ${showResults === 'true' ? 'show' : 'hide'}`) //i have no idea why the query param isn't parsing to boolean correctly

  const pngBuffer = await create_image(showResults);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'max-age=10');
  res.send(pngBuffer);
});

app.get('/base', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
      <html>
      <head>
        <title>Submit an attestation</title>
        <meta property="og:title" content="Submit an attestation">
        <meta property="og:image" content="${base_url}/image?show_results=false">
        <meta name="fc:frame" content="vNext">
        <meta name="fc:frame:image" content="${base_url}/image?show_results=false">
        <meta name="fc:frame:post_url" content="${base_url}/submit">
        <meta name="fc:frame:button:1" content="1 year">
        <meta name="fc:frame:button:2" content="2 year">
        <meta name="fc:frame:button:3" content="4 year">
        <meta name="fc:frame:button:4" content="8 year">
      </head>
      <body>
        <p>Submit your prediction</p>
      </body>
    </html>
  `);
});

app.post('/submit', async (req, res) => {
  // console.log(req.body);
  const HUB_URL = process.env['HUB_URL'] || "nemes.farcaster.xyz:2283";
  const client = getSSLHubRpcClient(HUB_URL);
  const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'));
  const result = await client.validateMessage(frameMessage);
  if (result.isOk() && result.value.valid) {
    const validatedMessage = result.value.message;
    console.log(validatedMessage)

    //get caster data from neynar api
    const fid = validatedMessage.data.fid;
    const cast_hash = validatedMessage.data.frameActionBody.castId.hash.toString('hex');

    const attest_wallet = await get_user_wallet(fid);

    console.log(attest_wallet)
    console.log('0x' + cast_hash);


    let vote_status = false;
    const existing_attestation = await eas_check(cast_hash, attest_wallet) //check if the user has already attested
    if (existing_attestation) {
      vote_status = true;
    } else {
      const attested = await eas_mint(cast_hash, fid, attest_wallet); //mint the attestation
    }

    // Return an HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>EAS Submitted!</title>
            <meta property="og:title" content="EAS Submitted">
            <meta property="og:image" content="${base_url}/image?show_results=true">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${base_url}/image?show_results=true">
            <meta name="fc:frame:post_url" content="https://google.com">
            <meta name="fc:frame:button:1" content="${vote_status ? 'Already voted' : 'Vote submitted as attestation'}">
          </head>
          <body>
            <p>Attestation submitted</p>
          </body>
        </html>`);
  }
  else {
    console.log(`Failed to validate message: ${result.error}`);
    res.status(500).send(`Failed to validate message: ${result.error}`);
    return;
  }
});

app.listen(process.env.PORT || 5001, () => {
  console.log(`app listening on port ${process.env.PORT || 5001}`);
});
