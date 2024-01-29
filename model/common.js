//Imports
const db = require('../model/mongodb')
const { ShareServiceClient } = require("@azure/storage-file-share")
const fs = require('fs').promises
const CONFIG = require('../config/config')
let CONFIGJSON = require('../config/config.json')
const path = require('path')
const ejs = require('ejs')
const { transporter } = require('./mail')
const { BlobServiceClient } = require('@azure/storage-blob');
const uuid = require('uuid');

const errorMail = async (errorData) => {
  let templatePathUser, errorMailTo, mailOptions
  try {
    templatePathUser = path.resolve('./templates')
    errorMailTo = JSON.parse(process.env.errorMailTo)

    ejs.renderFile(`${templatePathUser}/errorHandler.ejs`,
      {
        location: errorData.location,
        funName: errorData.funName,
        logoUrl: getImageAsBase64(imagePath)
      }
      , (err, data) => {
        if (err) {
          console.log(err);
        } else {
          mailOptions = {
            from: process.env.SMTP_AUTH_USER,
            to: errorMailTo,
            subject: `Attention | Error while sending mail`,
            html: data
          }
          //Send Mail
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(`Error catching mail not sent: - ${error}`)
              return console.log(error)
            }
            console.log(`Error catching mail sent:  - ${info.messageId}`)
          })
        }
      })
  } catch (error) {
    console.log(`Error sending common/errorMail - ${error.message}`)
  }
}

const uploadBufferToAzureBlob = async (fileData) => {
  try {
    // Example usage with a buffer
    const storageAccountName = 'amsocial';
    const storageAccountKey = '5Kn3rgWEXZEvpls8VmrzoyZSrEqYoc5waWINl7GhI9nqhtr4lzRmmhgS5r6KOgL8gMaGbGBXcWI5+ASt6DBWLg==';
    const containerName = 'amsocial';
    // Create a BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(`DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccountKey};EndpointSuffix=core.windows.net`);

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Generate a unique name for the blob
    const blobName = `${uuid.v4()}${fileData.originalname}`; // Change the extension based on your buffer content type

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the buffer to the blob
    await blockBlobClient.uploadData(fileData.buffer, { blobHTTPHeaders: { blobContentType: 'image/png' } });

    // Generate and return the URL
    const blobUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}/${blobName}`;
    return blobUrl;
  } catch (error) {
    console.log(error.message)
  }
}

const otpGenerate = () => {
  try {
    let otp = Math.random().toString().substring(2, 8)
    if (otp.length !== 6) {
      otpGenerate()
    } else {
      return otp
    }
  } catch (error) {
    console.log('Error in common/otpGenerate' + error.message + '');
  }
}



module.exports = {
  otpGenerate,
  errorMail,
  uploadBufferToAzureBlob
}