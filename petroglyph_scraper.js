const axios = require('axios').default;
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

const DB = require('./dbQueries.js');
const parser = require('./test.js').dataUploadFilter;
const sentinel = false

const dotenv = require('dotenv').config();

function apiCall(limit, offset, sentinel){
  // 1k results = ~3hrs data (5 api calls...)
  // 8k results = ~24hrs data (40 api calls...)

  function res(){ return axios.get(`${process.ENDPOINT}?limit=${limit}&offset=${offset}`).then((response) => response.data) }
  function res2(){ return axios.get(`${process.ENDPOINT}?limit=${limit}&offset=${offset+200}`).then((response) => response.data) }
  function res3(){ return axios.get(`${process.ENDPOINT}?limit=${limit}&offset=${offset+400}`).then((response) => response.data) }
  function res4(){ return axios.get(`${process.ENDPOINT}?limit=${limit}&offset=${offset+600}`).then((response) => response.data) }
  function res5(){ return axios.get(`${process.ENDPOINT}?limit=${limit}&offset=${offset+800}`).then((response) => response.data) }
  // res().then(data => console.log(data))

  // way to run multiple calls after each other, useful for getting backlog of calls
  Promise.all([res(),res2(),res3(),res4(),res5()]).then( data => {
    Parser(data)
    }
  )
}

apiCall(200, 0)

// 1609975763 Wednesday, January 6, 2021 23:29:23
// 1609964053 Wednesday, January 6, 2021 20:14:13
