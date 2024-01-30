// run "npm run build" to compile this file to helpers/poll.js
import satori from "satori";
import sharp from 'sharp';
import { join } from 'path';
import * as fs from "fs";
import React from "react";
import { get_poll_data } from "./dune.js";

//this should take a cast hash, then query Dune to get the poll results as a json array. Then displays them.
export async function create_image(show_results = false, cast_hash = "0xdf95758ae0435328978871bf9960a5a8aba3010d") {
  //hardcoding cast hash for now, a bit unfortunate.

  const fontPath = join(process.cwd(), 'helpers', 'Roboto-Regular.ttf');
  let fontData = fs.readFileSync(fontPath);
  let pollData = [{
    text: '1 year',
    percentOfTotal: 0,
    votes: 0
  }, {
    text: '2 years',
    percentOfTotal: 0,
    votes: 0
  }, {
    text: '3 years',
    percentOfTotal: 0,
    votes: 0
  }, {
    text: '4 years',
    percentOfTotal: 0,
    votes: 0
  }];
  if (cast_hash !== null) {
    pollData = await get_poll_data(cast_hash, pollData);
    console.log(pollData);
  }

  //get cast from neynar, split on first question mark and take from the first part only
  const title = "How long until we have 1B users onchain every month?";
  const svg = await satori( /*#__PURE__*/React.createElement("div", {
    style: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      display: 'flex',
      width: '100%',
      height: '100%',
      backgroundColor: 'f4f4f4',
      padding: 50,
      lineHeight: 1.2,
      fontSize: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      textAlign: 'center',
      color: 'lightgray'
    }
  }, title), pollData.map((opt, index) => {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: '',
        color: '#fff',
        width: '100%'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: `${show_results === 'true' ? opt.percentOfTotal : 100}%`,
        backgroundColor: show_results === 'true' ? '#007bff' : '',
        padding: 10,
        marginBottom: 10,
        borderRadius: 4,
        whiteSpace: 'nowrap',
        overflow: 'visible'
      }
    }, opt.text), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: 10,
        marginBottom: 10,
        borderRadius: 4,
        whiteSpace: 'nowrap',
        overflow: 'visible'
      }
    }, show_results === 'true' ? opt.votes + ' votes' : ''));
  }))), {
    width: 600,
    height: 400,
    fonts: [{
      data: fontData,
      name: 'Roboto',
      style: 'normal',
      weight: 400
    }]
  });

  // Convert SVG to PNG using Sharp
  const pngBuffer = await sharp(Buffer.from(svg)).toFormat('png').toBuffer();
  return pngBuffer;
}